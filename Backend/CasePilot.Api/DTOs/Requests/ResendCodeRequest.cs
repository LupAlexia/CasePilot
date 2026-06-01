namespace CasePilot.Api.DTOs.Requests;

public class ResendCodeRequest
{
    public string VerificationToken { get; set; } = string.Empty;
}
