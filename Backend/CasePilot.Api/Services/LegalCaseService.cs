using CasePilot.Api.DTOs.Requests;
using CasePilot.Api.DTOs.Responses;
using CasePilot.Api.Models;
using CasePilot.Api.Services.Interfaces;
using CasePilot.Api.Storage;

namespace CasePilot.Api.Services;

public class LegalCaseService : ILegalCaseService
{
    private readonly ILegalCaseRepository _repository;

    public LegalCaseService(ILegalCaseRepository repository)
    {
        _repository = repository;
    }

    public PagedResponse<LegalCaseResponse> GetAll(Guid userId, int page, int pageSize)
    {
        var allCases = _repository
            .GetAll()
            .Where(c => c.CreatedByUserId == userId)
            .OrderByDescending(c => c.RegistrationDate)
            .ToList();

        var totalCount = allCases.Count;
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        var items = allCases
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(MapToResponse)
            .ToList();

        return new PagedResponse<LegalCaseResponse>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount,
            TotalPages = totalPages
        };
    }

    public LegalCaseResponse? GetById(Guid userId, Guid id)
    {
        var legalCase = _repository.GetById(id);
        if (legalCase is null || legalCase.CreatedByUserId != userId) return null;
        return MapToResponse(legalCase);
    }

    public LegalCaseResponse Create(Guid userId, CreateLegalCaseRequest request)
    {
        var legalCase = new LegalCase
        {
            Id = Guid.NewGuid(),
            Number = request.Number,
            RegistrationDate = request.RegistrationDate,
            Court = request.Court,
            Object = request.Object,
            Reclamant = request.Reclamant,
            Parat = request.Parat,
            Stage = request.Stage,
            Status = request.Status,
            CreatedByUserId = userId,
            Documents = new List<CaseDocument>(),
            Hearings = new List<HearingTerm>()
        };

        _repository.Add(legalCase);

        return MapToResponse(legalCase);
    }

    public LegalCaseResponse? Update(Guid userId, Guid id, UpdateLegalCaseRequest request)
    {
        var existingCase = _repository.GetById(id);

        if (existingCase is null || existingCase.CreatedByUserId != userId)
        {
            return null;
        }

        existingCase.Number = request.Number;
        existingCase.RegistrationDate = request.RegistrationDate;
        existingCase.Court = request.Court;
        existingCase.Object = request.Object;
        existingCase.Reclamant = request.Reclamant;
        existingCase.Parat = request.Parat;
        existingCase.Stage = request.Stage;
        existingCase.Status = request.Status;

        _repository.Update(existingCase);

        return MapToResponse(existingCase);
    }

    public bool Delete(Guid userId, Guid id)
    {
        var existingCase = _repository.GetById(id);
        if (existingCase is null || existingCase.CreatedByUserId != userId) return false;
        return _repository.Delete(id);
    }

    // converting model object LegalCase -> DTO LegalCaseResponse
    private static LegalCaseResponse MapToResponse(LegalCase legalCase)
    {
        return new LegalCaseResponse
        {
            Id = legalCase.Id,
            Number = legalCase.Number,
            RegistrationDate = legalCase.RegistrationDate,
            Court = legalCase.Court,
            Object = legalCase.Object,
            Reclamant = legalCase.Reclamant,
            Parat = legalCase.Parat,
            Stage = legalCase.Stage,
            Status = legalCase.Status,
            Documents = legalCase.Documents
                .Select(d => new CaseDocumentResponse
                {
                    Id = d.Id,
                    Name = d.Name,
                    Type = d.Type,
                    UploadedAt = d.UploadedAt
                })
                .ToList(),
            Hearings = legalCase.Hearings
                .Select(h => new HearingTermResponse
                {
                    Id = h.Id,
                    Title = h.Title,
                    Date = h.Date,
                    CourtRoom = h.CourtRoom,
                    Note = h.Note
                })
                .ToList()
        };
    }
}