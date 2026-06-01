using CasePilot.Api.Models;
using CasePilot.Api.Services;
using CasePilot.Api.Storage;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using Xunit;

namespace CasePilot.Tests.Services;

public class StatisticsServiceTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly CasePilotDbContext _context;
    private readonly LegalCaseRepository _repository;
    private readonly Guid _lawyerUserId = Guid.Parse("b2222222-2222-2222-2222-222222222222");

    public StatisticsServiceTests()
    {
        _connection = new SqliteConnection("Filename=:memory:");
        _connection.Open();

        var options = new DbContextOptionsBuilder<CasePilotDbContext>()
            .UseSqlite(_connection)
            .Options;

        _context = new CasePilotDbContext(options);
        _context.Database.EnsureCreated();

        _repository = new LegalCaseRepository(_context);
    }

    public void Dispose()
    {
        _context.Dispose();
        _connection.Dispose();
    }

    [Fact]
    public void GetCaseStatistics_ShouldReturnCorrectCounts()
    {
        _context.LegalCases.RemoveRange(_context.LegalCases);
        _context.SaveChanges();

        _repository.Add(new LegalCase
        {
            Id = Guid.NewGuid(),
            Number = "100/2026",
            RegistrationDate = DateTime.Today,
            Court = "Judecătoria Cluj-Napoca",
            Object = "Obiect 1",
            Reclamant = "Ion",
            Parat = "SC A",
            Stage = CaseStage.Fond,
            Status = CaseStatus.Activ,
            CreatedByUserId = _lawyerUserId,
            Hearings = new List<HearingTerm>
            {
                new()
                {
                    Id = Guid.NewGuid(),
                    Title = "Termen 1",
                    Date = DateTime.Now.AddDays(5),
                    CourtRoom = "Sala 1",
                    Note = "Notă"
                }
            }
        });

        _repository.Add(new LegalCase
        {
            Id = Guid.NewGuid(),
            Number = "101/2026",
            RegistrationDate = DateTime.Today,
            Court = "Judecătoria Cluj-Napoca",
            Object = "Obiect 2",
            Reclamant = "Maria",
            Parat = "SC B",
            Stage = CaseStage.Apel,
            Status = CaseStatus.Finalizat,
            CreatedByUserId = _lawyerUserId,
            Hearings = new List<HearingTerm>()
        });

        var service = new StatisticsService(_repository);

        var result = service.GetCaseStatistics(_lawyerUserId);

        result.Should().NotBeNull();
        result.TotalCases.Should().Be(2);
        result.ActiveCases.Should().Be(1);
        result.FinalizedCases.Should().Be(1);
        result.CasesWithUpcomingHearings.Should().Be(1);
        result.CasesPerCourt.Should().ContainKey("Judecătoria Cluj-Napoca");
    }
}