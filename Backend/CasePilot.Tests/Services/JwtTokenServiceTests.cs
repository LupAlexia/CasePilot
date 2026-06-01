using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using CasePilot.Api.Models;
using CasePilot.Api.Services;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace CasePilot.Tests.Services;

public class JwtTokenServiceTests
{
    private readonly JwtTokenService _sut;
    private readonly IConfiguration _configuration;

    public JwtTokenServiceTests()
    {
        _configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Key"] = "TestSecretKey-AtLeast32Characters-Long!!",
                ["Jwt:Issuer"] = "CasePilot.Tests",
                ["Jwt:Audience"] = "CasePilot.Tests",
                ["Jwt:AccessTokenExpirationMinutes"] = "30"
            })
            .Build();

        _sut = new JwtTokenService(_configuration);
    }

    private AppUser CreateTestUser() => new()
    {
        Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
        Email = "test@casepilot.com",
        FullName = "Test User",
        IsActive = true
    };

    [Fact]
    public void GenerateAccessToken_ShouldReturnValidJwtString()
    {
        // Arrange
        var user = CreateTestUser();
        var roles = new[] { "User" };
        var permissions = new[] { "cases.view", "cases.create" };

        // Act
        var token = _sut.GenerateAccessToken(user, roles, permissions);

        // Assert
        token.Should().NotBeNullOrEmpty();
        // JWT tokens have 3 parts separated by dots
        token.Split('.').Length.Should().Be(3);
    }

    [Fact]
    public void GenerateAccessToken_ShouldContainCorrectClaims()
    {
        // Arrange
        var user = CreateTestUser();
        var roles = new[] { "Admin", "User" };
        var permissions = new[] { "cases.view", "cases.create", "users.manage" };

        // Act
        var token = _sut.GenerateAccessToken(user, roles, permissions);

        // Assert – decode and verify claims
        var handler = new JwtSecurityTokenHandler();
        var decoded = handler.ReadJwtToken(token);

        decoded.Subject.Should().Be(user.Id.ToString());
        decoded.Claims.Should().Contain(c => c.Type == JwtRegisteredClaimNames.Email && c.Value == "test@casepilot.com");
        decoded.Claims.Should().Contain(c => c.Type == "fullName" && c.Value == "Test User");
        decoded.Claims.Should().Contain(c => c.Type == ClaimTypes.Role && c.Value == "Admin");
        decoded.Claims.Should().Contain(c => c.Type == ClaimTypes.Role && c.Value == "User");
        decoded.Claims.Should().Contain(c => c.Type == "permission" && c.Value == "cases.view");
        decoded.Claims.Should().Contain(c => c.Type == "permission" && c.Value == "users.manage");
    }

    [Fact]
    public void GenerateAccessToken_ShouldHaveCorrectExpiration()
    {
        // Arrange
        var user = CreateTestUser();

        // Act
        var token = _sut.GenerateAccessToken(user, new[] { "User" }, Array.Empty<string>());

        // Assert
        var handler = new JwtSecurityTokenHandler();
        var decoded = handler.ReadJwtToken(token);

        decoded.ValidTo.Should().BeCloseTo(DateTime.UtcNow.AddMinutes(30), TimeSpan.FromMinutes(1));
    }

    [Fact]
    public void GenerateAccessToken_ShouldHaveCorrectIssuerAndAudience()
    {
        // Arrange
        var user = CreateTestUser();

        // Act
        var token = _sut.GenerateAccessToken(user, new[] { "User" }, Array.Empty<string>());

        // Assert
        var handler = new JwtSecurityTokenHandler();
        var decoded = handler.ReadJwtToken(token);

        decoded.Issuer.Should().Be("CasePilot.Tests");
        decoded.Audiences.Should().Contain("CasePilot.Tests");
    }

    [Fact]
    public void GenerateRefreshToken_ShouldReturnNonEmptyUniqueString()
    {
        // Act
        var token1 = _sut.GenerateRefreshToken();
        var token2 = _sut.GenerateRefreshToken();

        // Assert
        token1.Should().NotBeNullOrEmpty();
        token2.Should().NotBeNullOrEmpty();
        token1.Should().NotBe(token2);
    }

    [Fact]
    public void ValidateAccessToken_ShouldReturnUserId_ForValidToken()
    {
        // Arrange
        var user = CreateTestUser();
        var token = _sut.GenerateAccessToken(user, new[] { "User" }, Array.Empty<string>());

        // Act
        var userId = _sut.ValidateAccessToken(token);

        // Assert
        userId.Should().NotBeNull();
        userId!.Value.Should().Be(user.Id);
    }

    [Fact]
    public void ValidateAccessToken_ShouldReturnNull_ForInvalidToken()
    {
        // Act
        var userId = _sut.ValidateAccessToken("this.is.not.a.valid.jwt");

        // Assert
        userId.Should().BeNull();
    }

    [Fact]
    public void ValidateAccessToken_ShouldReturnNull_ForExpiredToken()
    {
        // Arrange – create a token service with 0-minute expiration
        var expiredConfig = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Key"] = "TestSecretKey-AtLeast32Characters-Long!!",
                ["Jwt:Issuer"] = "CasePilot.Tests",
                ["Jwt:Audience"] = "CasePilot.Tests",
                ["Jwt:AccessTokenExpirationMinutes"] = "0"
            })
            .Build();

        var expiredSut = new JwtTokenService(expiredConfig);
        var user = CreateTestUser();
        var token = expiredSut.GenerateAccessToken(user, new[] { "User" }, Array.Empty<string>());

        // Act – validate the already-expired token
        var userId = _sut.ValidateAccessToken(token);

        // Assert
        userId.Should().BeNull();
    }

    [Fact]
    public void ValidateAccessToken_ShouldReturnNull_ForTokenWithWrongKey()
    {
        // Arrange – create a token with a different key
        var otherConfig = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Key"] = "ACompletelyDifferentKey-AtLeast32Chars!!",
                ["Jwt:Issuer"] = "CasePilot.Tests",
                ["Jwt:Audience"] = "CasePilot.Tests",
                ["Jwt:AccessTokenExpirationMinutes"] = "30"
            })
            .Build();

        var otherSut = new JwtTokenService(otherConfig);
        var user = CreateTestUser();
        var token = otherSut.GenerateAccessToken(user, new[] { "User" }, Array.Empty<string>());

        // Act – validate with the original key
        var userId = _sut.ValidateAccessToken(token);

        // Assert
        userId.Should().BeNull();
    }
}
