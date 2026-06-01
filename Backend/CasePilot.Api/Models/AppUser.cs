namespace CasePilot.Api.Models;

public class AppUser
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public bool IsActive { get; set; } = true;

    public List<AppUserRole> UserRoles { get; set; } = new();
    public List<RefreshToken> RefreshTokens { get; set; } = new();
    public List<EmailVerificationCode> VerificationCodes { get; set; } = new();
    public List<PasswordResetToken> PasswordResetTokens { get; set; } = new();
    public bool HearingNotificationsEnabled { get; set; } = false;

    public List<UserSession> Sessions { get; set; } = new();
}
