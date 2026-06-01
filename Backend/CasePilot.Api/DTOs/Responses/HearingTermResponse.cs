using System;

namespace CasePilot.Api.DTOs.Responses;

public class HearingTermResponse
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public string CourtRoom { get; set; } = string.Empty;
    public string Note { get; set; } = string.Empty;
}