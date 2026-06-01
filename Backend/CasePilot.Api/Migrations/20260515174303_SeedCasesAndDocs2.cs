using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace CasePilot.Api.Migrations
{
    /// <inheritdoc />
    public partial class SeedCasesAndDocs2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "LegalCases",
                columns: new[] { "Id", "Court", "CreatedByUserId", "Number", "Object", "Parat", "Reclamant", "RegistrationDate", "Stage", "Status" },
                values: new object[,]
                {
                    { new Guid("c3333333-3333-3333-3333-333333333301"), "Judecătoria Cluj-Napoca", new Guid("b2222222-2222-2222-2222-222222222222"), "1452/211/2023", "Pretenții - restituire împrumut", "Popa Vasile", "SC Alpha Tech SRL", new DateTime(2023, 5, 12, 0, 0, 0, 0, DateTimeKind.Utc), 0, 0 },
                    { new Guid("c3333333-3333-3333-3333-333333333302"), "Tribunalul Cluj", new Guid("b2222222-2222-2222-2222-222222222222"), "899/33/2024", "Litigiu de muncă - concediere abuzivă", "SC BuildCorp SA", "Mureșan Andrei", new DateTime(2024, 2, 10, 0, 0, 0, 0, DateTimeKind.Utc), 1, 1 },
                    { new Guid("c3333333-3333-3333-3333-333333333303"), "Curtea de Apel Cluj", new Guid("b2222222-2222-2222-2222-222222222222"), "5521/117/2022", "Contencios administrativ - anulare act", "Primăria Cluj-Napoca", "Asociația Natura Verde", new DateTime(2022, 11, 20, 0, 0, 0, 0, DateTimeKind.Utc), 2, 3 },
                    { new Guid("c4444444-4444-4444-4444-444444444401"), "Judecătoria Turda", new Guid("b2222222-2222-2222-2222-222222222222"), "334/211/2024", "Divorț cu minori", "Ionescu Dan", "Ionescu Maria", new DateTime(2024, 1, 15, 0, 0, 0, 0, DateTimeKind.Utc), 0, 0 },
                    { new Guid("c4444444-4444-4444-4444-444444444402"), "Tribunalul București", new Guid("b2222222-2222-2222-2222-222222222222"), "112/33/2023", "Daune morale - malpraxis", "Spitalul Județean", "Stan Elena", new DateTime(2023, 8, 5, 0, 0, 0, 0, DateTimeKind.Utc), 0, 1 }
                });

            migrationBuilder.InsertData(
                table: "CaseDocuments",
                columns: new[] { "Id", "LegalCaseId", "Name", "Type", "UploadedAt" },
                values: new object[,]
                {
                    { new Guid("d3333333-3333-3333-3333-333333333301"), new Guid("c3333333-3333-3333-3333-333333333301"), "Cerere_de_chemare_in_judecata.pdf", 0, new DateTime(2023, 5, 12, 10, 15, 0, 0, DateTimeKind.Utc) },
                    { new Guid("d3333333-3333-3333-3333-333333333302"), new Guid("c3333333-3333-3333-3333-333333333301"), "Intampinare_Parat.pdf", 1, new DateTime(2023, 6, 1, 14, 30, 0, 0, DateTimeKind.Utc) },
                    { new Guid("d3333333-3333-3333-3333-333333333303"), new Guid("c3333333-3333-3333-3333-333333333301"), "Contract_imprumut_semnat.pdf", 2, new DateTime(2023, 5, 12, 10, 20, 0, 0, DateTimeKind.Utc) },
                    { new Guid("d4444444-4444-4444-4444-444444444401"), new Guid("c4444444-4444-4444-4444-444444444401"), "Actiune_Divort.pdf", 0, new DateTime(2024, 1, 15, 9, 45, 0, 0, DateTimeKind.Utc) },
                    { new Guid("d4444444-4444-4444-4444-444444444402"), new Guid("c4444444-4444-4444-4444-444444444401"), "Certificat_Casatorie.pdf", 2, new DateTime(2024, 1, 15, 9, 46, 0, 0, DateTimeKind.Utc) }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "CaseDocuments",
                keyColumn: "Id",
                keyValue: new Guid("d3333333-3333-3333-3333-333333333301"));

            migrationBuilder.DeleteData(
                table: "CaseDocuments",
                keyColumn: "Id",
                keyValue: new Guid("d3333333-3333-3333-3333-333333333302"));

            migrationBuilder.DeleteData(
                table: "CaseDocuments",
                keyColumn: "Id",
                keyValue: new Guid("d3333333-3333-3333-3333-333333333303"));

            migrationBuilder.DeleteData(
                table: "CaseDocuments",
                keyColumn: "Id",
                keyValue: new Guid("d4444444-4444-4444-4444-444444444401"));

            migrationBuilder.DeleteData(
                table: "CaseDocuments",
                keyColumn: "Id",
                keyValue: new Guid("d4444444-4444-4444-4444-444444444402"));

            migrationBuilder.DeleteData(
                table: "LegalCases",
                keyColumn: "Id",
                keyValue: new Guid("c3333333-3333-3333-3333-333333333302"));

            migrationBuilder.DeleteData(
                table: "LegalCases",
                keyColumn: "Id",
                keyValue: new Guid("c3333333-3333-3333-3333-333333333303"));

            migrationBuilder.DeleteData(
                table: "LegalCases",
                keyColumn: "Id",
                keyValue: new Guid("c4444444-4444-4444-4444-444444444402"));

            migrationBuilder.DeleteData(
                table: "LegalCases",
                keyColumn: "Id",
                keyValue: new Guid("c3333333-3333-3333-3333-333333333301"));

            migrationBuilder.DeleteData(
                table: "LegalCases",
                keyColumn: "Id",
                keyValue: new Guid("c4444444-4444-4444-4444-444444444401"));
        }
    }
}
