using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using CasePilot.Api.Controllers;
using CasePilot.Api.Models;
using CasePilot.Api.Services;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;

namespace CasePilot.Tests.Controllers;

public class DocumentStatisticsControllerTests
{
    private readonly Mock<ICaseDocumentService> _serviceMock;
    private readonly DocumentStatisticsController _sut;

    public DocumentStatisticsControllerTests()
    {
        _serviceMock = new Mock<ICaseDocumentService>();
        _sut = new DocumentStatisticsController(_serviceMock.Object);
    }

    [Fact]
    public async Task GetRecent_ShouldReturnOk_WithDocuments()
    {
        // Arrange
        var documents = new List<CaseDocument>
        {
            new() { Id = Guid.NewGuid(), Name = "Doc1" },
            new() { Id = Guid.NewGuid(), Name = "Doc2" }
        };

        _serviceMock.Setup(s => s.GetRecentDocuments(7))
            .ReturnsAsync(documents);

        // Act
        var result = await _sut.GetRecent();

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);
        
        var returnedDocs = okResult.Value as List<CaseDocument>;
        returnedDocs.Should().NotBeNull();
        returnedDocs.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetActivity_ShouldReturnOk_WithActivities()
    {
        // Arrange
        var activities = new List<DocumentActivity>
        {
            new() { Id = Guid.NewGuid(), Action = "Action 1" }
        };

        _serviceMock.Setup(s => s.GetRecentActivity(7))
            .ReturnsAsync(activities);

        // Act
        var result = await _sut.GetActivity();

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);

        var returnedActivities = okResult.Value as List<DocumentActivity>;
        returnedActivities.Should().NotBeNull();
        returnedActivities.Should().HaveCount(1);
        returnedActivities![0].Action.Should().Be("Action 1");
    }
}
