using CasePilot.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CasePilot.Api.Storage;

public class CasePilotDbContext : DbContext
{
    public CasePilotDbContext(DbContextOptions<CasePilotDbContext> options)
        : base(options)
    {
    }

    // Existing domain tables
    public DbSet<LegalCase> LegalCases { get; set; } = null!;
    public DbSet<CaseDocument> CaseDocuments { get; set; } = null!;
    public DbSet<HearingTerm> HearingTerms { get; set; } = null!;
    public DbSet<DocumentActivity> DocumentActivities { get; set; } = null!;

    // Auth tables
    public DbSet<AppUser> Users { get; set; } = null!;
    public DbSet<AppRole> Roles { get; set; } = null!;
    public DbSet<AppPermission> Permissions { get; set; } = null!;
    public DbSet<AppUserRole> UserRoles { get; set; } = null!;
    public DbSet<AppRolePermission> RolePermissions { get; set; } = null!;

    // Logging & security tables
    public DbSet<AuditLog> AuditLogs { get; set; } = null!;
    public DbSet<SuspiciousUser> SuspiciousUsers { get; set; } = null!;

    // Token tables
    public DbSet<RefreshToken> RefreshTokens { get; set; } = null!;

    // 3-way auth & password recovery tables
    public DbSet<EmailVerificationCode> EmailVerificationCodes { get; set; } = null!;
    public DbSet<PasswordResetToken> PasswordResetTokens { get; set; } = null!;

