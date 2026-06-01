using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using CasePilot.Api.Controllers;
using CasePilot.Api.DTOs.Responses;
using CasePilot.Api.Services.Interfaces;
using FluentAssertions;
using Moq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;

namespace CasePilot.Tests.Controllers;

public class StatisticsControllerTests
{
    private readonly Guid _testUserId = Guid.Parse("b2222222-2222-2222-2222-222222222222");

    [Fact]
    public void GetCaseStatistics_Should_Return_Ok()
    {
        var serviceMock = new Mock<IStatisticsService>();
        serviceMock
            .Setup(x => x.GetCaseStatistics(_testUserId))
            .Returns(new CaseStatisticsResponse
            {
                TotalCases = 2
            });

        var controller = new StatisticsController(serviceMock.Object);

        // Set up JWT claims instead of X-User-Id header
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, _testUserId.ToString()),
            new(ClaimTypes.Role, "User")
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var httpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) };
        controller.ControllerContext = new ControllerContext { HttpContext = httpContext };

        var result = controller.GetCaseStatistics();

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public void GetCaseStatistics_Should_Return_Unauthorized_When_No_UserId()
    {
        var serviceMock = new Mock<IStatisticsService>();
        var controller = new StatisticsController(serviceMock.Object);
        controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        var result = controller.GetCaseStatistics();

        result.Should().BeOfType<UnauthorizedObjectResult>();
    }
}