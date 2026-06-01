using CasePilot.Api.DTOs.Responses;
using CasePilot.Api.Models;
using CasePilot.Api.Services.Interfaces;
using CasePilot.Api.Storage;
using Microsoft.EntityFrameworkCore;

namespace CasePilot.Api.Services;

public class ThreatDetectionService : IThreatDetectionService
{
    private readonly CasePilotDbContext _context;

    // Detection thresholds
    private const int BruteForceThreshold = 5;        // failed logins
    private const int BruteForceWindowMinutes = 10;
    private const int MassDeleteThreshold = 5;         // deletes
    private const int MassDeleteWindowMinutes = 5;
    private const int RapidActionThreshold = 30;       // any actions
    private const int RapidActionWindowMinutes = 5;
    private const int OffHoursStart = 2;               // 2 AM
    private const int OffHoursEnd = 5;                 // 5 AM

    public ThreatDetectionService(CasePilotDbContext context)
    {
        _context = context;
    }

    public void Analyze(Guid userId)
    {
        var now = DateTime.UtcNow;

        // Rule 1: Brute Force — ≥5 failed logins in 10 minutes
        var bruteForceWindow = now.AddMinutes(-BruteForceWindowMinutes);
        var failedLogins = _context.AuditLogs
            .Count(a => a.UserId == userId
                     && a.Action == "LOGIN_FAILED"
                     && a.Timestamp >= bruteForceWindow);

        if (failedLogins >= BruteForceThreshold)
        {
            FlagUser(userId, $"Forțare conectare: {failedLogins} logări eșuate în {BruteForceWindowMinutes} minute", 80);
        }

        // Rule 2: Mass Delete — ≥5 deletes in 5 minutes
        var massDeleteWindow = now.AddMinutes(-MassDeleteWindowMinutes);
        var deleteCount = _context.AuditLogs
            .Count(a => a.UserId == userId
                     && a.Action == "DELETE"
                     && a.Timestamp >= massDeleteWindow);

        if (deleteCount >= MassDeleteThreshold)
        {
            FlagUser(userId, $"Ștergere în masă: {deleteCount} ștergeri în {MassDeleteWindowMinutes} minute", 90);
        }

        // Rule 3: Rapid Actions — ≥30 actions in 5 minutes
        var rapidWindow = now.AddMinutes(-RapidActionWindowMinutes);
        var actionCount = _context.AuditLogs
            .Count(a => a.UserId == userId
                     && a.Timestamp >= rapidWindow);

        if (actionCount >= RapidActionThreshold)
        {
            FlagUser(userId, $"Activitate rapidă: {actionCount} acțiuni în {RapidActionWindowMinutes} minute", 60);
        }

        // Rule 4: Off-Hours — actions between 2AM and 5AM (UTC)
        var lastAction = _context.AuditLogs
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.Timestamp)
            .FirstOrDefault();

        if (lastAction is not null)
        {
            var hour = lastAction.Timestamp.Hour;
            if (hour >= OffHoursStart && hour < OffHoursEnd)
            {
                FlagUser(userId, $"Activitate nocturnă detectată la ora {lastAction.Timestamp:HH:mm}", 30);
            }
        }
    }

    public List<SuspiciousUserResponse> GetWatchlist()
    {
        return _context.SuspiciousUsers
            .Include(s => s.User)
            .OrderByDescending(s => s.SeverityScore)
            .ThenByDescending(s => s.DetectedAt)
            .Select(s => new SuspiciousUserResponse
            {
                Id = s.Id,
                UserId = s.UserId,
                UserEmail = s.User.Email,
                UserFullName = s.User.FullName,
                Reason = s.Reason,
                SeverityScore = s.SeverityScore,
                DetectedAt = s.DetectedAt,
                IsResolved = s.IsResolved,
                ResolvedAt = s.ResolvedAt
            })
            .ToList();
    }

    public bool Resolve(Guid suspiciousUserId, Guid adminUserId)
    {
        var entry = _context.SuspiciousUsers.Find(suspiciousUserId);
        if (entry is null) return false;

        entry.IsResolved = true;
        entry.ResolvedByUserId = adminUserId;
        entry.ResolvedAt = TimeZoneHelper.ToRomanian(DateTime.UtcNow);
        _context.SaveChanges();
        return true;
    }

    private void FlagUser(Guid userId, string reason, int severity)
    {
        // Don't create duplicate flags for the same reason within the last hour
        var recentFlag = _context.SuspiciousUsers
            .Any(s => s.UserId == userId
                   && s.Reason == reason
                   && !s.IsResolved
                   && s.DetectedAt >= DateTime.UtcNow.AddHours(-1));

        if (recentFlag) return;

        _context.SuspiciousUsers.Add(new SuspiciousUser
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Reason = reason,
            SeverityScore = severity,
            DetectedAt = TimeZoneHelper.ToRomanian(DateTime.UtcNow),
            IsResolved = false
        });

        _context.SaveChanges();
    }
}
