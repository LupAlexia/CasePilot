using CasePilot.Api.DTOs;
using CasePilot.Api.DTOs.Requests;
using CasePilot.Api.Models;
using CasePilot.Api.Storage;
using Microsoft.EntityFrameworkCore;

namespace CasePilot.Api.Services;

public class CaseDocumentService : ICaseDocumentService
{
    private readonly ILegalCaseRepository _repository;
    private readonly CasePilotDbContext _context;
    private const long MaxFileSizeBytes = 15 * 1024 * 1024; // 15 MB

    public CaseDocumentService(ILegalCaseRepository repository, CasePilotDbContext context)
    {
        _repository = repository;
        _context = context;
    }

    public Task<List<CaseDocument>> GetByCaseId(Guid caseId)
    {
        var documents = _context.CaseDocuments
            .Where(d => d.LegalCaseId == caseId)
            .ToList();
        return Task.FromResult(documents);
    }

    public Task<CaseDocument> GetById(Guid caseId, Guid documentId)
    {
        var doc = _context.CaseDocuments
            .FirstOrDefault(d => d.LegalCaseId == caseId && d.Id == documentId);
        return Task.FromResult(doc!);
    }

    /// <summary>Legacy JSON-only create (no file stored).</summary>
    public Task<CaseDocument> Create(Guid caseId, CreateCaseDocumentRequest request)
    {
        var legalCase = _repository.GetById(caseId);
        if (legalCase is null) throw new Exception("Legal case not found.");

        var document = new CaseDocument
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Type = request.Type,
            UploadedAt = DateTime.UtcNow,
            LegalCaseId = caseId
        };

        _context.CaseDocuments.Add(document);
        _context.DocumentActivities.Add(new DocumentActivity
        {
            Id = Guid.NewGuid(),
            CaseId = caseId,
            CaseNumber = legalCase.Number,
            DocumentName = document.Name,
            Action = "Încărcare document nou",
            Date = DateTime.UtcNow
        });
        _context.SaveChanges();

        return Task.FromResult(document);
    }

    /// <summary>Multipart upload — stores actual file bytes + extracted text.</summary>
    public async Task<CaseDocument> Upload(Guid caseId, UploadCaseDocumentRequest request)
    {
        var legalCase = _repository.GetById(caseId);
        if (legalCase is null) throw new Exception("Legal case not found.");

        byte[]? content = null;
        string? contentType = null;
        long sizeBytes = 0;

        if (request.File is { Length: > 0 })
        {
            if (request.File.Length > MaxFileSizeBytes)
                throw new Exception("Fișierul depășește limita maximă de 15 MB.");

            using var ms = new MemoryStream();
            await request.File.CopyToAsync(ms);
            content = ms.ToArray();
            contentType = request.File.ContentType;
            sizeBytes = request.File.Length;
        }

        var document = new CaseDocument
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Type = request.Type,
            UploadedAt = DateTime.UtcNow,
            LegalCaseId = caseId,
            Content = content,
            ContentType = contentType,
            SizeBytes = sizeBytes,
            TextContent = string.IsNullOrWhiteSpace(request.TextContent) ? null : request.TextContent
        };

        _context.CaseDocuments.Add(document);
        _context.DocumentActivities.Add(new DocumentActivity
        {
            Id = Guid.NewGuid(),
            CaseId = caseId,
            CaseNumber = legalCase.Number,
            DocumentName = document.Name,
            Action = "Încărcare document nou",
            Date = DateTime.UtcNow
        });
        _context.SaveChanges();

        return document;
    }

    public Task<(byte[] Content, string ContentType, string Name)?> Download(Guid caseId, Guid documentId)
    {
        var doc = _context.CaseDocuments
            .FirstOrDefault(d => d.LegalCaseId == caseId && d.Id == documentId);

        if (doc?.Content is null || doc.Content.Length == 0)
            return Task.FromResult<(byte[], string, string)?>(null);

        return Task.FromResult<(byte[], string, string)?>((
            doc.Content,
            doc.ContentType ?? "application/octet-stream",
            doc.Name
        ));
    }

    public Task<CaseDocument> Update(Guid caseId, Guid documentId, UpdateCaseDocumentRequest request)
    {
        var doc = _context.CaseDocuments
            .FirstOrDefault(d => d.LegalCaseId == caseId && d.Id == documentId);
        if (doc is null) throw new Exception("Document not found.");

        var legalCase = _repository.GetById(caseId);

        doc.Name = request.Name;
        doc.Type = request.Type;

        _context.DocumentActivities.Add(new DocumentActivity
        {
            Id = Guid.NewGuid(),
            CaseId = caseId,
            CaseNumber = legalCase?.Number ?? string.Empty,
            DocumentName = doc.Name,
            Action = "Modificare document",
            Date = DateTime.UtcNow
        });
        _context.SaveChanges();

        return Task.FromResult(doc);
    }

    public Task Delete(Guid caseId, Guid documentId)
    {
        var doc = _context.CaseDocuments
            .FirstOrDefault(d => d.LegalCaseId == caseId && d.Id == documentId);
        if (doc is null) return Task.CompletedTask;

        var legalCase = _repository.GetById(caseId);

        _context.DocumentActivities.Add(new DocumentActivity
        {
            Id = Guid.NewGuid(),
            CaseId = caseId,
            CaseNumber = legalCase?.Number ?? string.Empty,
            DocumentName = doc.Name,
            Action = "Ștergere document",
            Date = DateTime.UtcNow
        });
        _context.CaseDocuments.Remove(doc);
        _context.SaveChanges();

        return Task.CompletedTask;
    }

    public Task<List<CaseDocument>> GetRecentDocuments(int days)
    {
        var cutoff = DateTime.UtcNow.AddDays(-days);
        var result = _context.CaseDocuments
            .Where(d => d.UploadedAt >= cutoff)
            .ToList();
        return Task.FromResult(result);
    }

    public Task<List<DocumentActivity>> GetRecentActivity(int days)
    {
        var cutoff = DateTime.UtcNow.AddDays(-days);
        var result = _context.DocumentActivities
            .Where(a => a.Date >= cutoff)
            .OrderByDescending(a => a.Date)
            .ToList();

        foreach (var activity in result)
        {
            activity.Date = TimeZoneHelper.ToRomanian(activity.Date);
        }

        return Task.FromResult(result);
    }
}
