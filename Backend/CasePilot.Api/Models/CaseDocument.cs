namespace CasePilot.Api.Models;

public class CaseDocument
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public DocumentType Type { get; set; }
    public DateTime UploadedAt { get; set; }

    // ── File storage ───────────────────────────────────────────
    // Never serialized to JSON – only returned via the dedicated download endpoint.
    [System.Text.Json.Serialization.JsonIgnore]
    public byte[]? Content { get; set; }

    public string? ContentType { get; set; }       // e.g. "application/pdf"
    public long SizeBytes { get; set; }

    // Plain-text extract used by the AI (never sent to the client directly).
    [System.Text.Json.Serialization.JsonIgnore]
    public string? TextContent { get; set; }

    public Guid LegalCaseId { get; set; }

    [System.Text.Json.Serialization.JsonIgnore]
    public LegalCase? LegalCase { get; set; }
}
