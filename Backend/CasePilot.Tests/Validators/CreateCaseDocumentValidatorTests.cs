using CasePilot.Api.DTOs;
using CasePilot.Api.Models;
using CasePilot.Api.Validators;
using FluentValidation.TestHelper;
using Xunit;

namespace CasePilot.Tests.Validators;

public class CreateCaseDocumentValidatorTests
{
    private readonly CreateCaseDocumentValidator _validator = new();

    [Fact]
    public void Should_Have_Error_When_Name_Is_Empty()
    {
        var model = new CreateCaseDocumentRequest { Name = string.Empty, Type = DocumentType.Cerere };
        var result = _validator.TestValidate(model);
        result.ShouldHaveValidationErrorFor(x => x.Name);
    }
}
