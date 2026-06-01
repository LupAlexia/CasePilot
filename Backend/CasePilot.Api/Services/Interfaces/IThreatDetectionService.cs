using CasePilot.Api.DTOs.Responses;

namespace CasePilot.Api.Services.Interfaces;

public interface IThreatDetectionService
{
    void Analyze(Guid userId);
    List<SuspiciousUserResponse> GetWatchlist();
    bool Resolve(Guid suspiciousUserId, Guid adminUserId);
}
