using CasePilot.Api.DTOs;
using CasePilot.Api.DTOs.Requests;
using CasePilot.Api.Models;

namespace CasePilot.Api.Services;

public interface ICaseDocumentService
{
    Task<List<CaseDocument>> GetByCaseId(Guid caseId);
    Task<CaseDocument> GetById(Guid caseId, Guid documentId);

    /// <summary>Legacy JSON-only create (kept for backward compat with existing tests).</summary>
    Task<CaseDocument> Create(Guid caseId, CreateCaseDocumentRequest request);

    /// <summary>Multipart upload — stores the actual file bytes + extracted text.</summary>
    Task<CaseDocument> Upload(Guid caseId, UploadCaseDocumentRequest request);

    /// <summary>Returns (bytes, contentType, filename) for the download endpoint, or null if no file is stored.</summary>
    Task<(byte[] Content, string ContentType, string Name)?> Download(Guid caseId, Guid documentId);

    Task<CaseDocument> Update(Guid caseId, Guid documentId, UpdateCaseDocumentRequest request);
    Task Delete(Guid caseId, Guid documentId);
    Task<List<CaseDocument>> GetRecentDocuments(int days);
    Task<List<DocumentActivity>> GetRecentActivity(int days);
}
