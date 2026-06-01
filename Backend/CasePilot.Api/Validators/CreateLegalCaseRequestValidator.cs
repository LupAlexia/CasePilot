using CasePilot.Api.DTOs.Requests;
using FluentValidation;

namespace CasePilot.Api.Validators;
/* Validation on DTO not model - validation should happen on user input = request DTO
 * FluentValidation runs automatically when a POST or PUT request comes in
   if validation fails, the API returns 400 Bad Request
 */
public class CreateLegalCaseRequestValidator : AbstractValidator<CreateLegalCaseRequest>
{
    public CreateLegalCaseRequestValidator()
    {
        RuleFor(x => x.Number)
            .NotEmpty().WithMessage("Numărul dosarului este obligatoriu.")
            .MaximumLength(50).WithMessage("Numărul dosarului nu poate depăși 50 de caractere.")
            .Matches(@"^\d+/\d{4}$").WithMessage("Format recomandat: 1234/2024.");

        RuleFor(x => x.RegistrationDate)
            .NotEmpty().WithMessage("Data înregistrării este obligatorie.")
            .LessThanOrEqualTo(DateTime.UtcNow.Date.AddDays(1))
            .WithMessage("Data înregistrării nu poate fi ulterioară datei curente.");

        RuleFor(x => x.Court)
            .NotEmpty().WithMessage("Instanța este obligatorie.")
            .MaximumLength(100).WithMessage("Instanța nu poate depăși 100 de caractere.");

        RuleFor(x => x.Object)
            .NotEmpty().WithMessage("Obiectul dosarului este obligatoriu.")
            .MaximumLength(200).WithMessage("Obiectul dosarului nu poate depăși 200 de caractere.");

        RuleFor(x => x.Reclamant)
            .NotEmpty().WithMessage("Reclamantul este obligatoriu.")
            .MaximumLength(100).WithMessage("Numele reclamantului nu poate depăși 100 de caractere.");

        RuleFor(x => x.Parat)
            .NotEmpty().WithMessage("Pârâtul este obligatoriu.")
            .MaximumLength(100).WithMessage("Numele pârâtului nu poate depăși 100 de caractere.");

        RuleFor(x => x.Stage)
            .IsInEnum().WithMessage("Stadiul procesual trebuie să aibă o valoare validă.");

        RuleFor(x => x.Status)
            .IsInEnum().WithMessage("Statusul dosarului trebuie să aibă o valoare validă.");
    }
}