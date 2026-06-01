using CasePilot.Api.DTOs.Requests;
using CasePilot.Api.Models;
using CasePilot.Api.Services;
using CasePilot.Api.Storage;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using Xunit;

namespace CasePilot.Tests.Services;

public class LegalCaseServiceTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly CasePilotDbContext _context;
    private readonly LegalCaseRepository _repository;
    private readonly LegalCaseService _service;
    private readonly Guid _lawyerUserId = Guid.Parse("b2222222-2222-2222-2222-222222222222");

    public LegalCaseServiceTests()
    {
        _connection = new SqliteConnection("Filename=:memory:");
        _connection.Open();

        var options = new DbContextOptionsBuilder<CasePilotDbContext>()
            .UseSqlite(_connection)
            .Options;

        _context = new CasePilotDbContext(options);
        _context.Database.EnsureCreated();

        _repository = new LegalCaseRepository(_context);
        _service = new LegalCaseService(_repository);
        
        SeedData();
    }
    
    private void SeedData()
    {
        _context.LegalCases.Add(new LegalCase
        {
            Id = Guid.NewGuid(),
            Number = "001/2026",
            RegistrationDate = DateTime.UtcNow,
            Court = "Test Court",
            Object = "Test",
            Reclamant = "Test",
            Parat = "Test",
            Stage = CaseStage.Fond,
            Status = CaseStatus.Activ,
            CreatedByUserId = _lawyerUserId
        });
        _context.SaveChanges();
    }

    public void Dispose()
    {
        _context.Dispose();
        _connection.Dispose();
    }

    [Fact]
    public void GetAll_ShouldReturnPagedCases()
    {
        var result = _service.GetAll(_lawyerUserId, 1, 10);

        result.Should().NotBeNull();
        result.Items.Should().NotBeNull();
        result.Page.Should().Be(1);
        result.PageSize.Should().Be(10);
        result.TotalCount.Should().BeGreaterThan(0);
    }

    [Fact]
    public void GetAll_ShouldOnlyReturnCasesForUser()
    {
        var otherUserId = Guid.NewGuid();

        var result = _service.GetAll(otherUserId, 1, 10);

        result.TotalCount.Should().Be(0);
    }

    [Fact]
    public void GetById_ShouldReturnCase_WhenCaseExists()
    {
        var existingCase = _repository.GetAll().First(c => c.CreatedByUserId == _lawyerUserId);

        var result = _service.GetById(_lawyerUserId, existingCase.Id);

        result.Should().NotBeNull();
        result!.Id.Should().Be(existingCase.Id);
        result.Number.Should().Be(existingCase.Number);
    }

    [Fact]
    public void GetById_ShouldReturnNull_WhenCaseDoesNotExist()
    {
        var result = _service.GetById(_lawyerUserId, Guid.NewGuid());

        result.Should().BeNull();
    }

    [Fact]
    public void GetById_ShouldReturnNull_WhenCaseBelongsToOtherUser()
    {
        var existingCase = _repository.GetAll().First();
        var otherUserId = Guid.NewGuid();

        var result = _service.GetById(otherUserId, existingCase.Id);

        result.Should().BeNull();
    }

    [Fact]
    public void Create_ShouldAddCaseAndReturnCreatedCase()
    {
        var request = new CreateLegalCaseRequest
        {
            Number = "999/2026",
            RegistrationDate = new DateTime(2026, 4, 10),
            Court = "Curtea de Apel Cluj",
            Object = "Contestație la executare",
            Reclamant = "Ana Pop",
            Parat = "SC Test SRL",
            Stage = CaseStage.Fond,
            Status = CaseStatus.Activ
        };

        var result = _service.Create(_lawyerUserId, request);

        result.Should().NotBeNull();
        result.Id.Should().NotBeEmpty();
        result.Number.Should().Be(request.Number);
        result.Court.Should().Be(request.Court);

        var fromStore = _service.GetById(_lawyerUserId, result.Id);
        fromStore.Should().NotBeNull();
        fromStore!.Number.Should().Be("999/2026");
    }

    [Fact]
    public void Update_ShouldReturnUpdatedCase_WhenCaseExists()
    {
        var existingCase = _repository.GetAll().First(c => c.CreatedByUserId == _lawyerUserId);

        var request = new UpdateLegalCaseRequest
        {
            Number = "777/2026",
            RegistrationDate = new DateTime(2026, 3, 20),
            Court = "Tribunalul Cluj",
            Object = "Pretenții actualizate",
            Reclamant = "Reclamant actualizat",
            Parat = "Pârât actualizat",
            Stage = CaseStage.Apel,
            Status = CaseStatus.Finalizat
        };

        var result = _service.Update(_lawyerUserId, existingCase.Id, request);

        result.Should().NotBeNull();
        result!.Number.Should().Be("777/2026");
        result.Court.Should().Be("Tribunalul Cluj");
        result.Stage.Should().Be(CaseStage.Apel);
        result.Status.Should().Be(CaseStatus.Finalizat);
    }

    [Fact]
    public void Update_ShouldReturnNull_WhenCaseDoesNotExist()
    {
        var request = new UpdateLegalCaseRequest
        {
            Number = "777/2026",
            RegistrationDate = new DateTime(2026, 3, 20),
            Court = "Tribunalul Cluj",
            Object = "Pretenții actualizate",
            Reclamant = "Reclamant actualizat",
            Parat = "Pârât actualizat",
            Stage = CaseStage.Apel,
            Status = CaseStatus.Finalizat
        };

        var result = _service.Update(_lawyerUserId, Guid.NewGuid(), request);

        result.Should().BeNull();
    }

    [Fact]
    public void Delete_ShouldReturnTrue_WhenCaseExists()
    {
        var existingCase = _repository.GetAll().First(c => c.CreatedByUserId == _lawyerUserId);

        var result = _service.Delete(_lawyerUserId, existingCase.Id);

        result.Should().BeTrue();
        _service.GetById(_lawyerUserId, existingCase.Id).Should().BeNull();
    }

    [Fact]
    public void Delete_ShouldReturnFalse_WhenCaseDoesNotExist()
    {
        var result = _service.Delete(_lawyerUserId, Guid.NewGuid());

        result.Should().BeFalse();
    }

    [Fact]
    public void GetAll_ShouldRespectPagination()
    {
        for (int i = 0; i < 15; i++)
        {
            _service.Create(_lawyerUserId, new CreateLegalCaseRequest
            {
                Number = $"{1000 + i}/2026",
                RegistrationDate = new DateTime(2026, 1, 1).AddDays(i),
                Court = "Judecătoria Iași",
                Object = "Obiect test",
                Reclamant = "Test Reclamant",
                Parat = "Test Pârât",
                Stage = CaseStage.Fond,
                Status = CaseStatus.Activ
            });
        }

        var result = _service.GetAll(_lawyerUserId, 2, 5);

        result.Page.Should().Be(2);
        result.PageSize.Should().Be(5);
        result.Items.Should().HaveCount(5);
        result.TotalPages.Should().BeGreaterThanOrEqualTo(2);
    }
}