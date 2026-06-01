using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using CasePilot.Api.DTOs.Requests;
using CasePilot.Api.DTOs.Responses;
using CasePilot.Api.Services.External;
using CasePilot.Api.Services.Interfaces;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace CasePilot.Api.Controllers;

[ApiController]
[Route("api/ai")]
[Authorize]
public class AiController : ControllerBase
{
    private readonly IAiService _aiService;
    private readonly IAuditService _auditService;
    private readonly IGeminiClient _geminiClient;

    public AiController(IAiService aiService, IAuditService auditService, IGeminiClient geminiClient)
    {
        _aiService    = aiService;
        _auditService = auditService;
        _geminiClient = geminiClient;
    }

    private Guid GetUserId()
    {
        var claim = User.FindFirst(JwtRegisteredClaimNames.Sub)
            ?? User.FindFirst(ClaimTypes.NameIdentifier);
        return claim is not null && Guid.TryParse(claim.Value, out var id) ? id : Guid.Empty;
    }

    private string GetUserRole() => User.FindFirst(ClaimTypes.Role)?.Value ?? "User";

    /// <summary>
    /// GET /api/ai/models
    /// Diagnostic: lists all Gemini models available for the configured API key
    /// that support generateContent (checked on both v1 and v1beta endpoints).
    /// Use this to find the correct model name if generation fails with 404.
    /// </summary>
    [HttpGet("models")]
    public async Task<IActionResult> ListModels()
    {
        var models = await _geminiClient.ListModelsAsync();
        return Ok(new { configuredModel = HttpContext.RequestServices
            .GetRequiredService<IConfiguration>()["Gemini:Model"], models });
    }

    /// <summary>
    /// POST /api/ai/generate
    /// Generates a legal document using Gemini, drawing from the case data and existing documents.
    /// </summary>
    [HttpPost("generate")]
    public async Task<IActionResult> Generate([FromBody] GenerateDocumentRequest request)
    {
        var userId = GetUserId();
        if (userId == Guid.Empty) return Unauthorized();

        try
        {
            var content = await _aiService.GenerateDocument(
                userId,
                request.CaseId,
                request.DocumentType,
                request.AdditionalData,
                request.TemplateText);

            _auditService.LogAction(
                userId, GetUserRole(), "AI_GENERATE", "CaseDocument",
                request.CaseId.ToString(),
                $"A generat un document de tip '{request.DocumentType}' pentru dosarul {request.CaseId}",
                HttpContext.Connection.RemoteIpAddress?.ToString());

            return Ok(new AiGenerateResponse { Content = content });
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("API"))
        {
            return StatusCode(503, new { message = ex.Message });
        }
        catch (HttpRequestException ex)
        {
            // Rate-limit, quota, or other Gemini API HTTP errors — already has a friendly message
            return StatusCode(503, new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// POST /api/ai/summarize
    /// Summarizes the extracted text of an uploaded document.
    /// </summary>
    [HttpPost("summarize")]
    public async Task<IActionResult> Summarize([FromBody] SummarizeDocumentRequest request)
    {
        var userId = GetUserId();
        if (userId == Guid.Empty) return Unauthorized();

        try
        {
            var summary = await _aiService.SummarizeDocument(
                userId, request.CaseId, request.DocumentId);

            _auditService.LogAction(
                userId, GetUserRole(), "AI_SUMMARIZE", "CaseDocument",
                request.DocumentId.ToString(),
                $"A generat o sinteză pentru documentul {request.DocumentId}",
                HttpContext.Connection.RemoteIpAddress?.ToString());

            return Ok(new AiSummarizeResponse { Summary = summary });
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("API"))
        {
            return StatusCode(503, new { message = ex.Message });
        }
        catch (HttpRequestException ex)
        {
            // Rate-limit, quota, or other Gemini API HTTP errors — already has a friendly message
            return StatusCode(503, new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
