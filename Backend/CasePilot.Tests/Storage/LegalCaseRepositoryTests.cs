using CasePilot.Api.Models;
using CasePilot.Api.Storage;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using Xunit;

namespace CasePilot.Tests.Storage;

public class LegalCaseRepositoryTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly CasePilotDbContext _context;
    private readonly LegalCaseRepository _sut;
    // This matches the seeded lawyer user in CasePilotDbContext
    private readonly Guid _lawyerUserId = Guid.Parse("b2222222-2222-2222-2222-222222222222");

    public LegalCaseRepositoryTests()
    {
        _connection = new SqliteConnection("Filename=:memory:");
        _connection.Open();

        var options = new DbContextOptionsBuilder<CasePilotDbContext>()
            .UseSqlite(_connection)
            .Options;

        _context = new CasePilotDbContext(options);
        _context.Database.EnsureCreated();

        _sut = new LegalCaseRepository(_context);
    }

    public void Dispose()
    {
        _context.Dispose();
        _connection.Dispose();
    }

    [Fact]
    public void Add_ShouldAddLegalCaseToDatabase()
    {
        // Arrange
        var legalCase = new LegalCase
        {
            Id = Guid.NewGuid(),
            Number = "123/2026",
            RegistrationDate = DateTime.UtcNow,
            Court = "Test Court",
            Object = "Test Object",
            Reclamant = "Test Reclamant",
            Parat = "Test Parat",
            Stage = CaseStage.Fond,
            Status = CaseStatus.Activ,
            CreatedByUserId = _lawyerUserId
        };

        // Act
        _sut.Add(legalCase);

        // Assert
        var result = _context.LegalCases.Find(legalCase.Id);
        result.Should().NotBeNull();
        result!.Number.Should().Be("123/2026");
    }

    [Fact]
    public void GetById_ShouldReturnLegalCase_WhenItExists()
    {
        // Arrange
        var legalCase = new LegalCase
        {
            Id = Guid.NewGuid(),
            Number = "456/2026",
            CreatedByUserId = _lawyerUserId
        };
        _context.LegalCases.Add(legalCase);
        _context.SaveChanges();

        // Act
        var result = _sut.GetById(legalCase.Id);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(legalCase.Id);
    }

    [Fact]
    public void GetAll_ShouldReturnAllCases()
    {
        // Arrange
        var initialCount = _context.LegalCases.Count();
        _context.LegalCases.Add(new LegalCase { Id = Guid.NewGuid(), Number = "1", CreatedByUserId = _lawyerUserId });
        _context.LegalCases.Add(new LegalCase { Id = Guid.NewGuid(), Number = "2", CreatedByUserId = _lawyerUserId });
        _context.SaveChanges();

        // Act
        var result = _sut.GetAll().ToList();

        // Assert
        result.Should().HaveCount(initialCount + 2);
    }

    [Fact]
    public void Update_ShouldModifyExistingCase()
    {
        // Arrange
        var legalCase = new LegalCase { Id = Guid.NewGuid(), Number = "Old", CreatedByUserId = _lawyerUserId };
        _context.LegalCases.Add(legalCase);
        _context.SaveChanges();

        // Act
        legalCase.Number = "New";
        _sut.Update(legalCase);

        // Assert
        var result = _context.LegalCases.Find(legalCase.Id);
        result!.Number.Should().Be("New");
    }

    [Fact]
    public void Delete_ShouldRemoveCase_AndReturnTrue()
    {
        // Arrange
        var id = Guid.NewGuid();
        _context.LegalCases.Add(new LegalCase { Id = id, Number = "ToDelete", CreatedByUserId = _lawyerUserId });
        _context.SaveChanges();

        // Act
        var result = _sut.Delete(id);

        // Assert
        result.Should().BeTrue();
        _context.LegalCases.Find(id).Should().BeNull();
    }
}