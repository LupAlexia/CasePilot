using CasePilot.Api.Models;

namespace CasePilot.Api.DTOs.Responses;

public class CaseDocumentResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public DocumentType Type { get; set; }
    public DateTime UploadedAt { get; set; }
    public string? ContentType { get; set; }
    public long SizeBytes { get; set; }
    public bool HasContent { get; set; }
}
