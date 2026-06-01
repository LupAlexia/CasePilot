using CasePilot.Api.DTOs.Responses;

namespace CasePilot.Api.Services.Interfaces;

public interface IAuditService
{
    void LogAction(Guid userId, string userRole, string action,
                   string entityType, string? entityId = null,
                   string? details = null, string? ipAddress = null);

    List<AuditLogResponse> GetAll(int page = 1, int pageSize = 50);
    List<AuditLogResponse> GetByUserId(Guid userId);
}
