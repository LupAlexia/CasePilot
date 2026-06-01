using CasePilot.Api.Services.Interfaces;
using System.Net.Http.Json;

namespace CasePilot.Api.Services;

/// <summary>
/// Sends transactional emails via the Brevo HTTP API (https://api.brevo.com).
///
/// Brevo is used instead of SMTP because hosts like Render block outbound SMTP
/// ports (25/465/587). The Brevo API runs over HTTPS (443), which is not blocked.
///
/// Configuration (appsettings.json / environment variables):
///   Brevo:ApiKey      — Brevo API key (Settings → SMTP & API → API Keys)
///   Email:Username    — Sender address (must be a VERIFIED sender in Brevo)
///   Email:FromAddress — Sender address (defaults to Email:Username)
///   Email:FromName    — Sender display name (default: CasePilot)
///
/// Brevo setup (free, 300 emails/day, any recipient):
///   1. Create an account at brevo.com
///   2. Senders → verify the sender email you'll send from
///   3. Settings → SMTP & API → API Keys → create a key, set it as Brevo:ApiKey
///
/// Leave Brevo:ApiKey empty → falls back to console log (local dev without email).
/// </summary>
public class ResendEmailService : IEmailService
{
    private static readonly HttpClient _http = new() { Timeout = TimeSpan.FromSeconds(30) };

    private readonly ILogger<ResendEmailService> _logger;
    private readonly string _apiKey;
    private readonly string _from;
    private readonly string _fromName;

    public ResendEmailService(IConfiguration configuration, ILogger<ResendEmailService> logger)
    {
        _logger   = logger;
        _apiKey   = configuration["Brevo:ApiKey"]   ?? string.Empty;
        _fromName = configuration["Email:FromName"] ?? "CasePilot";
        _from     = configuration["Email:FromAddress"]
                    ?? configuration["Email:Username"]
                    ?? string.Empty;
    }

    public async Task SendOtpAsync(string toEmail, string code)
    {
        if (string.IsNullOrWhiteSpace(_apiKey))
        {
            Console.WriteLine(
                "\n═══════════════════════════════════════════════════\n" +
                $"  📧  OTP CODE for {toEmail}: {code}\n" +
                "  (configure Brevo:ApiKey for real delivery)\n" +
                "═══════════════════════════════════════════════════\n");
            return;
        }

        var html = $"""
            <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px">
              <h2 style="color:#1a4b86">CasePilot — Verificare în doi pași</h2>
              <p>Codul tău de verificare este:</p>
              <div style="font-size:2.4rem;font-weight:800;letter-spacing:0.3em;text-align:center;
                          padding:20px;background:#eef2f8;border-radius:8px;color:#1a4b86">
                {code}
              </div>
              <p style="color:#666;font-size:0.9rem;margin-top:16px">
                Codul este valabil <strong>10 minute</strong>.<br>
                Dacă nu ai solicitat această autentificare, ignoră acest mesaj.
              </p>
            </div>
            """;

        await SendAsync(toEmail, "Cod de verificare CasePilot", html);
    }

    public async Task SendPasswordResetAsync(string toEmail, string resetLink)
    {
        if (string.IsNullOrWhiteSpace(_apiKey))
        {
            Console.WriteLine(
                "\n═══════════════════════════════════════════════════\n" +
                $"  📧  PASSWORD RESET for {toEmail}\n" +
                $"  🔗  Link: {resetLink}\n" +
                "  (configure Brevo:ApiKey for real delivery)\n" +
                "═══════════════════════════════════════════════════\n");
            return;
        }

        var html = $"""
            <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px">
              <h2 style="color:#1a4b86">CasePilot — Resetare parolă</h2>
              <p>Ai solicitat resetarea parolei. Apasă pe butonul de mai jos:</p>
              <div style="text-align:center;margin:28px 0">
                <a href="{resetLink}"
                   style="background:#1a4b86;color:#fff;padding:14px 32px;border-radius:6px;
                          text-decoration:none;font-weight:700;font-size:1rem;display:inline-block">
                  Resetează parola
                </a>
              </div>
              <p style="color:#666;font-size:0.85rem">
                Link-ul este valabil <strong>1 oră</strong>.<br>
                Dacă nu ai solicitat resetarea parolei, ignoră acest mesaj.
              </p>
              <hr style="border:none;border-top:1px solid #e0e0e0;margin:16px 0">
              <p style="color:#999;font-size:0.78rem;word-break:break-all">
                Sau copiază: {resetLink}
              </p>
            </div>
            """;

        await SendAsync(toEmail, "Resetare parolă CasePilot", html);
    }

    public async Task SendHearingReminderAsync(string toEmail, string caseNumber, string hearingTitle, DateTime hearingDate, string courtRoom, string caseId)
    {
        var dateStr = hearingDate.ToString("dd.MM.yyyy HH:mm");

        if (string.IsNullOrWhiteSpace(_apiKey))
        {
            Console.WriteLine(
                "\n═══════════════════════════════════════════════════\n" +
                $"  📧  HEARING REMINDER for {toEmail}\n" +
                $"  Dosar: {caseNumber} | {hearingTitle}\n" +
                $"  Data: {dateStr} | Sală: {courtRoom}\n" +
                "═══════════════════════════════════════════════════\n");
            return;
        }

        var html = $"""
            <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px">
              <h2 style="color:#1a4b86">CasePilot — Reminder termen de judecată</h2>
              <p>Aveți un termen programat <strong>mâine</strong>:</p>
              <table style="width:100%;border-collapse:collapse;margin:16px 0">
                <tr><td style="padding:8px 0;color:#555;width:140px">Dosar</td>
                    <td style="padding:8px 0;font-weight:700">{caseNumber}</td></tr>
                <tr style="background:#f5f7fb"><td style="padding:8px;color:#555">Titlu</td>
                    <td style="padding:8px;font-weight:700">{hearingTitle}</td></tr>
                <tr><td style="padding:8px 0;color:#555">Data și ora</td>
                    <td style="padding:8px 0;font-weight:700;color:#b5852d">{dateStr}</td></tr>
                <tr style="background:#f5f7fb"><td style="padding:8px;color:#555">Sală</td>
                    <td style="padding:8px">{courtRoom}</td></tr>
              </table>
              <p style="color:#666;font-size:0.9rem">
                Acest reminder a fost trimis automat de CasePilot deoarece ați activat opțiunea
                <em>Reminder termene</em> din profilul dumneavoastră.
              </p>
            </div>
            """;

        await SendAsync(toEmail, $"[CasePilot] Reminder termen mâine — Dosar {caseNumber}", html);
    }

    private async Task SendAsync(string to, string subject, string htmlBody)
    {
        try
        {
            var payload = new
            {
                sender      = new { name = _fromName, email = _from },
                to          = new[] { new { email = to } },
                subject,
                htmlContent = htmlBody
            };

            using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.brevo.com/v3/smtp/email");
            request.Headers.Add("api-key", _apiKey);
            request.Headers.Add("accept", "application/json");
            request.Content = JsonContent.Create(payload);

            using var response = await _http.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync();
                _logger.LogError("Brevo rejected email to {Email}: {Status} {Body}",
                    to, (int)response.StatusCode, body);
            }
        }
        catch (Exception ex)
        {
            // Email failure never crashes the auth flow
            _logger.LogError(ex, "Failed to send email to {Email} via Brevo", to);
        }
    }
}
