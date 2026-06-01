using CasePilot.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace CasePilot.Api.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly IAuditService _auditService;
    private readonly IThreatDetectionService _threatDetectionService;

    public AdminController(
        IUserService userService,
        IAuditService auditService,
        IThreatDetectionService threatDetectionService)
    {
        _userService = userService;
        _auditService = auditService;
        _threatDetectionService = threatDetectionService;
    }

    private Guid GetAdminUserId()
    {
        var claim = User.FindFirst(JwtRegisteredClaimNames.Sub)
            ?? User.FindFirst(ClaimTypes.NameIdentifier);
        return claim is not null && Guid.TryParse(claim.Value, out var id) ? id : Guid.Empty;
    }

    // ── User Management ─────────────────────────────────────

    [HttpGet("users")]
    public IActionResult GetAllUsers()
    {
        var users = _userService.GetAll();
        return Ok(users);
    }

    [HttpGet("users/{id:guid}")]
    public IActionResult GetUser(Guid id)
    {
        var user = _userService.GetById(id);
        if (user is null) return NotFound("Utilizatorul nu a fost găsit.");
        return Ok(user);
    }

    [HttpPut("users/{id:guid}/deactivate")]
    public IActionResult DeactivateUser(Guid id)
    {
        var result = _userService.Deactivate(id);
        if (!result) return NotFound("Utilizatorul nu a fost găsit.");
        return Ok(new { message = "Utilizator dezactivat." });
    }

    [HttpPut("users/{id:guid}/activate")]
    public IActionResult ActivateUser(Guid id)
    {
        var result = _userService.Activate(id);
        if (!result) return NotFound("Utilizatorul nu a fost găsit.");
        return Ok(new { message = "Utilizator activat." });
    }

    // ── Audit Logs ──────────────────────────────────────────

    [HttpGet("audit-logs")]
    public IActionResult GetAuditLogs([FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        var logs = _auditService.GetAll(page, pageSize);
        return Ok(logs);
    }

    [HttpGet("audit-logs/user/{userId:guid}")]
    public IActionResult GetAuditLogsByUser(Guid userId)
    {
        var logs = _auditService.GetByUserId(userId);
        return Ok(logs);
    }

    // ── Suspicious Users Watchlist ──────────────────────────

    [HttpGet("suspicious-users")]
    public IActionResult GetWatchlist()
    {
        var watchlist = _threatDetectionService.GetWatchlist();
        return Ok(watchlist);
    }

    [HttpPut("suspicious-users/{id:guid}/resolve")]
    public IActionResult ResolveSuspiciousUser(Guid id)
    {
        var adminUserId = GetAdminUserId();
        var result = _threatDetectionService.Resolve(id, adminUserId);
        if (!result) return NotFound("Înregistrarea suspectă nu a fost găsită.");
        return Ok(new { message = "Utilizator marcat ca rezolvat." });
    }
}
