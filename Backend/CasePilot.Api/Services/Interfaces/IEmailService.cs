namespace CasePilot.Api.Services.Interfaces;

public interface IEmailService
{
    /// <summary>Sends the 6-digit OTP code to the user's email address.</summary>
    Task SendOtpAsync(string toEmail, string code);

    /// <summary>Sends a password-reset link to the user's email address.</summary>
    Task SendPasswordResetAsync(string toEmail, string resetLink);

    /// <summary>Sends a hearing-term reminder email one day before the hearing.</summary>
    Task SendHearingReminderAsync(string toEmail, string caseNumber, string hearingTitle, DateTime hearingDate, string courtRoom, string caseId);
}
