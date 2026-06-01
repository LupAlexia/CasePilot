using CasePilot.Api.DTOs.Responses;

namespace CasePilot.Api.Services.Interfaces;

public interface IStatisticsService
{
    CaseStatisticsResponse GetCaseStatistics(Guid userId);
}