using CasePilot.Api.DTOs.Requests;
using CasePilot.Api.DTOs.Responses;

namespace CasePilot.Api.Services.Interfaces;

public interface ILegalCaseService
{
    PagedResponse<LegalCaseResponse> GetAll(Guid userId, int page, int pageSize);
    LegalCaseResponse? GetById(Guid userId, Guid id);
    LegalCaseResponse Create(Guid userId, CreateLegalCaseRequest request);
    LegalCaseResponse? Update(Guid userId, Guid id, UpdateLegalCaseRequest request);
    bool Delete(Guid userId, Guid id);
}