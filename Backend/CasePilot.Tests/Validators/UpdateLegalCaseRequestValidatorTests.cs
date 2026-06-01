using CasePilot.Api.DTOs.Requests;
using CasePilot.Api.Models;
using CasePilot.Api.Validators;
using FluentValidation.TestHelper;

namespace CasePilot.Tests.Validators;

public class UpdateLegalCaseRequestValidatorTests
{
    private readonly UpdateLegalCaseRequestValidator _validator = new();

    [Fact]
    public void Should_Have_Error_When_Parat_Is_Empty()
    {
        var model = CreateValidModel();
        model.Parat = string.Empty;

        var result = _validator.TestValidate(model);

        result.ShouldHaveValidationErrorFor(x => x.Parat);
    }

    [Fact]
    public void Should_Not_Have_Errors_For_Valid_Model()
    {
        var model = CreateValidModel();

        var result = _validator.TestValidate(model);

        result.ShouldNotHaveAnyValidationErrors();
    }

    private static UpdateLegalCaseRequest CreateValidModel() =>
        new()
        {
            Number = "1234/2024",
            RegistrationDate = DateTime.UtcNow.Date,
            Court = "Tribunalul Cluj",
            Object = "Contestație",
            Reclamant = "Ion Popescu",
            Parat = "SC Test SRL",
            Stage = CaseStage.Fond,
            Status = CaseStatus.Activ
        };
}