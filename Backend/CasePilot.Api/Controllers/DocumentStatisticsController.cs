using CasePilot.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/statistics/documents")]
[Authorize]
public class DocumentStatisticsController : ControllerBase
{
    private readonly ICaseDocumentService _service;

    public DocumentStatisticsController(ICaseDocumentService service)
    {
        _service = service;
    }

    [HttpGet("recent")]
    public async Task<IActionResult> GetRecent()
    {
        var result = await _service.GetRecentDocuments(7);

        return Ok(result);
    }

    [HttpGet("activity")]
    public async Task<IActionResult> GetActivity()
    {
        var result = await _service.GetRecentActivity(7);

        return Ok(result);
    }
}