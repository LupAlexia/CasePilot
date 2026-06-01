namespace CasePilot.Api.Models;

using System.Text.Json.Serialization;

public class LegalCase
{
    public Guid Id { get; set; }

    public string Number { get; set; } = string.Empty;
    public DateTime RegistrationDate { get; set; }
    public string Court { get; set; } = string.Empty;
    public string Object { get; set; } = string.Empty;
    public string Reclamant { get; set; } = string.Empty;
    public string Parat { get; set; } = string.Empty;

    public CaseStage Stage { get; set; }
    public CaseStatus Status { get; set; }

    public Guid CreatedByUserId { get; set; }
    [JsonIgnore]
    public AppUser CreatedByUser { get; set; } = null!;

    public List<CaseDocument> Documents { get; set; } = new();
    public List<HearingTerm> Hearings { get; set; } = new();
}