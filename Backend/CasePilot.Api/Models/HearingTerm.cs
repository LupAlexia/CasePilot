namespace CasePilot.Api.Models;

public class HearingTerm
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public string CourtRoom { get; set; } = string.Empty;
    public string Note { get; set; } = string.Empty;

    public Guid LegalCaseId { get; set; }

    [System.Text.Json.Serialization.JsonIgnore]
    public LegalCase? LegalCase { get; set; }
}