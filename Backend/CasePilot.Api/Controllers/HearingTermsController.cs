using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using CasePilot.Api.DTOs.Requests;
using CasePilot.Api.DTOs.Responses;
using CasePilot.Api.Models;
using CasePilot.Api.Services.Interfaces;
using CasePilot.Api.Storage;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace CasePilot.Api.Controllers;

[ApiController]
[Route("api/cases/{caseId}/hearings")]
[Authorize]
public class HearingTermsController : ControllerBase
{
    private readonly CasePilotDbContext _context;
    private readonly IAuditService _auditService;

    public HearingTermsController(CasePilotDbContext context, IAuditService auditService)
    {
        _context = context;
        _auditService = auditService;
    }

    private Guid GetUserId()
    {
        var claim = User.FindFirst(JwtRegisteredClaimNames.Sub)
            ?? User.FindFirst(ClaimTypes.NameIdentifier);
        return claim is not null && Guid.TryParse(claim.Value, out var id) ? id : Guid.Empty;
    }

    private string GetUserRole() => User.FindFirst(ClaimTypes.Role)?.Value ?? "User";

    [HttpPost]
    public IActionResult Create(Guid caseId, [FromBody] CreateHearingTermRequest request)
    {
        var userId = GetUserId();
        if (userId == Guid.Empty) return Unauthorized();

        var legalCase = _context.LegalCases
            .FirstOrDefault(c => c.Id == caseId && c.CreatedByUserId == userId);

        if (legalCase is null) return NotFound(new { message = "Dosarul nu a fost găsit." });

        var hearing = new HearingTerm
        {
            Id = Guid.NewGuid(),
            Title = request.Title,
            Date = request.Date,
            CourtRoom = request.CourtRoom,
            Note = request.Note,
            LegalCaseId = caseId
        };

        _context.HearingTerms.Add(hearing);
        _context.DocumentActivities.Add(new DocumentActivity
        {
            Id = Guid.NewGuid(),
            CaseId = caseId,
            CaseNumber = legalCase.Number,
            DocumentName = $"Termen: {hearing.Title}",
            Action = "Adăugare termen",
            Date = DateTime.UtcNow
        });
        _context.SaveChanges();

        _auditService.LogAction(userId, GetUserRole(), "CREATE", "HearingTerm",
            hearing.Id.ToString(),
            $"A adăugat termenul '{hearing.Title}' la dosarul {caseId}",
            HttpContext.Connection.RemoteIpAddress?.ToString());

        return Ok(new HearingTermResponse
        {
            Id = hearing.Id,
            Title = hearing.Title,
            Date = hearing.Date,
            CourtRoom = hearing.CourtRoom,
            Note = hearing.Note
        });
    }

    [HttpPut("{hearingId}")]
    public IActionResult Update(Guid caseId, Guid hearingId, [FromBody] UpdateHearingTermRequest request)
    {
        var userId = GetUserId();
        if (userId == Guid.Empty) return Unauthorized();

        var legalCase = _context.LegalCases
            .FirstOrDefault(c => c.Id == caseId && c.CreatedByUserId == userId);

        if (legalCase is null) return NotFound(new { message = "Dosarul nu a fost găsit." });

        var hearing = _context.HearingTerms
            .FirstOrDefault(h => h.Id == hearingId && h.LegalCaseId == caseId);

        if (hearing is null) return NotFound(new { message = "Termenul nu a fost găsit." });

        hearing.Title = request.Title;
        hearing.Date = request.Date;
        hearing.CourtRoom = request.CourtRoom;
        hearing.Note = request.Note;

        _context.DocumentActivities.Add(new DocumentActivity
        {
            Id = Guid.NewGuid(),
            CaseId = caseId,
            CaseNumber = legalCase.Number,
            DocumentName = $"Termen: {hearing.Title}",
            Action = "Modificare termen",
            Date = DateTime.UtcNow
        });
        _context.SaveChanges();

        _auditService.LogAction(userId, GetUserRole(), "UPDATE", "HearingTerm",
            hearing.Id.ToString(),
            $"A actualizat termenul '{hearing.Title}' din dosarul {caseId}",
            HttpContext.Connection.RemoteIpAddress?.ToString());

        return Ok(new HearingTermResponse
        {
            Id = hearing.Id,
            Title = hearing.Title,
            Date = hearing.Date,
            CourtRoom = hearing.CourtRoom,
            Note = hearing.Note
        });
    }

    [HttpDelete("{hearingId}")]
    public IActionResult Delete(Guid caseId, Guid hearingId)
    {
        var userId = GetUserId();
        if (userId == Guid.Empty) return Unauthorized();

        var legalCase = _context.LegalCases
            .FirstOrDefault(c => c.Id == caseId && c.CreatedByUserId == userId);

        if (legalCase is null) return NotFound(new { message = "Dosarul nu a fost găsit." });

        var hearing = _context.HearingTerms
            .FirstOrDefault(h => h.Id == hearingId && h.LegalCaseId == caseId);

        if (hearing is null) return NotFound(new { message = "Termenul nu a fost găsit." });

        _context.DocumentActivities.Add(new DocumentActivity
        {
            Id = Guid.NewGuid(),
            CaseId = caseId,
            CaseNumber = legalCase.Number,
            DocumentName = $"Termen: {hearing.Title}",
            Action = "Ștergere termen",
            Date = DateTime.UtcNow
        });
        _context.HearingTerms.Remove(hearing);
        _context.SaveChanges();

        _auditService.LogAction(userId, GetUserRole(), "DELETE", "HearingTerm",
            hearingId.ToString(),
            $"A șters un termen din dosarul {caseId}",
            HttpContext.Connection.RemoteIpAddress?.ToString());

        return NoContent();
    }
}
