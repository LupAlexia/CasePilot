using CasePilot.Api.DTOs.Responses;
using CasePilot.Api.Models;
using CasePilot.Api.Services.Interfaces;
using CasePilot.Api.Storage;
using Microsoft.EntityFrameworkCore;

namespace CasePilot.Api.Services;

public class AuditService : IAuditService
{
    private readonly CasePilotDbContext _context;

    public AuditService(CasePilotDbContext context)
    {
        _context = context;
    }

    public void LogAction(Guid userId, string userRole, string action,
                          string entityType, string? entityId = null,
                          string? details = null, string? ipAddress = null)
    {
        var log = new AuditLog
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            UserRole = userRole,
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            Details = details,
            IpAddress = ipAddress,
            // Convertim automat în ora României (Bucharest)
            Timestamp = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, TimeZoneInfo.FindSystemTimeZoneById("GTB Standard Time"))
        };

        _context.AuditLogs.Add(log);
        _context.SaveChanges();
    }

    public List<AuditLogResponse> GetAll(int page = 1, int pageSize = 50)
    {
        return _context.AuditLogs
            .Include(a => a.User)
            .OrderByDescending(a => a.Timestamp)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => MapToResponse(a))
            .ToList();
    }

    public List<AuditLogResponse> GetByUserId(Guid userId)
    {
        return _context.AuditLogs
            .Include(a => a.User)
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.Timestamp)
            .Select(a => MapToResponse(a))
            .ToList();
    }

    private static AuditLogResponse MapToResponse(AuditLog log)
    {
        return new AuditLogResponse
        {
            Id = log.Id,
            UserId = log.UserId,
            UserEmail = log.User.Email,
            UserRole = log.UserRole,
            Action = log.Action,
            EntityType = log.EntityType,
            EntityId = log.EntityId,
            Details = log.Details,
            IpAddress = log.IpAddress,
            Timestamp = log.Timestamp
        };
    }
}
