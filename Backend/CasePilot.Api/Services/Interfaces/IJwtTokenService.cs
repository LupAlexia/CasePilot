using CasePilot.Api.Models;

namespace CasePilot.Api.Services.Interfaces;

public interface IJwtTokenService
{
    string GenerateAccessToken(AppUser user, IEnumerable<string> roles, IEnumerable<string> permissions, Guid? sessionId = null);
    string GenerateRefreshToken();
    Guid? ValidateAccessToken(string token);
}
