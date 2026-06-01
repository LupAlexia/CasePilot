using CasePilot.Api.Storage;
using Microsoft.EntityFrameworkCore;

namespace CasePilot.Api.Services;

public class ActivityCleanupService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<ActivityCleanupService> _logger;
    private readonly TimeSpan _checkInterval = TimeSpan.FromHours(24);
    private readonly TimeSpan _retentionPeriod = TimeSpan.FromDays(7);

    public ActivityCleanupService(IServiceProvider serviceProvider, ILogger<ActivityCleanupService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CleanupOldActivities(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Eroare la stergerea activitatilor vechi.");
            }

            await Task.Delay(_checkInterval, stoppingToken);
        }
    }

    private async Task CleanupOldActivities(CancellationToken stoppingToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<CasePilotDbContext>();

        var cutoffDate = DateTime.UtcNow.Subtract(_retentionPeriod);

        var oldActivities = await context.DocumentActivities
            .Where(a => a.Date < cutoffDate)
            .ToListAsync(stoppingToken);

        if (oldActivities.Any())
        {
            context.DocumentActivities.RemoveRange(oldActivities);
            await context.SaveChangesAsync(stoppingToken);
            _logger.LogInformation($"Am sters {oldActivities.Count} activitati mai vechi de 7 zile.");
        }
    }
}
