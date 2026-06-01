using System.Collections.Generic;

namespace CasePilot.Api.DTOs.Responses;

public class CaseStatisticsResponse
{
    public int TotalCases { get; set; }
    public int ActiveCases { get; set; }
    public int PostponedCases { get; set; }
    public int SuspendedCases { get; set; }
    public int FinalizedCases { get; set; }
    public int CasesWithUpcomingHearings { get; set; }

    public Dictionary<string, int> CasesPerCourt { get; set; } = new();
}