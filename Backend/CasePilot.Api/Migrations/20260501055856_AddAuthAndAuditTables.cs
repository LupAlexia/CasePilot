using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace CasePilot.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddAuthAndAuditTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Permissions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Permissions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Roles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Roles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Email = table.Column<string>(type: "TEXT", nullable: false),
                    Password = table.Column<string>(type: "TEXT", nullable: false),
                    FullName = table.Column<string>(type: "TEXT", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "RolePermissions",
                columns: table => new
                {
                    RoleId = table.Column<Guid>(type: "TEXT", nullable: false),
                    PermissionId = table.Column<Guid>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RolePermissions", x => new { x.RoleId, x.PermissionId });
                    table.ForeignKey(
                        name: "FK_RolePermissions_Permissions_PermissionId",
                        column: x => x.PermissionId,
                        principalTable: "Permissions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RolePermissions_Roles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "Roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AuditLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    UserId = table.Column<Guid>(type: "TEXT", nullable: false),
                    UserRole = table.Column<string>(type: "TEXT", nullable: false),
                    Action = table.Column<string>(type: "TEXT", nullable: false),
                    EntityType = table.Column<string>(type: "TEXT", nullable: false),
                    EntityId = table.Column<string>(type: "TEXT", nullable: true),
                    Details = table.Column<string>(type: "TEXT", nullable: true),
                    IpAddress = table.Column<string>(type: "TEXT", nullable: true),
                    Timestamp = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuditLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AuditLogs_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SuspiciousUsers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    UserId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Reason = table.Column<string>(type: "TEXT", nullable: false),
                    SeverityScore = table.Column<int>(type: "INTEGER", nullable: false),
                    DetectedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    IsResolved = table.Column<bool>(type: "INTEGER", nullable: false),
                    ResolvedByUserId = table.Column<Guid>(type: "TEXT", nullable: true),
                    ResolvedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SuspiciousUsers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SuspiciousUsers_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserRoles",
                columns: table => new
                {
                    UserId = table.Column<Guid>(type: "TEXT", nullable: false),
                    RoleId = table.Column<Guid>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserRoles", x => new { x.UserId, x.RoleId });
                    table.ForeignKey(
                        name: "FK_UserRoles_Roles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "Roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserRoles_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "Permissions",
                columns: new[] { "Id", "Name" },
                values: new object[,]
                {
                    { new Guid("c0000000-0000-0000-0000-000000000001"), "cases.view" },
                    { new Guid("c0000000-0000-0000-0000-000000000002"), "cases.create" },
                    { new Guid("c0000000-0000-0000-0000-000000000003"), "cases.edit" },
                    { new Guid("c0000000-0000-0000-0000-000000000004"), "cases.delete" },
                    { new Guid("c0000000-0000-0000-0000-000000000005"), "docs.view" },
                    { new Guid("c0000000-0000-0000-0000-000000000006"), "docs.create" },
                    { new Guid("c0000000-0000-0000-0000-000000000007"), "docs.edit" },
                    { new Guid("c0000000-0000-0000-0000-000000000008"), "docs.delete" },
                    { new Guid("c0000000-0000-0000-0000-000000000009"), "stats.view" },
                    { new Guid("c0000000-0000-0000-0000-000000000010"), "users.manage" },
                    { new Guid("c0000000-0000-0000-0000-000000000011"), "audit.view" },
                    { new Guid("c0000000-0000-0000-0000-000000000012"), "simulator.control" }
                });

            migrationBuilder.InsertData(
                table: "Roles",
                columns: new[] { "Id", "Name" },
                values: new object[,]
                {
                    { new Guid("a1111111-1111-1111-1111-111111111111"), "Admin" },
                    { new Guid("a2222222-2222-2222-2222-222222222222"), "User" }
                });

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "CreatedAt", "Email", "FullName", "IsActive", "Password" },
                values: new object[,]
                {
                    { new Guid("b1111111-1111-1111-1111-111111111111"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "admin@casepilot.com", "Administrator", true, "admin123" },
                    { new Guid("b2222222-2222-2222-2222-222222222222"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "avocat@casepilot.com", "Ion Popescu", true, "avocat123" }
                });

            migrationBuilder.InsertData(
                table: "RolePermissions",
                columns: new[] { "PermissionId", "RoleId" },
                values: new object[,]
                {
                    { new Guid("c0000000-0000-0000-0000-000000000001"), new Guid("a1111111-1111-1111-1111-111111111111") },
                    { new Guid("c0000000-0000-0000-0000-000000000002"), new Guid("a1111111-1111-1111-1111-111111111111") },
                    { new Guid("c0000000-0000-0000-0000-000000000003"), new Guid("a1111111-1111-1111-1111-111111111111") },
                    { new Guid("c0000000-0000-0000-0000-000000000004"), new Guid("a1111111-1111-1111-1111-111111111111") },
                    { new Guid("c0000000-0000-0000-0000-000000000005"), new Guid("a1111111-1111-1111-1111-111111111111") },
                    { new Guid("c0000000-0000-0000-0000-000000000006"), new Guid("a1111111-1111-1111-1111-111111111111") },
                    { new Guid("c0000000-0000-0000-0000-000000000007"), new Guid("a1111111-1111-1111-1111-111111111111") },
                    { new Guid("c0000000-0000-0000-0000-000000000008"), new Guid("a1111111-1111-1111-1111-111111111111") },
                    { new Guid("c0000000-0000-0000-0000-000000000009"), new Guid("a1111111-1111-1111-1111-111111111111") },
                    { new Guid("c0000000-0000-0000-0000-000000000010"), new Guid("a1111111-1111-1111-1111-111111111111") },
                    { new Guid("c0000000-0000-0000-0000-000000000011"), new Guid("a1111111-1111-1111-1111-111111111111") },
                    { new Guid("c0000000-0000-0000-0000-000000000012"), new Guid("a1111111-1111-1111-1111-111111111111") },
                    { new Guid("c0000000-0000-0000-0000-000000000001"), new Guid("a2222222-2222-2222-2222-222222222222") },
                    { new Guid("c0000000-0000-0000-0000-000000000002"), new Guid("a2222222-2222-2222-2222-222222222222") },
                    { new Guid("c0000000-0000-0000-0000-000000000003"), new Guid("a2222222-2222-2222-2222-222222222222") },
                    { new Guid("c0000000-0000-0000-0000-000000000004"), new Guid("a2222222-2222-2222-2222-222222222222") },
                    { new Guid("c0000000-0000-0000-0000-000000000005"), new Guid("a2222222-2222-2222-2222-222222222222") },
                    { new Guid("c0000000-0000-0000-0000-000000000006"), new Guid("a2222222-2222-2222-2222-222222222222") },
                    { new Guid("c0000000-0000-0000-0000-000000000007"), new Guid("a2222222-2222-2222-2222-222222222222") },
                    { new Guid("c0000000-0000-0000-0000-000000000008"), new Guid("a2222222-2222-2222-2222-222222222222") },
                    { new Guid("c0000000-0000-0000-0000-000000000009"), new Guid("a2222222-2222-2222-2222-222222222222") }
                });

            migrationBuilder.InsertData(
                table: "UserRoles",
                columns: new[] { "RoleId", "UserId" },
                values: new object[,]
                {
                    { new Guid("a1111111-1111-1111-1111-111111111111"), new Guid("b1111111-1111-1111-1111-111111111111") },
                    { new Guid("a2222222-2222-2222-2222-222222222222"), new Guid("b2222222-2222-2222-2222-222222222222") }
                });

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_Timestamp",
                table: "AuditLogs",
                column: "Timestamp");

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_UserId",
                table: "AuditLogs",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Permissions_Name",
                table: "Permissions",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RolePermissions_PermissionId",
                table: "RolePermissions",
                column: "PermissionId");

            migrationBuilder.CreateIndex(
                name: "IX_Roles_Name",
                table: "Roles",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SuspiciousUsers_UserId",
                table: "SuspiciousUsers",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_UserRoles_RoleId",
                table: "UserRoles",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AuditLogs");

            migrationBuilder.DropTable(
                name: "RolePermissions");

            migrationBuilder.DropTable(
                name: "SuspiciousUsers");

            migrationBuilder.DropTable(
                name: "UserRoles");

            migrationBuilder.DropTable(
                name: "Permissions");

            migrationBuilder.DropTable(
                name: "Roles");

            migrationBuilder.DropTable(
                name: "Users");
        }
    }
}
