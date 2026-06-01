namespace CasePilot.Api.Models;

public class AppRolePermission
{
    public Guid RoleId { get; set; }
    public AppRole Role { get; set; } = null!;

    public Guid PermissionId { get; set; }
    public AppPermission Permission { get; set; } = null!;
}
