using CasePilot.Api.DTOs.Requests;
using CasePilot.Api.DTOs.Responses;

namespace CasePilot.Api.Services.Interfaces;

public interface IAuthService
{
    // ── 3-way authentication ────────────────────────────────
    LoginStepResponse LoginStep1(string email, string password);
    LoginResponse? LoginStep2VerifyCode(string verificationToken, string code, string ipAddress, string userAgent);
    bool ResendVerificationCode(string verificationToken);

    // ── Standard token operations ───────────────────────────
    LoginResponse Register(RegisterRequest request);
    LoginResponse? RefreshToken(string refreshToken, string ipAddress, string userAgent);
    void RevokeRefreshToken(string refreshToken);
    void RevokeAllUserTokens(Guid userId);

    // ── Password recovery ───────────────────────────────────
    bool ForgotPassword(string email);
    bool ResetPassword(string token, string newPassword);
    bool ChangePassword(Guid userId, string currentPassword, string newPassword);

    // ── Session management ──────────────────────────────────
    List<SessionResponse> GetActiveSessions(Guid userId, Guid? currentSessionId);
    bool RevokeSession(Guid userId, Guid sessionId);
    void UpdateSessionActivity(Guid sessionId);
}
