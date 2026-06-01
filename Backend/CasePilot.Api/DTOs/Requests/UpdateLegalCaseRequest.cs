using System;
using CasePilot.Api.Models;

namespace CasePilot.Api.DTOs.Requests;

public class UpdateLegalCaseRequest
{
    public string Number { get; set; } = string.Empty;
    public DateTime RegistrationDate { get; set; }
    public string Court { get; set; } = string.Empty;
    public string Object { get; set; } = string.Empty;
    public string Reclamant { get; set; } = string.Empty;
    public string Parat { get; set; } = string.Empty;
    public CaseStage Stage { get; set; }
    public CaseStatus Status { get; set; }
}