using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using CasePilot.Api.DTOs;
using CasePilot.Api.DTOs.Requests;
using CasePilot.Api.Services;
using CasePilot.Api.Services.Interfaces;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace CasePilot.Api.Controllers;

[ApiController]
[Route("api/cases/{caseId}/documents")]
[Authorize]
public class CaseDocumentsController : ControllerBase
{
    private readonly ICaseDocumentService _service;
    private readonly IAuditService _auditService;
    private readonly IThreatDetectionService _threatDetectionService;

    public CaseDocumentsController(
        ICaseDocumentService service,
        IAuditService auditService,
        IThreatDetectionService threatDetectionService)
    {
        _service = service;
        _auditService = auditService;
        _threatDetectionService = threatDetectionService;
    }

    private Guid GetUserId()
    {
        var claim = User.FindFirst(JwtRegisteredClaimNames.Sub)
            ?? User.FindFirst(ClaimTypes.NameIdentifier);
        return claim is not null && Guid.TryParse(claim.Value, out var id) ? id : Guid.Empty;
    }

    private string GetUserRole() => User.FindFirst(ClaimTypes.Role)?.Value ?? "User";

    [HttpGet]
    public async Task<IActionResult> Get(Guid caseId)
    {
        var result = await _service.GetByCaseId(caseId);
        LogAction("VIEW", "CaseDocument", details: $"A vizualizat documentele dosarului {caseId}");
        return Ok(result);
    }

    /// <summary>
    /// Upload a document with its actual file content (multipart/form-data).
    /// Fields: name, type, textContent (optional), file (optional ≤15 MB).
    /// </summary>
    [HttpPost]
    [RequestSizeLimit(16 * 1024 * 1024)] // 16 MB to allow for the 15 MB file + form overhead
    public async Task<IActionResult> Upload(
        Guid caseId,
        [FromForm] UploadCaseDocumentRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest("Numele documentului este obligatoriu.");

        try
        {
            var result = await _service.Upload(caseId, request);
            LogAction("CREATE", "CaseDocument", result.Id.ToString(),
                $"A încărcat documentul '{request.Name}' în dosarul {caseId}");
            return Ok(result);
        }
        catch (Exception ex) when (ex.Message.Contains("15 MB"))
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>Download the original file bytes for a document.</summary>
    [HttpGet("{documentId}/download")]
    public async Task<IActionResult> Download(Guid caseId, Guid documentId)
    {
        var result = await _service.Download(caseId, documentId);

        if (result is null)
            return NotFound(new { message = "Fișierul nu este disponibil pentru acest document." });

        var (content, contentType, name) = result.Value;

        var safeFileName = Uri.EscapeDataString(name);
        Response.Headers.Append("Content-Disposition",
            $"attachment; filename=\"{safeFileName}\"; filename*=UTF-8''{safeFileName}");

        LogAction("DOWNLOAD", "CaseDocument", documentId.ToString(),
            $"A descărcat documentul '{name}' din dosarul {caseId}");

        return File(content, contentType, name);
    }

    [HttpPut("{documentId}")]
    public async Task<IActionResult> Update(
        Guid caseId,
        Guid documentId,
        UpdateCaseDocumentRequest request)
    {
        var result = await _service.Update(caseId, documentId, request);
        LogAction("UPDATE", "CaseDocument", documentId.ToString(),
            $"A actualizat documentul '{request.Name}' din dosarul {caseId}");
        return Ok(result);
    }

    [HttpDelete("{documentId}")]
    public async Task<IActionResult> Delete(Guid caseId, Guid documentId)
    {
        await _service.Delete(caseId, documentId);
        LogAction("DELETE", "CaseDocument", documentId.ToString(),
            $"A șters un document din dosarul {caseId}");
        _threatDetectionService.Analyze(GetUserId());
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
