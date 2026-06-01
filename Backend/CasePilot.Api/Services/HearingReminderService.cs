using CasePilot.Api.Services.Interfaces;
using CasePilot.Api.Storage;
using Microsoft.EntityFrameworkCore;

namespace CasePilot.Api.Services;

public class HearingReminderService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<HearingReminderService> _logger;
    private readonly HashSet<Guid> _sentToday = new();

    public HearingReminderService(IServiceProvider serviceProvider, ILogger<HearingReminderService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            var now = TimeZoneHelper.NowRomanian();

            // Reset sent-today set at midnight
            if (now.Hour == 0 && now.Minute < 5)
                _sentToday.Clear();

            // Send reminders in the 07:00–07:05 window each day
            if (now.Hour == 7 && now.Minute < 5)
            {
                try { await SendRemindersAsync(stoppingToken); }
                catch (Exception ex) { _logger.LogError(ex, "Eroare la trimiterea reminder-elor de termene."); }
            }

            // Wake up every 5 minutes to check the time window
            await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
        }
    }

    private async Task SendRemindersAsync(CancellationToken stoppingToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<CasePilotDbContext>();
        var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();

        var tomorrow = TimeZoneHelper.NowRomanian().Date.AddDays(1);

        var hearings = await context.HearingTerms
            .Include(h => h.LegalCase)
                .ThenInclude(c => c.CreatedByUser)
            .Where(h => h.Date.Date == tomorrow)
            .ToListAsync(stoppingToken);

        foreach (var hearing in hearings)
        {
            if (_sentToday.Contains(hearing.Id)) continue;

            if (hearing.LegalCase is null) continue;
            var user = hearing.LegalCase.CreatedByUser;
            if (user is null || !user.HearingNotificationsEnabled) continue;

            _sentToday.Add(hearing.Id);

            var legalCase = hearing.LegalCase;
            _ = emailService.SendHearingReminderAsync(
                user.Email,
                legalCase.Number,
                hearing.Title,
                hearing.Date,
                hearing.CourtRoom,
                hearing.LegalCaseId.ToString());

            _logger.LogInformation(
                "Reminder trimis la {Email} pentru termenul {HearingId} din dosarul {Case}",
                user.Email, hearing.Id, legalCase.Number);
        }
    }
}
