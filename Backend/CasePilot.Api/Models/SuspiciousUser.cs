namespace CasePilot.Api.Models;

public class SuspiciousUser
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }
    public AppUser User { get; set; } = null!;

    public string Reason { get; set; } = string.Empty;
    public int SeverityScore { get; set; }
    public DateTime DetectedAt { get; set; }

    public bool IsResolved { get; set; }
    public Guid? ResolvedByUserId { get; set; }
    public DateTime? ResolvedAt { get; set; }
}
