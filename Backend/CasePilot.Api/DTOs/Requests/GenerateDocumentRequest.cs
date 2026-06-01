namespace CasePilot.Api.DTOs.Requests;

public class GenerateDocumentRequest
{
    public Guid CaseId { get; set; }

    /// <summary>
    /// Short key matching the frontend option values:
    /// amanare | probatoriu | concluzii | intampinare | alt
    /// </summary>
    public string DocumentType { get; set; } = string.Empty;

    public string AdditionalData { get; set; } = string.Empty;

    /// <summary>
    /// Optional template text extracted by the client from an uploaded DOCX.
    /// When present, Gemini will follow its structure.
    /// </summary>
    public string? TemplateText { get; set; }
}
