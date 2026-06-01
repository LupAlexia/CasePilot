using System.Security.Cryptography;
using CasePilot.Api.DTOs.Requests;
using CasePilot.Api.DTOs.Responses;
using CasePilot.Api.Models;
using CasePilot.Api.Services.Interfaces;
using CasePilot.Api.Storage;
using Microsoft.EntityFrameworkCore;

namespace CasePilot.Api.Services;

public class AuthService : IAuthService
{
    private readonly CasePilotDbContext _context;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthService> _logger;
    private readonly IEmailService _emailService;

    public AuthService(
        CasePilotDbContext context,
        IJwtTokenService jwtTokenService,
        IConfiguration configuration,
        ILogger<AuthService> logger,
        IEmailService emailService)
    {
        _context = context;
        _jwtTokenService = jwtTokenService;
        _configuration = configuration;
        _logger = logger;
        _emailService = emailService;
    }

    // ════════════════════════════════════════════════════════════════
    //  STEP 1 — Validate credentials, generate OTP, return verification token
    // ════════════════════════════════════════════════════════════════

    public LoginStepResponse LoginStep1(string email, string password)
    {
        var user = _context.Users
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                    .ThenInclude(r => r.RolePermissions)
                        .ThenInclude(rp => rp.Permission)
            .FirstOrDefault(u => u.Email == email && u.IsActive);

        if (user is null)
            return new LoginStepResponse { RequiresVerification = false, LoginData = null };

        // Try BCrypt hash first, fall back to plain-text for migration
        bool passwordValid;
        if (!string.IsNullOrEmpty(user.PasswordHash))
        {
            passwordValid = BCrypt.Net.BCrypt.Verify(password, user.PasswordHash);
        }
        else
        {
            // Legacy plain-text fallback; upgrade hash on successful match
            passwordValid = user.Password == password;
            if (passwordValid)
            {
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(password);
                _context.SaveChanges();
            }
        }

        if (!passwordValid)
            return new LoginStepResponse { RequiresVerification = false, LoginData = null };

        // ── Generate 6-digit verification code ──────────────────
        var code = GenerateNumericCode(6);
        var verificationToken = GenerateSecureToken();

        // Invalidate any existing unused codes for this user
        var existingCodes = _context.EmailVerificationCodes
            .Where(c => c.UserId == user.Id && !c.IsUsed)
            .ToList();
        foreach (var existing in existingCodes)
            existing.IsUsed = true;

        _context.EmailVerificationCodes.Add(new EmailVerificationCode
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Code = code,
            VerificationToken = verificationToken,
            ExpiresAt = DateTime.UtcNow.AddMinutes(10),
            CreatedAt = DateTime.UtcNow,
            IsUsed = false
        });
        _context.SaveChanges();

        // Fire-and-forget — email failure must never block the login response
        _ = _emailService.SendOtpAsync(user.Email, code);

