using FluentValidation;
using CasePilot.Api.DTOs;

namespace CasePilot.Api.Validators;

public class CreateCaseDocumentValidator : AbstractValidator<CreateCaseDocumentRequest>
{
    public CreateCaseDocumentValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .WithMessage("Numele documentului este obligatoriu.")
            .MaximumLength(200)
            .WithMessage("Numele documentului nu poate depăși 200 caractere.");

        RuleFor(x => x.Type)
            .IsInEnum()
            .WithMessage("Tipul documentului nu este valid.");
    }
}