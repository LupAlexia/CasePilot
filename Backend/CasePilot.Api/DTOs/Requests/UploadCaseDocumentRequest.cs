using CasePilot.Api.Models;
using Microsoft.AspNetCore.Http;

namespace CasePilot.Api.DTOs.Requests;

public class UploadCaseDocumentRequest
{
    public string Name { get; set; } = string.Empty;
    public DocumentType Type { get; set; }

    /// <summary>
    /// Plain text extracted client-side from the file (PDF/DOCX). Used by the AI.
    /// Optional — may be empty for image scans or unsupported formats.
    /// </summary>
    public string? TextContent { get; set; }

    public IFormFile? File { get; set; }
}
