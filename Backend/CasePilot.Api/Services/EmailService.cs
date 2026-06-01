using CasePilot.Api.Services.Interfaces;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace CasePilot.Api.Services;

/// <summary>
/// Sends transactional emails via SMTP (works with Gmail, Outlook, etc.).
///
/// Configuration (appsettings.json / environment variables):
///   Email:Host        — SMTP server (default: smtp.gmail.com)
///   Email:Port        — SMTP port (default: 587)
///   Email:Username    — SMTP login / sender address
///   Email:Password    — SMTP password or Gmail App Password
///   Email:FromAddress — Sender address (defaults to Username)
///   Email:FromName    — Sender display name (default: CasePilot)
///
/// Gmail setup (free, 500 emails/day, any recipient):
///   1. Enable 2-Step Verification on your Google account
///   2. Go to account.google.com → Security → App Passwords
///   3. Create an app password for "Mail" and paste it as Email:Password
///
/// Leave Email:Username empty → falls back to console log (local dev without email).
/// </summary>
public class ResendEmailService : IEmailService
{
    private readonly ILogger<ResendEmailService> _logger;
    private readonly string _host;
    private readonly int _port;
    private readonly string _username;
    private readonly string _password;
    private readonly string _from;
    private readonly string _fromName;

    public ResendEmailService(IConfiguration configuration, ILogger<ResendEmailService> logger)
    {
        _logger   = logger;
        _host     = configuration["Email:Host"]     ?? "smtp.gmail.com";
        _port     = int.TryParse(configuration["Email:Port"], out var p) ? p : 587;
        _username = configuration["Email:Username"] ?? string.Empty;
        _password = configuration["Email:Password"] ?? string.Empty;
        _fromName = configuration["Email:FromName"] ?? "CasePilot";
        _from     = configuration["Email:FromAddress"] ?? _username;
    }

    public async Task SendOtpAsync(string toEmail, string code)
    {
        if (string.IsNullOrWhiteSpace(_username))
        {
            Console.WriteLine(
                "\n═══════════════════════════════════════════════════\n" +
                $"  📧  OTP CODE for {toEmail}: {code}\n" +
                "  (configure Email:Username + Email:Password for real delivery)\n" +
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
        if (string.IsNullOrWhiteSpace(_username))
        {
            Console.WriteLine(
                "\n═══════════════════════════════════════════════════\n" +
                $"  📧  PASSWORD RESET for {toEmail}\n" +
                $"  🔗  Link: {resetLink}\n" +
                "  (configure Email:Username + Email:Password for real delivery)\n" +
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

        if (string.IsNullOrWhiteSpace(_username))
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
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(_fromName, _from));
            message.To.Add(new MailboxAddress(string.Empty, to));
            message.Subject = subject;
            message.Body = new TextPart("html") { Text = htmlBody };

            using var client = new SmtpClient();
            await client.ConnectAsync(_host, _port, SecureSocketOptions.StartTls);
            await client.AuthenticateAsync(_username, _password);
            await client.SendAsync(message);
            await client.DisconnectAsync(quit: true);
        }
        catch (Exception ex)
        {
            // Email failure never crashes the auth flow
            _logger.LogError(ex, "Failed to send email to {Email} via {Host}:{Port}", to, _host, _port);
        }
    }
}
