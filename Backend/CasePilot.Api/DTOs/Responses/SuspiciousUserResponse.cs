namespace CasePilot.Api.DTOs.Responses;

public class SuspiciousUserResponse
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string UserEmail { get; set; } = string.Empty;
    public string UserFullName { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public int SeverityScore { get; set; }
    public DateTime DetectedAt { get; set; }
    public bool IsResolved { get; set; }
    public DateTime? ResolvedAt { get; set; }
}
