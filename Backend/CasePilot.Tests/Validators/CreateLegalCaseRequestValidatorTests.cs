using CasePilot.Api.DTOs.Requests;
using CasePilot.Api.Models;
using CasePilot.Api.Validators;
using FluentValidation.TestHelper;

namespace CasePilot.Tests.Validators;

public class CreateLegalCaseRequestValidatorTests
{
    private readonly CreateLegalCaseRequestValidator _validator = new();

    [Fact]
    public void Should_Have_Error_When_Number_Is_Empty()
    {
        var model = CreateValidModel();
        model.Number = string.Empty;

        var result = _validator.TestValidate(model);

        result.ShouldHaveValidationErrorFor(x => x.Number);
    }

    [Fact]
    public void Should_Have_Error_When_RegistrationDate_Is_In_The_Future()
    {
        var model = CreateValidModel();
        model.RegistrationDate = DateTime.UtcNow.Date.AddDays(2);

        var result = _validator.TestValidate(model);

        result.ShouldHaveValidationErrorFor(x => x.RegistrationDate);
    }

    [Fact]
    public void Should_Have_Error_When_Court_Is_Empty()
    {
        var model = CreateValidModel();
        model.Court = string.Empty;

        var result = _validator.TestValidate(model);

        result.ShouldHaveValidationErrorFor(x => x.Court);
    }

    [Fact]
    public void Should_Not_Have_Errors_For_Valid_Model()
    {
        var model = CreateValidModel();

        var result = _validator.TestValidate(model);

        result.ShouldNotHaveAnyValidationErrors();
    }

    private static CreateLegalCaseRequest CreateValidModel() =>
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