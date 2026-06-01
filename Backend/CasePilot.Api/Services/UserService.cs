using CasePilot.Api.DTOs.Responses;
using CasePilot.Api.Services.Interfaces;
using CasePilot.Api.Storage;
using Microsoft.EntityFrameworkCore;

namespace CasePilot.Api.Services;

public class UserService : IUserService
{
    private readonly CasePilotDbContext _context;

    public UserService(CasePilotDbContext context)
    {
        _context = context;
    }

    public List<UserResponse> GetAll()
    {
        return _context.Users
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new UserResponse
            {
                Id = u.Id,
                Email = u.Email,
                FullName = u.FullName,
                IsActive = u.IsActive,
                CreatedAt = u.CreatedAt,
                Roles = u.UserRoles.Select(ur => ur.Role.Name).ToList()
            })
            .ToList();
    }

    public UserResponse? GetById(Guid id)
    {
        var user = _context.Users
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .FirstOrDefault(u => u.Id == id);

        if (user is null) return null;

        return new UserResponse
        {
            Id = user.Id,
            Email = user.Email,
            FullName = user.FullName,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt,
            Roles = user.UserRoles.Select(ur => ur.Role.Name).ToList()
        };
    }

    public bool Deactivate(Guid id)
    {
        var user = _context.Users.Find(id);
        if (user is null) return false;

        user.IsActive = false;
        _context.SaveChanges();
        return true;
    }

    public bool Activate(Guid id)
    {
        var user = _context.Users.Find(id);
        if (user is null) return false;

        user.IsActive = true;
        _context.SaveChanges();
        return true;
    }
}
