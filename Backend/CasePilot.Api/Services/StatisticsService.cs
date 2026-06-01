using CasePilot.Api.DTOs.Responses;
using CasePilot.Api.Models;
using CasePilot.Api.Services.Interfaces;
using CasePilot.Api.Storage;

namespace CasePilot.Api.Services;

public class StatisticsService : IStatisticsService
{
    private readonly ILegalCaseRepository _repository;

    public StatisticsService(ILegalCaseRepository repository)
    {
        _repository = repository;
    }

    public CaseStatisticsResponse GetCaseStatistics(Guid userId)
    {
        var cases = _repository.GetAll()
            .Where(c => c.CreatedByUserId == userId)
            .ToList();

        return new CaseStatisticsResponse
        {
            TotalCases = cases.Count,
            ActiveCases = cases.Count(c => c.Status == CaseStatus.Activ),
            PostponedCases = cases.Count(c => c.Status == CaseStatus.Amânat),
            SuspendedCases = cases.Count(c => c.Status == CaseStatus.Suspendat),
            FinalizedCases = cases.Count(c => c.Status == CaseStatus.Finalizat),
            CasesWithUpcomingHearings = cases.Count(c => c.Hearings.Any(h => h.Date > DateTime.Now)),
            CasesPerCourt = cases
                .GroupBy(c => c.Court)
                .ToDictionary(g => g.Key, g => g.Count())
        };
    }
}
