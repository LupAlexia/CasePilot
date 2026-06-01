using CasePilot.Api.DTOs.Requests;
using CasePilot.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CasePilot.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IAuditService _auditService;
    private readonly IThreatDetectionService _threatDetectionService;

    public AuthController(
        IAuthService authService,
        IAuditService auditService,
        IThreatDetectionService threatDetectionService)
    {
        _authService = authService;
        _auditService = auditService;
        _threatDetectionService = threatDetectionService;
    }

    // ════════════════════════════════════════════════════════════════
    //  3-Way Authentication — Step 1: Credentials
    // ════════════════════════════════════════════════════════════════

    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginRequest request)
    {
        var result = _authService.LoginStep1(request.Email, request.Password);

        if (!result.RequiresVerification && result.LoginData is null)
        {
            // Credentials invalid
            _threatDetectionService.Analyze(Guid.Empty);
            return Unauthorized(new { message = "Email sau parolă incorectă." });
        }

        // Return verification token — client must now submit OTP
        return Ok(result);
    }

    // ════════════════════════════════════════════════════════════════
    //  3-Way Authentication — Step 2: Verify OTP Code
    // ════════════════════════════════════════════════════════════════

    [HttpPost("verify-code")]
    public IActionResult VerifyCode([FromBody] VerifyCodeRequest request)
    {
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var userAgent = HttpContext.Request.Headers.UserAgent.ToString();

        var result = _authService.LoginStep2VerifyCode(
            request.VerificationToken,
            request.Code,
            ipAddress,
            userAgent);

        if (result is null)
            return Unauthorized(new { message = "Cod de verificare invalid sau expirat." });

        var primaryRole = result.Roles.FirstOrDefault() ?? "User";

        _auditService.LogAction(
            result.Id,
            primaryRole,
            "LOGIN",
            "Auth",
            details: "Autentificare reușită (3-way)",
            ipAddress: ipAddress);

        _threatDetectionService.Analyze(result.Id);

        return Ok(result);
    }

    // ════════════════════════════════════════════════════════════════
    //  3-Way Authentication — Resend Code
    // ════════════════════════════════════════════════════════════════

    [HttpPost("resend-code")]
    public IActionResult ResendCode([FromBody] ResendCodeRequest request)
    {
        var success = _authService.ResendVerificationCode(request.VerificationToken);

        if (!success)
            return BadRequest(new { message = "Nu s-a putut retrimite codul. Încercați să vă autentificați din nou." });

        return Ok(new { message = "Codul de verificare a fost retrimis." });
    }

    // ════════════════════════════════════════════════════════════════
    //  Register
    // ════════════════════════════════════════════════════════════════

    [HttpPost("register")]
    public IActionResult Register([FromBody] RegisterRequest request)
    {
        try
        {
            var result = _authService.Register(request);

            var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
            _auditService.LogAction(
                result.Id,
                "User",
                "REGISTER",
                "Auth",
                details: "Utilizator înregistrat",
                ipAddress: ip);

            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // ════════════════════════════════════════════════════════════════
    //  Refresh Token
    // ════════════════════════════════════════════════════════════════

    [HttpPost("refresh")]
    public IActionResult RefreshToken([FromBody] RefreshTokenRequest request)
    {
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var userAgent = HttpContext.Request.Headers.UserAgent.ToString();

        var result = _authService.RefreshToken(request.RefreshToken, ipAddress, userAgent);

        if (result is null)
            return Unauthorized(new { message = "Token de reîmprospătare invalid sau expirat." });

        return Ok(result);
    }

    // ════════════════════════════════════════════════════════════════
    //  Logout
    // ════════════════════════════════════════════════════════════════

    [Authorize]
    [HttpPost("logout")]
    public IActionResult Logout([FromBody] RefreshTokenRequest request)
    {
        _authService.RevokeRefreshToken(request.RefreshToken);

        var userId = GetUserIdFromToken();
        if (userId != Guid.Empty)
        {
            var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
            _auditService.LogAction(
                userId,
                GetUserRoleFromToken(),
                "LOGOUT",
                "Auth",
                details: "Deconectare",
                ipAddress: ip);
        }

        return Ok(new { message = "Deconectat cu succes." });
    }

    // ════════════════════════════════════════════════════════════════
    //  Current User
    // ════════════════════════════════════════════════════════════════

    [Authorize]
    [HttpGet("me")]
    public IActionResult GetCurrentUser()
    {
        var userId = GetUserIdFromToken();
        var email = User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Email)?.Value
            ?? User.FindFirst(ClaimTypes.Email)?.Value ?? "";
        var fullName = User.FindFirst("fullName")?.Value ?? "";
        var roles = User.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList();
        var permissions = User.FindAll("permission").Select(c => c.Value).ToList();

        return Ok(new
        {
            id = userId,
            email,
            fullName,
            roles,
            permissions
        });
    }

    // ════════════════════════════════════════════════════════════════
    //  Change Password (authenticated)
    // ════════════════════════════════════════════════════════════════

    [Authorize]
    [HttpPost("change-password")]
    public IActionResult ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var userId = GetUserIdFromToken();
        if (userId == Guid.Empty) return Unauthorized();

        var success = _authService.ChangePassword(userId, request.CurrentPassword, request.NewPassword);
        if (!success) return BadRequest(new { message = "Parola curentă este incorectă." });

        return Ok(new { message = "Parola a fost schimbată cu succes. Vă rugăm să vă autentificați din nou." });
    }

    // ════════════════════════════════════════════════════════════════
    //  Password Recovery
    // ════════════════════════════════════════════════════════════════

    [HttpPost("forgot-password")]
    public IActionResult ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        _authService.ForgotPassword(request.Email);

        // Always return success to prevent email enumeration
        return Ok(new { message = "Dacă adresa de email există, veți primi un link de resetare." });
    }

    [HttpPost("reset-password")]
    public IActionResult ResetPassword([FromBody] ResetPasswordRequest request)
    {
        var success = _authService.ResetPassword(request.Token, request.NewPassword);

        if (!success)
            return BadRequest(new { message = "Token de resetare invalid sau expirat." });

        return Ok(new { message = "Parola a fost resetată cu succes. Vă puteți autentifica." });
    }

    // ════════════════════════════════════════════════════════════════
    //  Session Management
    // ════════════════════════════════════════════════════════════════

    [Authorize]
    [HttpGet("sessions")]
    public IActionResult GetSessions()
    {
        var userId = GetUserIdFromToken();
        if (userId == Guid.Empty)
            return Unauthorized();

        // Try to get current session ID from the token's session claim
        var sessionIdClaim = User.FindFirst("sessionId")?.Value;
        Guid? currentSessionId = Guid.TryParse(sessionIdClaim, out var sid) ? sid : null;

        var sessions = _authService.GetActiveSessions(userId, currentSessionId);
        return Ok(sessions);
    }

    [Authorize]
    [HttpDelete("sessions/{sessionId:guid}")]
    public IActionResult RevokeSession(Guid sessionId)
    {
        var userId = GetUserIdFromToken();
        if (userId == Guid.Empty)
            return Unauthorized();

        var success = _authService.RevokeSession(userId, sessionId);

        if (!success)
            return NotFound(new { message = "Sesiunea nu a fost găsită." });

        return Ok(new { message = "Sesiune revocată cu succes." });
    }

    // ════════════════════════════════════════════════════════════════
    //  Helpers
    // ════════════════════════════════════════════════════════════════

    private Guid GetUserIdFromToken()
    {
        var userIdClaim = User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)
            ?? User.FindFirst(ClaimTypes.NameIdentifier);

        return userIdClaim is not null && Guid.TryParse(userIdClaim.Value, out var id) ? id : Guid.Empty;
    }

    private string GetUserRoleFromToken()
    {
        return User.FindFirst(ClaimTypes.Role)?.Value ?? "User";
    }
}
