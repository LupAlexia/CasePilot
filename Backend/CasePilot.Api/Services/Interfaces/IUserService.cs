using CasePilot.Api.DTOs.Responses;

namespace CasePilot.Api.Services.Interfaces;

public interface IUserService
{
    List<UserResponse> GetAll();
    UserResponse? GetById(Guid id);
    bool Deactivate(Guid id);
    bool Activate(Guid id);
}
