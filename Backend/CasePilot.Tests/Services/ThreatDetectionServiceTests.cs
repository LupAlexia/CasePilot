using System;
using System.Linq;
using CasePilot.Api.Models;
using CasePilot.Api.Services;
using CasePilot.Api.Storage;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace CasePilot.Tests.Services;

public class ThreatDetectionServiceTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly CasePilotDbContext _context;
    private readonly ThreatDetectionService _sut;

    public ThreatDetectionServiceTests()
    {
        _connection = new SqliteConnection("Filename=:memory:");
        _connection.Open();

        var options = new DbContextOptionsBuilder<CasePilotDbContext>()
            .UseSqlite(_connection)
            .Options;

        _context = new CasePilotDbContext(options);
        _context.Database.EnsureCreated();

        _sut = new ThreatDetectionService(_context);
    }

    public void Dispose()
    {
        _context.Dispose();
        _connection.Dispose();
    }

    [Fact]
    public void Analyze_ShouldFlagUser_WhenBruteForceDetected()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var now = DateTime.UtcNow;

        _context.Users.Add(new AppUser { Id = userId, Email = "test@test.com", FullName = "Test User" });

        // Add 5 failed logins within 10 minutes
        for (int i = 0; i < 5; i++)
        {
            _context.AuditLogs.Add(new AuditLog
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Action = "LOGIN_FAILED",
                Timestamp = now.AddMinutes(-i),
                IpAddress = "127.0.0.1"
            });
        }
        _context.SaveChanges();

        // Act
        _sut.Analyze(userId);

        // Assert — at least one brute-force flag must exist with the expected severity.
        // (The off-hours rule may also fire depending on UTC time, so we filter by score
        // rather than asserting exactly one record in total.)
        var suspiciousUsers = _context.SuspiciousUsers.Where(su => su.UserId == userId).ToList();
        suspiciousUsers.Should().NotBeEmpty();
        suspiciousUsers.Should().Contain(su => su.SeverityScore == 80);
    }
}
