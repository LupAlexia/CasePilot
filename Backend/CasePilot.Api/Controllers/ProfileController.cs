using CasePilot.Api.DTOs.Requests;
using CasePilot.Api.Storage;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace CasePilot.Api.Controllers;

[ApiController]
[Route("api/users/me")]
[Authorize]
public class ProfileController : ControllerBase
{
    private readonly CasePilotDbContext _context;

    public ProfileController(CasePilotDbContext context)
    {
        _context = context;
    }

    private Guid GetUserId()
    {
        var claim = User.FindFirst(JwtRegisteredClaimNames.Sub)
            ?? User.FindFirst(ClaimTypes.NameIdentifier);
        return claim is not null && Guid.TryParse(claim.Value, out var id) ? id : Guid.Empty;
    }

    [HttpPut]
    public IActionResult UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        var userId = GetUserId();
        if (userId == Guid.Empty) return Unauthorized();

        var user = _context.Users.Find(userId);
        if (user is null) return NotFound();

        user.FullName = request.FullName.Trim();
        _context.SaveChanges();

        return Ok(new { fullName = user.FullName });
    }

    [HttpGet("preferences")]
    public IActionResult GetPreferences()
    {
        var userId = GetUserId();
        if (userId == Guid.Empty) return Unauthorized();

        var user = _context.Users.Find(userId);
        if (user is null) return NotFound();

        return Ok(new
        {
            hearingNotificationsEnabled = user.HearingNotificationsEnabled,
            createdAt = user.CreatedAt
        });
    }

    [HttpPut("preferences")]
    public IActionResult UpdatePreferences([FromBody] UpdatePreferencesRequest request)
    {
        var userId = GetUserId();
        if (userId == Guid.Empty) return Unauthorized();

        var user = _context.Users.Find(userId);
        if (user is null) return NotFound();

        user.HearingNotificationsEnabled = request.HearingNotificationsEnabled;
        _context.SaveChanges();

        return Ok(new { hearingNotificationsEnabled = user.HearingNotificationsEnabled });
    }
}
