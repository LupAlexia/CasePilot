using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CasePilot.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCaseOwnership : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "CreatedByUserId",
                table: "LegalCases",
                type: "TEXT",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_LegalCases_CreatedByUserId",
                table: "LegalCases",
                column: "CreatedByUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_LegalCases_Users_CreatedByUserId",
                table: "LegalCases",
                column: "CreatedByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_LegalCases_Users_CreatedByUserId",
                table: "LegalCases");

            migrationBuilder.DropIndex(
                name: "IX_LegalCases_CreatedByUserId",
                table: "LegalCases");

            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "LegalCases");
        }
    }
}
