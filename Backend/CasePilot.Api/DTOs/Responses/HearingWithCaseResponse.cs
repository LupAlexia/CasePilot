namespace CasePilot.Api.DTOs.Responses;

public class HearingWithCaseResponse
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public string CourtRoom { get; set; } = string.Empty;
    public string Note { get; set; } = string.Empty;

    // Case context
    public Guid CaseId { get; set; }
    public string CaseNumber { get; set; } = string.Empty;
    public string Court { get; set; } = string.Empty;
}
