namespace CasePilot.Api.DTOs.Responses;

public class LoginStepResponse
{
    /// <summary>
    /// If true, the login requires OTP verification (step 2).
    /// If false, tokens are provided directly (shouldn't normally happen with 3-way auth).
    /// </summary>
    public bool RequiresVerification { get; set; }

    /// <summary>
    /// Temporary token used to link the OTP verification to this login attempt.
    /// Only present when RequiresVerification = true.
    /// </summary>
    public string VerificationToken { get; set; } = string.Empty;

    /// <summary>
    /// The email where the verification code was sent (partially masked).
    /// </summary>
    public string MaskedEmail { get; set; } = string.Empty;

    /// <summary>
    /// Full login response, only present when RequiresVerification = false.
    /// </summary>
    public LoginResponse? LoginData { get; set; }
}
