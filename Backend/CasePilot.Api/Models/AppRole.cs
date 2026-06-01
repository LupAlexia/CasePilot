namespace CasePilot.Api.Models;

public class AppRole
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;

    public List<AppUserRole> UserRoles { get; set; } = new();
    public List<AppRolePermission> RolePermissions { get; set; } = new();
}
