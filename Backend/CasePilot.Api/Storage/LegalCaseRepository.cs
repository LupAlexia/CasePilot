using CasePilot.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CasePilot.Api.Storage;

public class LegalCaseRepository : ILegalCaseRepository
{
    private readonly CasePilotDbContext _context;

    public LegalCaseRepository(CasePilotDbContext context)
    {
        _context = context;
    }

    public IQueryable<LegalCase> GetAll()
    {
        return _context.LegalCases
            .Include(c => c.Documents)
            .Include(c => c.Hearings);
    }

    public LegalCase? GetById(Guid id)
    {
        return _context.LegalCases
            .Include(c => c.Documents)
            .Include(c => c.Hearings)
            .FirstOrDefault(c => c.Id == id);
    }

    public void Add(LegalCase legalCase)
    {
        _context.LegalCases.Add(legalCase);
        _context.SaveChanges();
    }

    public void Update(LegalCase legalCase)
    {
        _context.LegalCases.Update(legalCase);
        _context.SaveChanges();
    }

    public bool Delete(Guid id)
    {
        var entity = _context.LegalCases.Find(id);
        if (entity == null)
            return false;

        _context.LegalCases.Remove(entity);
        _context.SaveChanges();
        return true;
    }
}
