namespace CasePilot.Api.Services.Interfaces;

public interface IAiService
{
    /// <summary>
    /// Generates a legal document of the requested type, pulling data from the user's
    /// case (owner-scoped), its hearings, and existing document text.
    /// </summary>
    Task<string> GenerateDocument(
        Guid userId,
        Guid caseId,
        string documentType,
        string additionalData,
        string? templateText = null);

    /// <summary>
    /// Summarizes the stored text of a document.
    /// Returns a friendly message when the document has no extractable text.
    /// </summary>
    Task<string> SummarizeDocument(Guid userId, Guid caseId, Guid documentId);
}
