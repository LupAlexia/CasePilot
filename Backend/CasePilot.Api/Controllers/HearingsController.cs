using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using CasePilot.Api.DTOs.Responses;
using CasePilot.Api.Storage;
using Microsoft.EntityFrameworkCore;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace CasePilot.Api.Controllers;

[ApiController]
[Route("api/hearings")]
[Authorize]
public class HearingsController : ControllerBase
{
    private readonly CasePilotDbContext _context;

    public HearingsController(CasePilotDbContext context)
    {
        _context = context;
    }

    private Guid GetUserId()
    {
        var claim = User.FindFirst(JwtRegisteredClaimNames.Sub)
            ?? User.FindFirst(ClaimTypes.NameIdentifier);
        return claim is not null && Guid.TryParse(claim.Value, out var id) ? id : Guid.Empty;
    }

    /// <summary>
    /// GET /api/hearings
    /// Returns all hearing terms belonging to the current user's cases,
    /// enriched with case context (number, court) for the calendar.
    /// </summary>
    [HttpGet]
    public IActionResult GetAll()
    {
        var userId = GetUserId();
        if (userId == Guid.Empty) return Unauthorized();

        var hearings = _context.HearingTerms
            .Include(h => h.LegalCase)
            .Where(h => h.LegalCase != null && h.LegalCase.CreatedByUserId == userId)
            .OrderBy(h => h.Date)
            .Select(h => new HearingWithCaseResponse
            {
                Id        = h.Id,
                Title     = h.Title,
                Date      = h.Date,
                CourtRoom = h.CourtRoom,
                Note      = h.Note,
                CaseId     = h.LegalCaseId,
                CaseNumber = h.LegalCase!.Number,
                Court      = h.LegalCase.Court
            })
            .ToList();

        return Ok(hearings);
    }
}
