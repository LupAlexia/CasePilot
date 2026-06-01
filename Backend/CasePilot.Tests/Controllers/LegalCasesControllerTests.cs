using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using CasePilot.Api.Controllers;
using CasePilot.Api.DTOs.Requests;
using CasePilot.Api.DTOs.Responses;
using CasePilot.Api.Models;
using CasePilot.Api.Services.Interfaces;
using FluentAssertions;
using Moq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;

namespace CasePilot.Tests.Controllers;

public class LegalCasesControllerTests
{
    private readonly Mock<ILegalCaseService> _serviceMock;
    private readonly Mock<IAuditService> _auditMock;
    private readonly Mock<IThreatDetectionService> _threatMock;
    private readonly LegalCasesController _controller;
    private readonly Guid _testUserId = Guid.Parse("b2222222-2222-2222-2222-222222222222");

    public LegalCasesControllerTests()
    {
        _serviceMock = new Mock<ILegalCaseService>();
        _auditMock = new Mock<IAuditService>();
        _threatMock = new Mock<IThreatDetectionService>();
        _controller = new LegalCasesController(_serviceMock.Object, _auditMock.Object, _threatMock.Object);

        SetupAuthenticatedUser(_testUserId, "User");
    }

    private void SetupAuthenticatedUser(Guid userId, string role)
    {
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new(ClaimTypes.Role, role)
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);

        var httpContext = new DefaultHttpContext { User = principal };
        _controller.ControllerContext = new ControllerContext { HttpContext = httpContext };
    }

    private void SetupUnauthenticatedUser()
    {
        var httpContext = new DefaultHttpContext(); // no claims = Guid.Empty
        _controller.ControllerContext = new ControllerContext { HttpContext = httpContext };
    }

    [Fact]
    public void GetAll_Should_Return_Unauthorized_When_No_UserId()
    {
        SetupUnauthenticatedUser();

        var result = _controller.GetAll(1, 10);

        result.Should().BeOfType<UnauthorizedObjectResult>();
    }

    [Fact]
    public void GetAll_Should_Return_BadRequest_When_Page_Is_Invalid()
    {
        var result = _controller.GetAll(0, 10);

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public void GetAll_Should_Return_Ok_When_Request_Is_Valid()
    {
        _serviceMock
            .Setup(x => x.GetAll(_testUserId, 1, 10))
            .Returns(new PagedResponse<LegalCaseResponse>());

        var result = _controller.GetAll(1, 10);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public void GetAll_Should_Return_BadRequest_When_PageSize_Is_Too_Small()
    {
        var result = _controller.GetAll(1, 0);

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public void GetAll_Should_Return_BadRequest_When_PageSize_Is_Too_Large()
    {
        var result = _controller.GetAll(1, 101);

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public void GetById_Should_Return_NotFound_When_Case_Does_Not_Exist()
    {
        _serviceMock
            .Setup(x => x.GetById(_testUserId, It.IsAny<Guid>()))
            .Returns((LegalCaseResponse?)null);

        var result = _controller.GetById(Guid.NewGuid());

        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public void GetById_Should_Return_Ok_When_Case_Exists()
    {
        _serviceMock
            .Setup(x => x.GetById(_testUserId, It.IsAny<Guid>()))
            .Returns(new LegalCaseResponse
            {
                Id = Guid.NewGuid(),
                Number = "123/2024",
                Court = "Tribunal",
                Object = "Obiect",
                Reclamant = "Ion",
                Parat = "SC Test",
                RegistrationDate = DateTime.Today,
                Stage = CaseStage.Fond,
                Status = CaseStatus.Activ
            });

        var result = _controller.GetById(Guid.NewGuid());

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public void Create_Should_Return_CreatedAtAction()
    {
        var response = new LegalCaseResponse
        {
            Id = Guid.NewGuid(),
            Number = "123/2024",
            Court = "Tribunal",
            Object = "Obiect",
            Reclamant = "Ion",
            Parat = "SC Test",
            RegistrationDate = DateTime.Today,
            Stage = CaseStage.Fond,
            Status = CaseStatus.Activ
        };

        _serviceMock
            .Setup(x => x.Create(_testUserId, It.IsAny<CreateLegalCaseRequest>()))
            .Returns(response);

        var result = _controller.Create(new CreateLegalCaseRequest());

        result.Should().BeOfType<CreatedAtActionResult>();
    }

    [Fact]
    public void Create_Should_Return_CreatedAtAction_With_Correct_Action_Name()
    {
        var response = new LegalCaseResponse
        {
            Id = Guid.NewGuid(),
            Number = "123/2024",
            Court = "Tribunal",
            Object = "Obiect",
            Reclamant = "Ion",
            Parat = "SC Test",
            RegistrationDate = DateTime.Today,
            Stage = CaseStage.Fond,
            Status = CaseStatus.Activ
        };

        _serviceMock
            .Setup(x => x.Create(_testUserId, It.IsAny<CreateLegalCaseRequest>()))
            .Returns(response);

        var result = _controller.Create(new CreateLegalCaseRequest());

        var createdResult = result.Should().BeOfType<CreatedAtActionResult>().Subject;
        createdResult.ActionName.Should().Be(nameof(LegalCasesController.GetById));
    }


    [Fact]
    public void Update_Should_Return_NotFound_When_Case_Does_Not_Exist()
    {
        _serviceMock
            .Setup(x => x.Update(_testUserId, It.IsAny<Guid>(), It.IsAny<UpdateLegalCaseRequest>()))
            .Returns((LegalCaseResponse?)null);

        var result = _controller.Update(Guid.NewGuid(), new UpdateLegalCaseRequest());

        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public void Update_Should_Return_Ok_When_Case_Exists()
    {
        var response = new LegalCaseResponse
        {
            Id = Guid.NewGuid(),
            Number = "123/2024",
            Court = "Tribunalul Cluj",
            Object = "Obiect",
            Reclamant = "Ion",
            Parat = "SC Test",
            RegistrationDate = DateTime.Today,
            Stage = CaseStage.Fond,
            Status = CaseStatus.Activ
        };

        _serviceMock
            .Setup(x => x.Update(_testUserId, It.IsAny<Guid>(), It.IsAny<UpdateLegalCaseRequest>()))
            .Returns(response);

        var result = _controller.Update(Guid.NewGuid(), new UpdateLegalCaseRequest());

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public void Delete_Should_Return_NotFound_When_Case_Does_Not_Exist()
    {
        _serviceMock
            .Setup(x => x.Delete(_testUserId, It.IsAny<Guid>()))
            .Returns(false);

        var result = _controller.Delete(Guid.NewGuid());

        result.Should().BeOfType<NotFoundObjectResult>();
    }


    [Fact]
    public void Delete_Should_Return_NoContent_When_Delete_Succeeds()
    {
        _serviceMock
            .Setup(x => x.Delete(_testUserId, It.IsAny<Guid>()))
            .Returns(true);

        var result = _controller.Delete(Guid.NewGuid());

        result.Should().BeOfType<NoContentResult>();
    }
}