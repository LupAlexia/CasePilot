using CasePilot.Api.Models;

namespace CasePilot.Api.Storage;

public interface ILegalCaseRepository
{
    IQueryable<LegalCase> GetAll();
    LegalCase? GetById(Guid id);
    void Add(LegalCase legalCase);
    void Update(LegalCase legalCase);
    bool Delete(Guid id);
}
