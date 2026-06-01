using System;
using System.Collections.Generic;
using CasePilot.Api.Models;

namespace CasePilot.Api.DTOs.Responses;

public class LegalCaseResponse //sending case data from server to frontend  
{
    public Guid Id { get; set; }

    public string Number { get; set; } = string.Empty;
    public DateTime RegistrationDate { get; set; }
    public string Court { get; set; } = string.Empty;
    public string Object { get; set; } = string.Empty;
    public string Reclamant { get; set; } = string.Empty;
    public string Parat { get; set; } = string.Empty;

    public CaseStage Stage { get; set; }
    public CaseStatus Status { get; set; }

    public List<CaseDocumentResponse> Documents { get; set; } = new();
    public List<HearingTermResponse> Hearings { get; set; } = new();
}