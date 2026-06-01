using System;
using System.Linq;
using System.Threading.Tasks;
using CasePilot.Api.DTOs;
using CasePilot.Api.Models;
using CasePilot.Api.Services;
using CasePilot.Api.Storage;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace CasePilot.Tests.Services;

public class CaseDocumentServiceTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly CasePilotDbContext _context;
    private readonly LegalCaseRepository _repository;
    private readonly CaseDocumentService _sut;

    public CaseDocumentServiceTests()
    {
        _connection = new SqliteConnection("Filename=:memory:");
        _connection.Open();

        var options = new DbContextOptionsBuilder<CasePilotDbContext>()
            .UseSqlite(_connection)
            .Options;

        _context = new CasePilotDbContext(options);
        _context.Database.EnsureCreated();

        _repository = new LegalCaseRepository(_context);
        _sut = new CaseDocumentService(_repository, _context);
    }

    public void Dispose()
    {
        _context.Dispose();
        _connection.Dispose();
    }

    [Fact]
    public async Task GetByCaseId_ShouldReturnDocuments()
    {
        // Arrange
        var caseId = Guid.NewGuid();
        var lawyerUserId = Guid.Parse("b2222222-2222-2222-2222-222222222222");
        _context.LegalCases.Add(new LegalCase
        {
            Id = caseId,
            CreatedByUserId = lawyerUserId
        });

        _context.CaseDocuments.Add(new CaseDocument
        {
            Id = Guid.NewGuid(),
            LegalCaseId = caseId,
            Name = "Test Doc",
            Type = DocumentType.Cerere,
            UploadedAt = DateTime.UtcNow
        });
        _context.SaveChanges();

        // Act
        var result = await _sut.GetByCaseId(caseId);

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCount(1);
        result.First().Name.Should().Be("Test Doc");
    }
}
