namespace CasePilot.Api.DTOs.Requests;

public class SummarizeDocumentRequest
{
    public Guid CaseId { get; set; }
    public Guid DocumentId { get; set; }
}
