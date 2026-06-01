namespace CasePilot.Api.DTOs.Requests;

public class CreateHearingTermRequest
{
    public string Title { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public string CourtRoom { get; set; } = string.Empty;
    public string Note { get; set; } = string.Empty;
}
