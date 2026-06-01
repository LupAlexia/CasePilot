using CasePilot.Api.DTOs.Requests;
using CasePilot.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace CasePilot.Api.Controllers;

// Controller - handling HTTP requests -> calling services -> returning HTPP responses

[ApiController] // indicates that this class is an API controller=> automatically handle DTO validation errors and return appropriate HTTP responses without needing to write additional code for that.
[Route("api/[controller]")]//defines the base route for this controller, [controller] is a placeholder that will be replaced with the name of the controller (without "Controller" suffix), so in this case it will be "api/legalcases"
[Authorize]
public class LegalCasesController : ControllerBase
{
    private readonly ILegalCaseService _legalCaseService;
    private readonly IAuditService _auditService;
    private readonly IThreatDetectionService _threatDetectionService;

    public LegalCasesController(
        ILegalCaseService legalCaseService,
        IAuditService auditService,
        IThreatDetectionService threatDetectionService)
    {
        _legalCaseService = legalCaseService;
        _auditService = auditService;
        _threatDetectionService = threatDetectionService;
    }

    private Guid GetUserId()
    {
        var claim = User.FindFirst(JwtRegisteredClaimNames.Sub)
            ?? User.FindFirst(ClaimTypes.NameIdentifier);
        return claim is not null && Guid.TryParse(claim.Value, out var id) ? id : Guid.Empty;
    }

    private string GetUserRole()
    {
        return User.FindFirst(ClaimTypes.Role)?.Value ?? "User";
    }

    [HttpGet]
    public IActionResult GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var userId = GetUserId();
        if (userId == Guid.Empty)
            return Unauthorized("Utilizatorul nu este autentificat.");

        if (page < 1)
            return BadRequest("Parametrul 'page' trebuie să fie cel puțin 1.");

        if (pageSize < 1 || pageSize > 100)
            return BadRequest("Parametrul 'pageSize' trebuie să fie între 1 și 100.");

        var result = _legalCaseService.GetAll(userId, page, pageSize);

        LogAction("VIEW", "LegalCases", details: "A vizualizat toate dosarele");

        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public IActionResult GetById(Guid id)
    {
        var userId = GetUserId();
        if (userId == Guid.Empty)
            return Unauthorized("Utilizatorul nu este autentificat.");

        var legalCase = _legalCaseService.GetById(userId, id);

        if (legalCase is null)
            return NotFound("Dosarul nu a fost găsit.");

        LogAction("VIEW", "LegalCase", id.ToString(), details: $"A vizualizat dosarul {id}");

        return Ok(legalCase);
    }

    [HttpPost]
    public IActionResult Create([FromBody] CreateLegalCaseRequest request)
    {
        var userId = GetUserId();
        if (userId == Guid.Empty)
            return Unauthorized("Utilizatorul nu este autentificat.");

        var createdCase = _legalCaseService.Create(userId, request);

        LogAction("CREATE", "LegalCase", createdCase.Id.ToString(),
            $"Dosar creat: {request.Number}");

        return CreatedAtAction(
            nameof(GetById),
            new { id = createdCase.Id },
            createdCase);
    }

    [HttpPut("{id:guid}")]
    public IActionResult Update(Guid id, [FromBody] UpdateLegalCaseRequest request)
    {
        var userId = GetUserId();
        if (userId == Guid.Empty)
            return Unauthorized("Utilizatorul nu este autentificat.");

        var updatedCase = _legalCaseService.Update(userId, id, request);

        if (updatedCase is null)
            return NotFound("Dosarul care trebuie actualizat nu a fost găsit.");

        LogAction("UPDATE", "LegalCase", id.ToString(),
            $"Dosar actualizat: {request.Number}");

        return Ok(updatedCase);
    }

    [HttpDelete("{id:guid}")]
    public IActionResult Delete(Guid id)
    {
        var userId = GetUserId();
        if (userId == Guid.Empty)
            return Unauthorized("Utilizatorul nu este autentificat.");

        var deleted = _legalCaseService.Delete(userId, id);

        if (!deleted)
            return NotFound("Dosarul care trebuie șters nu a fost găsit.");

        LogAction("DELETE", "LegalCase", id.ToString(), details: "Dosar șters");
        _threatDetectionService.Analyze(userId);

        return NoContent();
    }

    private void LogAction(string action, string entityType, string? entityId = null, string? details = null)
    {
        var userId = GetUserId();
        if (userId != Guid.Empty)
        {
            var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
            _auditService.LogAction(userId, GetUserRole(), action, entityType, entityId, details, ip);
        }
    }
}