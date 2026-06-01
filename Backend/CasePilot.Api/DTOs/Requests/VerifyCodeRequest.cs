namespace CasePilot.Api.DTOs.Requests;

public class VerifyCodeRequest
{
    public string VerificationToken { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
}
