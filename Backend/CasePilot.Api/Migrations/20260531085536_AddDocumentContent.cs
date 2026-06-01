using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CasePilot.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddDocumentContent : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<byte[]>(
                name: "Content",
                table: "CaseDocuments",
                type: "BLOB",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ContentType",
                table: "CaseDocuments",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "SizeBytes",
                table: "CaseDocuments",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<string>(
                name: "TextContent",
                table: "CaseDocuments",
                type: "TEXT",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "CaseDocuments",
                keyColumn: "Id",
                keyValue: new Guid("d3333333-3333-3333-3333-333333333301"),
                columns: new[] { "Content", "ContentType", "SizeBytes", "TextContent" },
                values: new object[] { null, null, 0L, null });

            migrationBuilder.UpdateData(
                table: "CaseDocuments",
                keyColumn: "Id",
                keyValue: new Guid("d3333333-3333-3333-3333-333333333302"),
                columns: new[] { "Content", "ContentType", "SizeBytes", "TextContent" },
                values: new object[] { null, null, 0L, null });

            migrationBuilder.UpdateData(
                table: "CaseDocuments",
                keyColumn: "Id",
                keyValue: new Guid("d3333333-3333-3333-3333-333333333303"),
                columns: new[] { "Content", "ContentType", "SizeBytes", "TextContent" },
                values: new object[] { null, null, 0L, null });

            migrationBuilder.UpdateData(
                table: "CaseDocuments",
                keyColumn: "Id",
                keyValue: new Guid("d4444444-4444-4444-4444-444444444401"),
                columns: new[] { "Content", "ContentType", "SizeBytes", "TextContent" },
                values: new object[] { null, null, 0L, null });

            migrationBuilder.UpdateData(
                table: "CaseDocuments",
                keyColumn: "Id",
                keyValue: new Guid("d4444444-4444-4444-4444-444444444402"),
                columns: new[] { "Content", "ContentType", "SizeBytes", "TextContent" },
                values: new object[] { null, null, 0L, null });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Content",
                table: "CaseDocuments");

            migrationBuilder.DropColumn(
                name: "ContentType",
                table: "CaseDocuments");

            migrationBuilder.DropColumn(
                name: "SizeBytes",
                table: "CaseDocuments");

            migrationBuilder.DropColumn(
                name: "TextContent",
                table: "CaseDocuments");
        }
    }
}
