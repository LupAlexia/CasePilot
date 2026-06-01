using System;
using System.Linq;
using CasePilot.Api.DTOs.Requests;
using CasePilot.Api.Models;
using CasePilot.Api.Services;
using CasePilot.Api.Services.Interfaces;
using CasePilot.Api.Storage;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace CasePilot.Tests.Services;

public class AuthServiceTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly CasePilotDbContext _context;
    private readonly AuthService _sut;
    private readonly JwtTokenService _jwtTokenService;

    public AuthServiceTests()
    {
        _connection = new SqliteConnection("Filename=:memory:");
        _connection.Open();

        var options = new DbContextOptionsBuilder<CasePilotDbContext>()
            .UseSqlite(_connection)
            .Options;

        _context = new CasePilotDbContext(options);
        _context.Database.EnsureCreated();

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Key"] = "TestSecretKey-AtLeast32Characters-Long!!",
                ["Jwt:Issuer"] = "CasePilot.Tests",
                ["Jwt:Audience"] = "CasePilot.Tests",
                ["Jwt:AccessTokenExpirationMinutes"] = "30",
                ["Jwt:RefreshTokenExpirationDays"] = "7"
            })
            .Build();

        _jwtTokenService = new JwtTokenService(configuration);
        var logger = NullLogger<AuthService>.Instance;
        _sut = new AuthService(_context, _jwtTokenService, configuration, logger, new FakeEmailService());
    }

    /// <summary>No-op email service — test isolation, no network calls.</summary>
    private sealed class FakeEmailService : IEmailService
    {
        public Task SendOtpAsync(string toEmail, string code) => Task.CompletedTask;
        public Task SendPasswordResetAsync(string toEmail, string link) => Task.CompletedTask;
        public Task SendHearingReminderAsync(string toEmail, string caseNumber, string hearingTitle, DateTime hearingDate, string courtRoom, string caseId) => Task.CompletedTask;
    }

    public void Dispose()
    {
        _context.Dispose();
        _connection.Dispose();
    }

    // Helper: perform full 3-way login (step 1 + step 2)
    private Api.DTOs.Responses.LoginResponse? FullLogin(string email, string password)
    {
        var step1 = _sut.LoginStep1(email, password);
        if (!step1.RequiresVerification) return null;

        // Get the verification code from the database
        var verification = _context.EmailVerificationCodes
            .OrderByDescending(c => c.CreatedAt)
            .FirstOrDefault(c => c.VerificationToken == step1.VerificationToken && !c.IsUsed);
        if (verification is null) return null;

        return _sut.LoginStep2VerifyCode(step1.VerificationToken, verification.Code, "127.0.0.1", "TestAgent");
    }

    // ── Login Step 1 Tests (Credential Validation) ──────────

    [Fact]
    public void LoginStep1_ShouldRequireVerification_WhenCredentialsAreValid()
    {
        // Arrange – create user with BCrypt hash
        var user = new AppUser
        {
            Id = Guid.NewGuid(),
            Email = "test@test.com",
            Password = string.Empty,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("password123"),
            FullName = "Test User",
            IsActive = true
        };
        _context.Users.Add(user);
        _context.SaveChanges();

        // Act
        var result = _sut.LoginStep1("test@test.com", "password123");

        // Assert
        result.RequiresVerification.Should().BeTrue();
        result.VerificationToken.Should().NotBeNullOrEmpty();
        result.MaskedEmail.Should().Contain("@test.com");
    }

    [Fact]
    public void LoginStep1_ShouldNotRequireVerification_WhenEmailDoesNotExist()
    {
        // Act
        var result = _sut.LoginStep1("nonexistent@test.com", "password123");

        // Assert
        result.RequiresVerification.Should().BeFalse();
        result.LoginData.Should().BeNull();
    }

    [Fact]
    public void LoginStep1_ShouldNotRequireVerification_WhenPasswordIsWrong()
    {
        // Arrange
        var user = new AppUser
        {
            Id = Guid.NewGuid(),
            Email = "test@test.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("correct_password"),
            FullName = "Test User",
            IsActive = true
        };
        _context.Users.Add(user);
        _context.SaveChanges();

        // Act
        var result = _sut.LoginStep1("test@test.com", "wrong_password");

        // Assert
        result.RequiresVerification.Should().BeFalse();
        result.LoginData.Should().BeNull();
    }

    [Fact]
    public void LoginStep1_ShouldNotRequireVerification_WhenUserIsInactive()
    {
        // Arrange
        var user = new AppUser
        {
            Id = Guid.NewGuid(),
            Email = "inactive@test.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("password123"),
            FullName = "Inactive User",
            IsActive = false
        };
        _context.Users.Add(user);
        _context.SaveChanges();

        // Act
        var result = _sut.LoginStep1("inactive@test.com", "password123");

        // Assert
        result.RequiresVerification.Should().BeFalse();
    }

    // ── Login Step 2 Tests (OTP Verification) ───────────────

    [Fact]
    public void LoginStep2_ShouldReturnTokens_WhenCodeIsValid()
    {
        // Arrange
        var user = new AppUser
        {
            Id = Guid.NewGuid(),
            Email = "verify@test.com",
            Password = string.Empty,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("password123"),
            FullName = "Verify User",
            IsActive = true
        };
        _context.Users.Add(user);
        _context.SaveChanges();

        // Act
        var result = FullLogin("verify@test.com", "password123");

        // Assert
        result.Should().NotBeNull();
        result!.Email.Should().Be("verify@test.com");
        result.AccessToken.Should().NotBeNullOrEmpty();
        result.RefreshToken.Should().NotBeNullOrEmpty();
        result.SessionId.Should().NotBeEmpty();
        result.AccessTokenExpiration.Should().BeAfter(DateTime.UtcNow);
    }

    [Fact]
    public void LoginStep2_ShouldReturnNull_WhenCodeIsWrong()
    {
        // Arrange
        var user = new AppUser
        {
            Id = Guid.NewGuid(),
            Email = "wrongcode@test.com",
            Password = string.Empty,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("password123"),
            FullName = "Wrong Code User",
            IsActive = true
        };
        _context.Users.Add(user);
        _context.SaveChanges();

        var step1 = _sut.LoginStep1("wrongcode@test.com", "password123");

        // Act
        var result = _sut.LoginStep2VerifyCode(step1.VerificationToken, "000000", "127.0.0.1", "TestAgent");

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public void Login_ShouldUpgradeLegacyPlainTextPassword_ToHashOnFirstLogin()
    {
        // Arrange – user has plain-text password but no hash (legacy)
        var user = new AppUser
        {
            Id = Guid.NewGuid(),
            Email = "legacy@test.com",
            Password = "legacypassword",
            PasswordHash = string.Empty,
            FullName = "Legacy User",
            IsActive = true
        };
        _context.Users.Add(user);
        _context.SaveChanges();

        // Act — step 1 triggers the hash upgrade
        var step1 = _sut.LoginStep1("legacy@test.com", "legacypassword");

        // Assert – step 1 succeeds
        step1.RequiresVerification.Should().BeTrue();

        // Verify hash was updated
        var updatedUser = _context.Users.First(u => u.Email == "legacy@test.com");
        updatedUser.PasswordHash.Should().NotBeNullOrEmpty();
        BCrypt.Net.BCrypt.Verify("legacypassword", updatedUser.PasswordHash).Should().BeTrue();
    }

    [Fact]
    public void Login_ShouldReturnRolesAndPermissions_WhenUserHasRoles()
    {
        // Arrange – create user with Admin role
        var userId = Guid.NewGuid();
        var user = new AppUser
        {
            Id = userId,
            Email = "roleadmin@test.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
            FullName = "Role Admin",
            IsActive = true
        };
        _context.Users.Add(user);

        // Assign Admin role (seeded by EnsureCreated)
        var adminRole = _context.Roles.First(r => r.Name == "Admin");
        _context.UserRoles.Add(new AppUserRole { UserId = userId, RoleId = adminRole.Id });
        _context.SaveChanges();

        // Act
        var result = FullLogin("roleadmin@test.com", "admin123");

        // Assert
        result.Should().NotBeNull();
        result!.Roles.Should().Contain("Admin");
        result.Permissions.Should().NotBeEmpty();
    }

    // ── Register Tests ───────────────────────────────────────

    [Fact]
    public void Register_ShouldCreateNewUser_WithHashedPassword()
    {
        // Arrange
        var request = new RegisterRequest
        {
            Email = "newuser@test.com",
            Password = "securepass123",
            FullName = "New User"
        };

        // Act
        var result = _sut.Register(request);

        // Assert
        result.Should().NotBeNull();
        result.Email.Should().Be("newuser@test.com");
        result.FullName.Should().Be("New User");
        result.AccessToken.Should().NotBeNullOrEmpty();
        result.RefreshToken.Should().NotBeNullOrEmpty();

        // Verify password is hashed, not plain text
        var savedUser = _context.Users.First(u => u.Email == "newuser@test.com");
        savedUser.Password.Should().BeEmpty();
        savedUser.PasswordHash.Should().NotBeNullOrEmpty();
        BCrypt.Net.BCrypt.Verify("securepass123", savedUser.PasswordHash).Should().BeTrue();
    }

    [Fact]
    public void Register_ShouldAssignDefaultUserRole()
    {
        // Arrange
        var request = new RegisterRequest
        {
            Email = "roletest@test.com",
            Password = "password123",
            FullName = "Role Test User"
        };

        // Act
        var result = _sut.Register(request);

        // Assert
        result.Roles.Should().Contain("User");
    }

    [Fact]
    public void Register_ShouldThrow_WhenEmailAlreadyExists()
    {
        // Arrange
        var user = new AppUser
        {
            Id = Guid.NewGuid(),
            Email = "duplicate@test.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("password"),
            FullName = "Existing User",
            IsActive = true
        };
        _context.Users.Add(user);
        _context.SaveChanges();

        var request = new RegisterRequest
        {
            Email = "duplicate@test.com",
            Password = "password123",
            FullName = "Duplicate User"
        };

        // Act & Assert
        var act = () => _sut.Register(request);
        act.Should().Throw<Exception>().WithMessage("*email*");
    }

    // ── Refresh Token Tests ──────────────────────────────────

    [Fact]
    public void RefreshToken_ShouldReturnNewTokens_WhenRefreshTokenIsValid()
    {
        // Arrange – full login to get a refresh token
        var user = new AppUser
        {
            Id = Guid.NewGuid(),
            Email = "refresh@test.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("password123"),
            FullName = "Refresh User",
            IsActive = true
        };
        _context.Users.Add(user);
        _context.SaveChanges();

        var loginResult = FullLogin("refresh@test.com", "password123");
        loginResult.Should().NotBeNull();

        // Act
        var refreshResult = _sut.RefreshToken(loginResult!.RefreshToken, "127.0.0.1", "TestAgent");

        // Assert
        refreshResult.Should().NotBeNull();
        refreshResult!.AccessToken.Should().NotBeNullOrEmpty();
        refreshResult.RefreshToken.Should().NotBeNullOrEmpty();
        // Old refresh token should be different from new one (rotation)
        refreshResult.RefreshToken.Should().NotBe(loginResult.RefreshToken);
    }

    [Fact]
    public void RefreshToken_ShouldReturnNull_WhenTokenIsInvalid()
    {
        // Act
        var result = _sut.RefreshToken("invalid-token-string", "127.0.0.1", "TestAgent");

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public void RefreshToken_ShouldReturnNull_WhenTokenIsRevoked()
    {
        // Arrange
        var user = new AppUser
        {
            Id = Guid.NewGuid(),
            Email = "revoked@test.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("password123"),
            FullName = "Revoked Test",
            IsActive = true
        };
        _context.Users.Add(user);
        _context.SaveChanges();

        var loginResult = FullLogin("revoked@test.com", "password123");
        _sut.RevokeRefreshToken(loginResult!.RefreshToken);

        // Act
        var result = _sut.RefreshToken(loginResult.RefreshToken, "127.0.0.1", "TestAgent");

        // Assert
        result.Should().BeNull();
    }

    // ── Token Revocation Tests ───────────────────────────────

    [Fact]
    public void RevokeRefreshToken_ShouldMarkTokenAsRevoked()
    {
        // Arrange
        var user = new AppUser
        {
            Id = Guid.NewGuid(),
            Email = "revoke@test.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("password123"),
            FullName = "Revoke User",
            IsActive = true
        };
        _context.Users.Add(user);
        _context.SaveChanges();

        var loginResult = FullLogin("revoke@test.com", "password123");

        // Act
        _sut.RevokeRefreshToken(loginResult!.RefreshToken);

        // Assert
        var storedToken = _context.RefreshTokens.First(rt => rt.Token == loginResult.RefreshToken);
        storedToken.IsRevoked.Should().BeTrue();
    }

    [Fact]
    public void RevokeAllUserTokens_ShouldRevokeAllActiveTokensAndSessions()
    {
        // Arrange
        var user = new AppUser
        {
            Id = Guid.NewGuid(),
            Email = "revokeall@test.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("password123"),
            FullName = "Revoke All User",
            IsActive = true
        };
        _context.Users.Add(user);
        _context.SaveChanges();

        // Login multiple times to create multiple tokens and sessions
        FullLogin("revokeall@test.com", "password123");
        FullLogin("revokeall@test.com", "password123");
        FullLogin("revokeall@test.com", "password123");

        var activeTokensBefore = _context.RefreshTokens
            .Count(rt => rt.UserId == user.Id && !rt.IsRevoked);
        activeTokensBefore.Should().BeGreaterThanOrEqualTo(3);

        // Act
        _sut.RevokeAllUserTokens(user.Id);

        // Assert
        var activeTokensAfter = _context.RefreshTokens
            .Count(rt => rt.UserId == user.Id && !rt.IsRevoked);
        activeTokensAfter.Should().Be(0);

        var activeSessionsAfter = _context.UserSessions
            .Count(s => s.UserId == user.Id && !s.IsRevoked);
        activeSessionsAfter.Should().Be(0);
    }

    // ── Password Recovery Tests ──────────────────────────────

    [Fact]
    public void ForgotPassword_ShouldReturnTrue_AndCreateResetToken()
    {
        // Arrange
        var user = new AppUser
        {
            Id = Guid.NewGuid(),
            Email = "forgot@test.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("password123"),
            FullName = "Forgot User",
            IsActive = true
        };
        _context.Users.Add(user);
        _context.SaveChanges();

        // Act
        var result = _sut.ForgotPassword("forgot@test.com");

        // Assert
        result.Should().BeTrue();
        _context.PasswordResetTokens.Count(t => t.UserId == user.Id).Should().Be(1);
    }

    [Fact]
    public void ForgotPassword_ShouldReturnTrue_EvenForNonExistentEmail()
    {
        // Act — prevents email enumeration
        var result = _sut.ForgotPassword("nobody@test.com");

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    public void ResetPassword_ShouldUpdatePasswordHash()
    {
        // Arrange
        var user = new AppUser
        {
            Id = Guid.NewGuid(),
            Email = "reset@test.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("oldpassword"),
            FullName = "Reset User",
            IsActive = true
        };
        _context.Users.Add(user);
        _context.SaveChanges();

        _sut.ForgotPassword("reset@test.com");
        var resetToken = _context.PasswordResetTokens.First(t => t.UserId == user.Id);

        // Act
        var result = _sut.ResetPassword(resetToken.Token, "newpassword123");

        // Assert
        result.Should().BeTrue();
        var updatedUser = _context.Users.First(u => u.Email == "reset@test.com");
        BCrypt.Net.BCrypt.Verify("newpassword123", updatedUser.PasswordHash).Should().BeTrue();
    }

    [Fact]
    public void ResetPassword_ShouldReturnFalse_WhenTokenIsInvalid()
    {
        // Act
        var result = _sut.ResetPassword("invalid-token", "newpassword");

        // Assert
        result.Should().BeFalse();
    }

    // ── Session Management Tests ─────────────────────────────

    [Fact]
    public void GetActiveSessions_ShouldReturnSessions_AfterLogin()
    {
        // Arrange
        var user = new AppUser
        {
            Id = Guid.NewGuid(),
            Email = "session@test.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("password123"),
            FullName = "Session User",
            IsActive = true
        };
        _context.Users.Add(user);
        _context.SaveChanges();

        var loginResult = FullLogin("session@test.com", "password123");
        loginResult.Should().NotBeNull();

        // Act
        var sessions = _sut.GetActiveSessions(user.Id, loginResult!.SessionId);

        // Assert
        sessions.Should().HaveCount(1);
        sessions[0].IsCurrent.Should().BeTrue();
        sessions[0].IpAddress.Should().Be("127.0.0.1");
    }

    [Fact]
    public void RevokeSession_ShouldMarkSessionAsRevoked()
    {
        // Arrange
        var user = new AppUser
        {
            Id = Guid.NewGuid(),
            Email = "revokesession@test.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("password123"),
            FullName = "Revoke Session User",
            IsActive = true
        };
        _context.Users.Add(user);
        _context.SaveChanges();

        var loginResult = FullLogin("revokesession@test.com", "password123");

        // Act
        var result = _sut.RevokeSession(user.Id, loginResult!.SessionId);

        // Assert
        result.Should().BeTrue();
        var sessions = _sut.GetActiveSessions(user.Id, null);
        sessions.Should().BeEmpty();
    }
}
