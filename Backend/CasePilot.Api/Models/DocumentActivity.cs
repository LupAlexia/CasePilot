namespace CasePilot.Api.Models;

public class DocumentActivity
{
    public Guid Id { get; set; }

    public Guid CaseId { get; set; }

    public string CaseNumber { get; set; } = string.Empty;

    public string DocumentName { get; set; } = string.Empty;

    public string Action { get; set; } = string.Empty;

    public DateTime Date { get; set; }
}