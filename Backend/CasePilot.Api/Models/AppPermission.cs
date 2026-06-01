namespace CasePilot.Api.Models;

public class AppPermission
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;

    public List<AppRolePermission> RolePermissions { get; set; } = new();
}
