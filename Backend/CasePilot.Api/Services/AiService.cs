using System.Text.RegularExpressions;
using CasePilot.Api.Models;
using CasePilot.Api.Services.External;
using CasePilot.Api.Services.Interfaces;
using CasePilot.Api.Storage;
using Microsoft.EntityFrameworkCore;

namespace CasePilot.Api.Services;

public class AiService : IAiService
{
    private readonly IGeminiClient _gemini;
    private readonly CasePilotDbContext _context;

    // Map frontend documentType keys → Romanian labels for the prompt
    private static readonly Dictionary<string, string> DocumentTypeLabels = new(StringComparer.OrdinalIgnoreCase)
    {
        ["amanare"]    = "Cerere de amânare a judecății",
        ["probatoriu"] = "Cerere de administrare a probatoriului",
        ["concluzii"]  = "Concluzii scrise",
        ["intampinare"]= "Întâmpinare",
        ["alt"]        = "Document juridic"
    };

    public AiService(IGeminiClient gemini, CasePilotDbContext context)
    {
        _gemini  = gemini;
        _context = context;
    }

    public async Task<string> GenerateDocument(
        Guid userId,
        Guid caseId,
        string documentType,
        string additionalData,
        string? templateText = null)
    {
        // Owner-scoped load
        var legalCase = _context.LegalCases
            .Include(c => c.Documents)
            .Include(c => c.Hearings)
            .FirstOrDefault(c => c.Id == caseId && c.CreatedByUserId == userId);

        if (legalCase is null)
            throw new Exception("Dosarul nu a fost găsit sau nu aparține utilizatorului.");

        var docLabel = DocumentTypeLabels.TryGetValue(documentType, out var label)
            ? label
            : documentType;

        // Gather document summaries (max 2000 chars each to avoid huge prompts)
        var docContextLines = legalCase.Documents
            .Where(d => !string.IsNullOrWhiteSpace(d.TextContent))
            .Select(d => $"- {d.Name} ({d.Type}): {d.TextContent![..Math.Min(d.TextContent!.Length, 2000)]}")
            .ToList();

        var docContext = docContextLines.Count > 0
            ? "Documente existente în dosar:\n" + string.Join("\n", docContextLines)
            : "Nu există documente cu text disponibil în dosar.";

        var hearingContext = legalCase.Hearings.Count > 0
            ? "Termene de judecată:\n" + string.Join("\n", legalCase.Hearings.Select(h =>
                $"- {h.Date:dd.MM.yyyy}, sala {h.CourtRoom}: {h.Title} ({h.Note})"))
            : "Nu există termene de judecată înregistrate.";

        var templateSection = !string.IsNullOrWhiteSpace(templateText)
            ? $"\nȘablon furnizat de utilizator (urmează această structură):\n{templateText[..Math.Min(templateText.Length, 3000)]}"
            : string.Empty;

        var prompt = $"""
            Ești un asistent juridic specializat în dreptul românesc. Redactează un document de tipul "{docLabel}" pentru dosarul descris mai jos.

            DOSAR:
            - Număr dosar: {legalCase.Number}
            - Instanță: {legalCase.Court}
            - Obiect: {legalCase.Object}
            - Reclamant: {legalCase.Reclamant}
            - Pârât: {legalCase.Parat}
            - Stadiu procesual: {legalCase.Stage}
            - Status: {legalCase.Status}
            - Data înregistrare: {legalCase.RegistrationDate:dd.MM.yyyy}

            {hearingContext}

            {docContext}

            Instrucțiuni suplimentare de la avocat:
            {(string.IsNullOrWhiteSpace(additionalData) ? "Nicio instrucțiune suplimentară." : additionalData)}
            {templateSection}

            Reguli:
            1. Redactează documentul în limba română, cu formulare juridică corectă și profesionistă.
            2. Folosește stilul formal specific documentelor de instanță din România.
            3. Completează toate câmpurile cu datele disponibile din dosar; pentru câmpuri lipsă, folosește paranteze drepte, ex: [Numele avocatului].
            4. Returnează DOAR textul documentului, fără explicații sau comentarii suplimentare.
            5. NU folosi formatare Markdown. Fără asteriscuri (**), dieze (#), liniuțe formatate (---) sau alte simboluri de formatare. Scrie text simplu, cu spații și linii noi pentru structurare.
            """;

        var result = await _gemini.GenerateTextAsync(prompt);
        return StripMarkdown(result);
    }

    public async Task<string> SummarizeDocument(Guid userId, Guid caseId, Guid documentId)
    {
        // Owner-scoped: verify the case belongs to the user first
        var legalCase = _context.LegalCases
            .FirstOrDefault(c => c.Id == caseId && c.CreatedByUserId == userId);

        if (legalCase is null)
            throw new Exception("Dosarul nu a fost găsit sau nu aparține utilizatorului.");

        var doc = _context.CaseDocuments
            .FirstOrDefault(d => d.Id == documentId && d.LegalCaseId == caseId);

        if (doc is null)
            throw new Exception("Documentul nu a fost găsit.");

        if (string.IsNullOrWhiteSpace(doc.TextContent))
            return "Documentul nu conține text extractibil (poate fi un scan sau o imagine). " +
                   "Încarcă un document PDF sau DOCX cu text pentru a genera o sinteză.";

        var prompt = $"""
            Ești un asistent juridic specializat în dreptul românesc. Analizează documentul de mai jos și oferă o sinteză structurată.

            Document: {doc.Name} (tip: {doc.Type})
            Din dosarul: {legalCase.Number} - {legalCase.Object}

            Conținut document:
            {doc.TextContent[..Math.Min(doc.TextContent.Length, 6000)]}

            Oferă o sinteză în limba română care include:
            1. Parties implicate (reclamant, pârât, alți intervenienți menționați)
            2. Obiectul documentului
            3. Argumentele sau capetele de cerere principale
            4. Aspecte juridice relevante menționate (articole de lege, jurisprudență)
            5. Concluzii sau solicitări formulate

            Returnează sinteza formatată clar, în limba română.
            """;

        var result = await _gemini.GenerateTextAsync(prompt);
        return StripMarkdown(result);
    }

    /// <summary>
    /// Removes Markdown formatting artifacts from Gemini output so the text
    /// is clean plain text suitable for a legal document.
    /// </summary>
    private static string StripMarkdown(string text)
    {
        // **bold** or __bold__ → inner text
        text = Regex.Replace(text, @"\*\*(.+?)\*\*", "$1", RegexOptions.Singleline);
        text = Regex.Replace(text, @"__(.+?)__",     "$1", RegexOptions.Singleline);
        // *italic* or _italic_ → inner text
        text = Regex.Replace(text, @"\*(.+?)\*", "$1", RegexOptions.Singleline);
        text = Regex.Replace(text, @"_(.+?)_",   "$1", RegexOptions.Singleline);
        // # Heading lines → remove leading #+ and space
        text = Regex.Replace(text, @"^#{1,6}\s+", "", RegexOptions.Multiline);
        // Horizontal rules (---, ***, ___)
        text = Regex.Replace(text, @"^\s*[-*_]{3,}\s*$", "", RegexOptions.Multiline);
        // Collapse multiple blank lines to at most two
        text = Regex.Replace(text, @"\n{3,}", "\n\n");
        return text.Trim();
    }
}