    // Session management
    public DbSet<UserSession> UserSessions { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ── Existing relationships ──────────────────────────────
        modelBuilder.Entity<LegalCase>()
            .HasMany(c => c.Documents)
            .WithOne(d => d.LegalCase)
            .HasForeignKey(d => d.LegalCaseId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<LegalCase>()
            .HasMany(c => c.Hearings)
            .WithOne(h => h.LegalCase)
            .HasForeignKey(h => h.LegalCaseId)
            .OnDelete(DeleteBehavior.Cascade);

        // ── LegalCase ownership ─────────────────────────────────
        modelBuilder.Entity<LegalCase>()
            .HasOne(c => c.CreatedByUser)
            .WithMany()
            .HasForeignKey(c => c.CreatedByUserId)
            .OnDelete(DeleteBehavior.Cascade);

        // ── AppUser ─────────────────────────────────────────────
        modelBuilder.Entity<AppUser>()
            .HasIndex(u => u.Email)
            .IsUnique();

        // ── AppRole ─────────────────────────────────────────────
        modelBuilder.Entity<AppRole>()
            .HasIndex(r => r.Name)
            .IsUnique();

        // ── AppPermission ───────────────────────────────────────
        modelBuilder.Entity<AppPermission>()
            .HasIndex(p => p.Name)
            .IsUnique();

        // ── AppUserRole (M:N join table with composite PK) ─────
        modelBuilder.Entity<AppUserRole>()
            .HasKey(ur => new { ur.UserId, ur.RoleId });

        modelBuilder.Entity<AppUserRole>()
            .HasOne(ur => ur.User)
            .WithMany(u => u.UserRoles)
            .HasForeignKey(ur => ur.UserId);

        modelBuilder.Entity<AppUserRole>()
            .HasOne(ur => ur.Role)
            .WithMany(r => r.UserRoles)
            .HasForeignKey(ur => ur.RoleId);

        // ── AppRolePermission (M:N join table with composite PK)
        modelBuilder.Entity<AppRolePermission>()
            .HasKey(rp => new { rp.RoleId, rp.PermissionId });

        modelBuilder.Entity<AppRolePermission>()
            .HasOne(rp => rp.Role)
            .WithMany(r => r.RolePermissions)
            .HasForeignKey(rp => rp.RoleId);

        modelBuilder.Entity<AppRolePermission>()
            .HasOne(rp => rp.Permission)
            .WithMany(p => p.RolePermissions)
            .HasForeignKey(rp => rp.PermissionId);

        // ── AuditLog ────────────────────────────────────────────
        modelBuilder.Entity<AuditLog>()
            .HasOne(a => a.User)
            .WithMany()
            .HasForeignKey(a => a.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<AuditLog>()
            .HasIndex(a => a.Timestamp);

        // ── SuspiciousUser ──────────────────────────────────────
        modelBuilder.Entity<SuspiciousUser>()
            .HasOne(s => s.User)
            .WithMany()
            .HasForeignKey(s => s.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // ── RefreshToken ───────────────────────────────────────
        modelBuilder.Entity<RefreshToken>()
            .HasOne(rt => rt.User)
            .WithMany(u => u.RefreshTokens)
            .HasForeignKey(rt => rt.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<RefreshToken>()
            .HasIndex(rt => rt.Token)
            .IsUnique();

        // ── EmailVerificationCode ──────────────────────────────
        modelBuilder.Entity<EmailVerificationCode>()
            .HasOne(e => e.User)
            .WithMany(u => u.VerificationCodes)
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<EmailVerificationCode>()
            .HasIndex(e => e.VerificationToken)
            .IsUnique();

        // ── PasswordResetToken ─────────────────────────────────
        modelBuilder.Entity<PasswordResetToken>()
            .HasOne(p => p.User)
            .WithMany(u => u.PasswordResetTokens)
            .HasForeignKey(p => p.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<PasswordResetToken>()
            .HasIndex(p => p.Token)
            .IsUnique();

        // ── UserSession ────────────────────────────────────────
        modelBuilder.Entity<UserSession>()
            .HasOne(s => s.User)
            .WithMany(u => u.Sessions)
            .HasForeignKey(s => s.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<UserSession>()
            .HasIndex(s => s.UserId);

        // ── Seed Data ───────────────────────────────────────────
        SeedAuthData(modelBuilder);
    }

    private static void SeedAuthData(ModelBuilder modelBuilder)
    {
        // Fixed GUIDs for deterministic seeding
        var adminRoleId = Guid.Parse("a1111111-1111-1111-1111-111111111111");
        var userRoleId  = Guid.Parse("a2222222-2222-2222-2222-222222222222");

        var adminUserId = Guid.Parse("b1111111-1111-1111-1111-111111111111");
        var lawyerUserId = Guid.Parse("b2222222-2222-2222-2222-222222222222");

        // Permissions
        var permCasesView   = Guid.Parse("c0000000-0000-0000-0000-000000000001");
        var permCasesCreate = Guid.Parse("c0000000-0000-0000-0000-000000000002");
        var permCasesEdit   = Guid.Parse("c0000000-0000-0000-0000-000000000003");
        var permCasesDelete = Guid.Parse("c0000000-0000-0000-0000-000000000004");
        var permDocsView    = Guid.Parse("c0000000-0000-0000-0000-000000000005");
        var permDocsCreate  = Guid.Parse("c0000000-0000-0000-0000-000000000006");
        var permDocsEdit    = Guid.Parse("c0000000-0000-0000-0000-000000000007");
        var permDocsDelete  = Guid.Parse("c0000000-0000-0000-0000-000000000008");
        var permStatsView   = Guid.Parse("c0000000-0000-0000-0000-000000000009");
        var permUsersManage = Guid.Parse("c0000000-0000-0000-0000-000000000010");
        var permAuditView   = Guid.Parse("c0000000-0000-0000-0000-000000000011");
        var permSimulator   = Guid.Parse("c0000000-0000-0000-0000-000000000012");

        // Seed Roles
        modelBuilder.Entity<AppRole>().HasData(
            new AppRole { Id = adminRoleId, Name = "Admin" },
            new AppRole { Id = userRoleId,  Name = "User" }
        );

        // Seed Permissions
        modelBuilder.Entity<AppPermission>().HasData(
            new AppPermission { Id = permCasesView,   Name = "cases.view" },
            new AppPermission { Id = permCasesCreate,  Name = "cases.create" },
            new AppPermission { Id = permCasesEdit,    Name = "cases.edit" },
            new AppPermission { Id = permCasesDelete,  Name = "cases.delete" },
            new AppPermission { Id = permDocsView,     Name = "docs.view" },
            new AppPermission { Id = permDocsCreate,   Name = "docs.create" },
            new AppPermission { Id = permDocsEdit,     Name = "docs.edit" },
            new AppPermission { Id = permDocsDelete,   Name = "docs.delete" },
            new AppPermission { Id = permStatsView,    Name = "stats.view" },
            new AppPermission { Id = permUsersManage,  Name = "users.manage" },
            new AppPermission { Id = permAuditView,    Name = "audit.view" },
            new AppPermission { Id = permSimulator,    Name = "simulator.control" }
        );

        // Admin gets ALL permissions
        var allPermIds = new[] {
            permCasesView, permCasesCreate, permCasesEdit, permCasesDelete,
            permDocsView, permDocsCreate, permDocsEdit, permDocsDelete,
            permStatsView, permUsersManage, permAuditView, permSimulator
        };

        var adminRolePermissions = allPermIds.Select(pid => new AppRolePermission
        {
            RoleId = adminRoleId,
            PermissionId = pid
        }).ToArray();

        // User (Lawyer) gets case + doc + stats permissions only
        var userPermIds = new[] {
            permCasesView, permCasesCreate, permCasesEdit, permCasesDelete,
            permDocsView, permDocsCreate, permDocsEdit, permDocsDelete,
            permStatsView
        };

        var userRolePermissions = userPermIds.Select(pid => new AppRolePermission
        {
            RoleId = userRoleId,
            PermissionId = pid
        }).ToArray();

        modelBuilder.Entity<AppRolePermission>().HasData(
            adminRolePermissions.Concat(userRolePermissions).ToArray()
        );

        // Seed Users
        // PasswordHash left empty — the login fallback will match against the plain-text
        // Password field and auto-upgrade to BCrypt hash on first successful login.
        modelBuilder.Entity<AppUser>().HasData(
            new AppUser
            {
                Id = adminUserId,
                Email = "alexiacarina46@gmail.com",
                Password = "admin123",
                PasswordHash = string.Empty,
                FullName = "Administrator",
                CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                IsActive = true
            },
            new AppUser
            {
                Id = lawyerUserId,
                Email = "avocat@casepilot.com",
                Password = "avocat123",
                PasswordHash = string.Empty,
                FullName = "Ion Popescu",
                CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                IsActive = true
            }
        );

        // Assign roles to users
        modelBuilder.Entity<AppUserRole>().HasData(
            new AppUserRole { UserId = adminUserId,  RoleId = adminRoleId },
            new AppUserRole { UserId = lawyerUserId, RoleId = userRoleId }
        );

        // ── Seed Legal Cases and Documents for Lawyer User ─────────────────
        var case1 = Guid.Parse("c3333333-3333-3333-3333-333333333301");
        var case2 = Guid.Parse("c3333333-3333-3333-3333-333333333302");
        var case3 = Guid.Parse("c3333333-3333-3333-3333-333333333303");
        var case4 = Guid.Parse("c4444444-4444-4444-4444-444444444401");
        var case5 = Guid.Parse("c4444444-4444-4444-4444-444444444402");

        modelBuilder.Entity<LegalCase>().HasData(
            new LegalCase { Id = case1, Number = "1452/211/2023", RegistrationDate = new DateTime(2023, 5, 12, 0, 0, 0, DateTimeKind.Utc), Court = "Judecătoria Cluj-Napoca", Object = "Pretenții - restituire împrumut", Reclamant = "SC Alpha Tech SRL", Parat = "Popa Vasile", Stage = CaseStage.Fond, Status = CaseStatus.Activ, CreatedByUserId = lawyerUserId },
            new LegalCase { Id = case2, Number = "899/33/2024", RegistrationDate = new DateTime(2024, 2, 10, 0, 0, 0, DateTimeKind.Utc), Court = "Tribunalul Cluj", Object = "Litigiu de muncă - concediere abuzivă", Reclamant = "Mureșan Andrei", Parat = "SC BuildCorp SA", Stage = CaseStage.Apel, Status = (CaseStatus)1, CreatedByUserId = lawyerUserId }, // Cast to integer 1 -> Amânat
            new LegalCase { Id = case3, Number = "5521/117/2022", RegistrationDate = new DateTime(2022, 11, 20, 0, 0, 0, DateTimeKind.Utc), Court = "Curtea de Apel Cluj", Object = "Contencios administrativ - anulare act", Reclamant = "Asociația Natura Verde", Parat = "Primăria Cluj-Napoca", Stage = CaseStage.Recurs, Status = CaseStatus.Finalizat, CreatedByUserId = lawyerUserId },
            
            new LegalCase { Id = case4, Number = "334/211/2024", RegistrationDate = new DateTime(2024, 1, 15, 0, 0, 0, DateTimeKind.Utc), Court = "Judecătoria Turda", Object = "Divorț cu minori", Reclamant = "Ionescu Maria", Parat = "Ionescu Dan", Stage = CaseStage.Fond, Status = CaseStatus.Activ, CreatedByUserId = lawyerUserId },
            new LegalCase { Id = case5, Number = "112/33/2023", RegistrationDate = new DateTime(2023, 8, 5, 0, 0, 0, DateTimeKind.Utc), Court = "Tribunalul București", Object = "Daune morale - malpraxis", Reclamant = "Stan Elena", Parat = "Spitalul Județean", Stage = CaseStage.Fond, Status = (CaseStatus)1, CreatedByUserId = lawyerUserId } // Cast to integer 1 -> Amânat
        );

        modelBuilder.Entity<CaseDocument>().HasData(
            // Documents for case 1
            new CaseDocument { Id = Guid.Parse("d3333333-3333-3333-3333-333333333301"), Name = "Cerere_de_chemare_in_judecata.pdf", Type = DocumentType.Cerere, UploadedAt = new DateTime(2023, 5, 12, 10, 15, 0, DateTimeKind.Utc), LegalCaseId = case1 },
            new CaseDocument { Id = Guid.Parse("d3333333-3333-3333-3333-333333333302"), Name = "Intampinare_Parat.pdf", Type = DocumentType.Intampinare, UploadedAt = new DateTime(2023, 6, 1, 14, 30, 0, DateTimeKind.Utc), LegalCaseId = case1 },
            new CaseDocument { Id = Guid.Parse("d3333333-3333-3333-3333-333333333303"), Name = "Contract_imprumut_semnat.pdf", Type = DocumentType.Probe, UploadedAt = new DateTime(2023, 5, 12, 10, 20, 0, DateTimeKind.Utc), LegalCaseId = case1 },
            
            // Documents for case 4
            new CaseDocument { Id = Guid.Parse("d4444444-4444-4444-4444-444444444401"), Name = "Actiune_Divort.pdf", Type = DocumentType.Cerere, UploadedAt = new DateTime(2024, 1, 15, 9, 45, 0, DateTimeKind.Utc), LegalCaseId = case4 },
            new CaseDocument { Id = Guid.Parse("d4444444-4444-4444-4444-444444444402"), Name = "Certificat_Casatorie.pdf", Type = DocumentType.Probe, UploadedAt = new DateTime(2024, 1, 15, 9, 46, 0, DateTimeKind.Utc), LegalCaseId = case4 }
        );
    }
}