        return new LoginStepResponse
        {
            RequiresVerification = true,
            VerificationToken = verificationToken,
            MaskedEmail = MaskEmail(user.Email)
        };
    }

    // ════════════════════════════════════════════════════════════════
    //  STEP 2 — Verify OTP code, issue JWT + refresh tokens + session
    // ════════════════════════════════════════════════════════════════

    public LoginResponse? LoginStep2VerifyCode(string verificationToken, string code, string ipAddress, string userAgent)
    {
        var verification = _context.EmailVerificationCodes
            .Include(v => v.User)
                .ThenInclude(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                        .ThenInclude(r => r.RolePermissions)
                            .ThenInclude(rp => rp.Permission)
            .FirstOrDefault(v => v.VerificationToken == verificationToken && !v.IsUsed);

        if (verification is null)
            return null;

        if (verification.ExpiresAt <= DateTime.UtcNow)
            return null;

        if (verification.Code != code)
            return null;

        if (!verification.User.IsActive)
            return null;

        // Mark code as used
        verification.IsUsed = true;
        _context.SaveChanges();

        // Build login response with session
        return BuildLoginResponse(verification.User, ipAddress, userAgent);
    }

    // ════════════════════════════════════════════════════════════════
    //  Resend verification code
    // ════════════════════════════════════════════════════════════════

    public bool ResendVerificationCode(string verificationToken)
    {
        var existing = _context.EmailVerificationCodes
            .Include(v => v.User)
            .FirstOrDefault(v => v.VerificationToken == verificationToken && !v.IsUsed);

        if (existing is null || existing.ExpiresAt <= DateTime.UtcNow)
            return false;

        // Invalidate old code
        existing.IsUsed = true;

        // Generate new code with a new verification token
        var newCode = GenerateNumericCode(6);
        var newVerificationToken = GenerateSecureToken();

        _context.EmailVerificationCodes.Add(new EmailVerificationCode
        {
            Id = Guid.NewGuid(),
            UserId = existing.UserId,
            Code = newCode,
            VerificationToken = newVerificationToken,
            ExpiresAt = DateTime.UtcNow.AddMinutes(10),
            CreatedAt = DateTime.UtcNow,
            IsUsed = false
        });
        _context.SaveChanges();

        _ = _emailService.SendOtpAsync(existing.User.Email, newCode);

        return true;
    }

    // ════════════════════════════════════════════════════════════════
    //  Register
    // ════════════════════════════════════════════════════════════════

    public LoginResponse Register(RegisterRequest request)
    {
        // Check if email already exists
        if (_context.Users.Any(u => u.Email == request.Email))
            throw new Exception("Un utilizator cu acest email există deja.");

        var user = new AppUser
        {
            Id = Guid.NewGuid(),
            Email = request.Email,
            Password = string.Empty, // No longer store plain text
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            FullName = request.FullName,
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };

        _context.Users.Add(user);

        // Assign default "User" role
        var userRole = _context.Roles.FirstOrDefault(r => r.Name == "User");
        if (userRole is not null)
        {
            _context.UserRoles.Add(new AppUserRole
            {
                UserId = user.Id,
                RoleId = userRole.Id
            });
        }

        _context.SaveChanges();

        // Reload with navigation properties
        var createdUser = _context.Users
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                    .ThenInclude(r => r.RolePermissions)
                        .ThenInclude(rp => rp.Permission)
            .First(u => u.Id == user.Id);

        return BuildLoginResponse(createdUser, "registration", "registration");
    }

    // ════════════════════════════════════════════════════════════════
    //  Refresh token
    // ════════════════════════════════════════════════════════════════

    public LoginResponse? RefreshToken(string refreshToken, string ipAddress, string userAgent)
    {
        var storedToken = _context.RefreshTokens
            .Include(rt => rt.User)
                .ThenInclude(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                        .ThenInclude(r => r.RolePermissions)
                            .ThenInclude(rp => rp.Permission)
            .FirstOrDefault(rt => rt.Token == refreshToken && !rt.IsRevoked);

        if (storedToken is null || storedToken.ExpiresAt <= DateTime.UtcNow)
            return null;

        if (!storedToken.User.IsActive)
            return null;

        // Revoke old refresh token (rotation)
        storedToken.IsRevoked = true;
        _context.SaveChanges();

        return BuildLoginResponse(storedToken.User, ipAddress, userAgent);
    }

    // ════════════════════════════════════════════════════════════════
    //  Revoke tokens
    // ════════════════════════════════════════════════════════════════

    public void RevokeRefreshToken(string refreshToken)
    {
        var storedToken = _context.RefreshTokens
            .FirstOrDefault(rt => rt.Token == refreshToken);

        if (storedToken is not null)
        {
            storedToken.IsRevoked = true;
            _context.SaveChanges();
        }
    }

    public void RevokeAllUserTokens(Guid userId)
    {
        var tokens = _context.RefreshTokens
            .Where(rt => rt.UserId == userId && !rt.IsRevoked)
            .ToList();

        foreach (var token in tokens)
        {
            token.IsRevoked = true;
        }

        // Also revoke all sessions
        var sessions = _context.UserSessions
            .Where(s => s.UserId == userId && !s.IsRevoked)
            .ToList();

        foreach (var session in sessions)
        {
            session.IsRevoked = true;
        }

        _context.SaveChanges();
    }

    // ════════════════════════════════════════════════════════════════
    //  Password Recovery — Forgot Password
    // ════════════════════════════════════════════════════════════════

    public bool ForgotPassword(string email)
    {
        var user = _context.Users.FirstOrDefault(u => u.Email == email && u.IsActive);

        // Always return true to prevent email enumeration attacks
        if (user is null)
        {
            _logger.LogInformation("Password reset requested for non-existent email: {Email}", email);
            return true;
        }

        // Invalidate existing reset tokens
        var existingTokens = _context.PasswordResetTokens
            .Where(t => t.UserId == user.Id && !t.IsUsed)
            .ToList();
        foreach (var existing in existingTokens)
            existing.IsUsed = true;

        var resetToken = GenerateSecureToken();

        _context.PasswordResetTokens.Add(new PasswordResetToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Token = resetToken,
            ExpiresAt = DateTime.UtcNow.AddHours(1),
            CreatedAt = DateTime.UtcNow,
            IsUsed = false
        });
        _context.SaveChanges();

        var frontendBase = _configuration["Frontend:BaseUrl"]?.TrimEnd('/') ?? "http://localhost:5173";
        var resetLink = $"{frontendBase}/reset-password?token={Uri.EscapeDataString(resetToken)}";

        _ = _emailService.SendPasswordResetAsync(user.Email, resetLink);

        return true;
    }

    // ════════════════════════════════════════════════════════════════
    //  Change Password (while logged in)
    // ════════════════════════════════════════════════════════════════

    public bool ChangePassword(Guid userId, string currentPassword, string newPassword)
    {
        var user = _context.Users.Find(userId);
        if (user is null) return false;

        bool valid = !string.IsNullOrEmpty(user.PasswordHash)
            ? BCrypt.Net.BCrypt.Verify(currentPassword, user.PasswordHash)
            : user.Password == currentPassword;

        if (!valid) return false;

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
        user.Password = string.Empty;
        RevokeAllUserTokens(userId);
        _context.SaveChanges();
        return true;
    }

    // ════════════════════════════════════════════════════════════════
    //  Password Recovery — Reset Password
    // ════════════════════════════════════════════════════════════════

    public bool ResetPassword(string token, string newPassword)
    {
        var resetToken = _context.PasswordResetTokens
            .Include(t => t.User)
            .FirstOrDefault(t => t.Token == token && !t.IsUsed);

        if (resetToken is null)
            return false;

        if (resetToken.ExpiresAt <= DateTime.UtcNow)
            return false;

        // Mark token as used
        resetToken.IsUsed = true;

        // Update password
        resetToken.User.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
        resetToken.User.Password = string.Empty; // Clear legacy plain-text

        // Revoke all existing tokens/sessions for security
        RevokeAllUserTokens(resetToken.UserId);

        _context.SaveChanges();

        _logger.LogInformation("Password reset completed for user {Email}", resetToken.User.Email);

        return true;
    }

    // ════════════════════════════════════════════════════════════════
    //  Session Management
    // ════════════════════════════════════════════════════════════════

    public List<SessionResponse> GetActiveSessions(Guid userId, Guid? currentSessionId)
    {
        return _context.UserSessions
            .Where(s => s.UserId == userId && !s.IsRevoked)
            .OrderByDescending(s => s.LastActivityAt)
            .Select(s => new SessionResponse
            {
                Id = s.Id,
                IpAddress = s.IpAddress,
                UserAgent = s.UserAgent,
                CreatedAt = s.CreatedAt,
                LastActivityAt = s.LastActivityAt,
                IsCurrent = currentSessionId.HasValue && s.Id == currentSessionId.Value
            })
            .ToList();
    }

    public bool RevokeSession(Guid userId, Guid sessionId)
    {
        var session = _context.UserSessions
            .FirstOrDefault(s => s.Id == sessionId && s.UserId == userId && !s.IsRevoked);

        if (session is null)
            return false;

        session.IsRevoked = true;

        // Also revoke the associated refresh token
        var refreshToken = _context.RefreshTokens
            .FirstOrDefault(rt => rt.Id.ToString() == session.RefreshTokenId && !rt.IsRevoked);
        if (refreshToken is not null)
            refreshToken.IsRevoked = true;

        _context.SaveChanges();
        return true;
    }

    public void UpdateSessionActivity(Guid sessionId)
    {
        var session = _context.UserSessions
            .FirstOrDefault(s => s.Id == sessionId && !s.IsRevoked);

        if (session is not null)
        {
            session.LastActivityAt = DateTime.UtcNow;
            _context.SaveChanges();
        }
    }

    // ════════════════════════════════════════════════════════════════
    //  Private helpers
    // ════════════════════════════════════════════════════════════════

    private LoginResponse BuildLoginResponse(AppUser user, string ipAddress, string userAgent)
    {
        var roles = user.UserRoles.Select(ur => ur.Role.Name).ToList();

        var permissions = user.UserRoles
            .SelectMany(ur => ur.Role.RolePermissions)
            .Select(rp => rp.Permission.Name)
            .Distinct()
            .ToList();

        var expirationMinutes = int.Parse(_configuration["Jwt:AccessTokenExpirationMinutes"] ?? "30");
        var refreshTokenDays = int.Parse(_configuration["Jwt:RefreshTokenExpirationDays"] ?? "7");

        var refreshToken = _jwtTokenService.GenerateRefreshToken();

        // Store refresh token
        var refreshTokenEntity = new Models.RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Token = refreshToken,
            ExpiresAt = DateTime.UtcNow.AddDays(refreshTokenDays),
            CreatedAt = DateTime.UtcNow,
            IsRevoked = false
        };
        _context.RefreshTokens.Add(refreshTokenEntity);

        // Create server-side session
        var session = new UserSession
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            RefreshTokenId = refreshTokenEntity.Id.ToString(),
            IpAddress = ipAddress ?? "unknown",
            UserAgent = userAgent ?? "unknown",
            CreatedAt = DateTime.UtcNow,
            LastActivityAt = DateTime.UtcNow,
            IsRevoked = false
        };
        _context.UserSessions.Add(session);

        // Generate access token with sessionId embedded
        var accessToken = _jwtTokenService.GenerateAccessToken(user, roles, permissions, session.Id);

        _context.SaveChanges();

        return new LoginResponse
        {
            Id = user.Id,
            Email = user.Email,
            FullName = user.FullName,
            Roles = roles,
            Permissions = permissions,
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            AccessTokenExpiration = DateTime.UtcNow.AddMinutes(expirationMinutes),
            SessionId = session.Id
        };
    }

    private static string GenerateNumericCode(int length)
    {
        var random = RandomNumberGenerator.Create();
        var bytes = new byte[4];
        random.GetBytes(bytes);
        var number = Math.Abs(BitConverter.ToInt32(bytes, 0)) % (int)Math.Pow(10, length);
        return number.ToString().PadLeft(length, '0');
    }

    private static string GenerateSecureToken()
    {
        var bytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(bytes);
        return Convert.ToBase64String(bytes);
    }

    private static string MaskEmail(string email)
    {
        var parts = email.Split('@');
        if (parts.Length != 2) return "***@***.***";

        var local = parts[0];
        var domain = parts[1];

        var maskedLocal = local.Length <= 2
            ? local[0] + "***"
            : local[0] + new string('*', local.Length - 2) + local[^1];

        return $"{maskedLocal}@{domain}";
    }
}
