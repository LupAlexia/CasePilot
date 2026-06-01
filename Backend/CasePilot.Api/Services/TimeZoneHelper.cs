namespace CasePilot.Api.Services;

/// <summary>
/// Cross-platform helper for Romanian timezone conversion.
/// Tries IANA "Europe/Bucharest" (Linux/macOS) then Windows "GTB Standard Time",
/// then falls back to UTC so the app never crashes on any host.
/// </summary>
public static class TimeZoneHelper
{
    private static readonly TimeZoneInfo Romanian = ResolveRomanian();

    private static TimeZoneInfo ResolveRomanian()
    {
        foreach (var id in new[] { "Europe/Bucharest", "GTB Standard Time" })
        {
            try { return TimeZoneInfo.FindSystemTimeZoneById(id); }
            catch { /* try next */ }
        }
        return TimeZoneInfo.Utc;
    }

    public static DateTime ToRomanian(DateTime utcDateTime)
        => TimeZoneInfo.ConvertTimeFromUtc(utcDateTime, Romanian);

    public static DateTime NowRomanian()
        => TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, Romanian);
}
