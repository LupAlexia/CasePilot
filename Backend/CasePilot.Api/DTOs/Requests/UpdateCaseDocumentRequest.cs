using CasePilot.Api.Models;

namespace CasePilot.Api.DTOs;

public class UpdateCaseDocumentRequest
{
    public string Name { get; set; } = string.Empty;

    public DocumentType Type { get; set; }
}