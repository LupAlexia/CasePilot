using System.IO.Compression;
using System.Net;
using System.Text;
using CasePilot.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CasePilot.Api.Storage;

public static class DemoDataSeeder
{
    private static readonly Guid LawyerUserId = Guid.Parse("b2222222-2222-2222-2222-222222222222");
    private static readonly Guid UserRoleId = Guid.Parse("a2222222-2222-2222-2222-222222222222");
    //private const string LawyerEmail = "andreipopescu@gmail.com";
    private const string LawyerEmail = "lexu1546@gmail.com";
    private const string LawyerPassword = "Popescu123!";
    private const string WordContentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";


    public static async Task SeedAsync(CasePilotDbContext db, string contentRootPath)
    {
        await UpsertLawyerAsync(db);
        await UpsertCasesAsync(db);
        await UpsertHearingsAsync(db);
        await UpsertDocumentsAsync(db, contentRootPath);

        await db.SaveChangesAsync();
    }

    private static async Task UpsertLawyerAsync(CasePilotDbContext db)
    {
        var userRole = await db.Roles.FindAsync(UserRoleId);
        if (userRole is null)
        {
            db.Roles.Add(new AppRole { Id = UserRoleId, Name = "User" });
        }

        var lawyer = await db.Users.FindAsync(LawyerUserId);
        if (lawyer is null)
        {
            // New install — set initial plain-text password (auto-upgraded to BCrypt on first login)
            lawyer = new AppUser
            {
                Id = LawyerUserId,
                Email = LawyerEmail,
                Password = LawyerPassword,
                PasswordHash = string.Empty,
                FullName = "Popescu Andrei Marian",
                CreatedAt = new DateTime(2026, 1, 10, 8, 30, 0, DateTimeKind.Utc),
                IsActive = true
            };
            db.Users.Add(lawyer);
        }
        else
        {
            // Existing user — only update non-credential fields so password changes survive restarts
            lawyer.Email = LawyerEmail;
            lawyer.FullName = "Popescu Andrei Marian";
            lawyer.IsActive = true;
        }

        var hasUserRole = await db.UserRoles
            .AnyAsync(ur => ur.UserId == LawyerUserId && ur.RoleId == UserRoleId);
        if (!hasUserRole)
        {
            db.UserRoles.Add(new AppUserRole { UserId = LawyerUserId, RoleId = UserRoleId });
        }
    }

    private static async Task UpsertCasesAsync(CasePilotDbContext db)
    {
        var cases = new[]
        {
            new LegalCase
            {
                Id = Guid.Parse("c3333333-3333-3333-3333-333333333301"),
                Number = "11613/211/2025",
                RegistrationDate = UtcDate(2025, 9, 18),
                Court = "Judecătoria Cluj-Napoca",
                Object = "pretenții - restituire împrumut",
                Reclamant = "Radu-Cristian Neagu",
                Parat = "Mihai Ilie",
                Stage = CaseStage.Fond,
                Status = CaseStatus.Activ,
                CreatedByUserId = LawyerUserId
            },
            new LegalCase
            {
                Id = Guid.Parse("c3333333-3333-3333-3333-333333333302"),
                Number = "2387/117/2025",
                RegistrationDate = UtcDate(2025, 3, 4),
                Court = "Tribunalul Cluj",
                Object = "conflict de muncă - contestație decizie concediere",
                Reclamant = "Ana-Maria Varga",
                Parat = "SC Transilvania Software Solutions SRL",
                Stage = CaseStage.Fond,
                Status = (CaseStatus)1,
                CreatedByUserId = LawyerUserId
            },
            new LegalCase
            {
                Id = Guid.Parse("c3333333-3333-3333-3333-333333333303"),
                Number = "7521/3/2024",
                RegistrationDate = UtcDate(2024, 11, 6),
                Court = "Tribunalul București",
                Object = "răspundere civilă delictuală - malpraxis medical",
                Reclamant = "Elena Stan",
                Parat = "Spitalul Clinic Sf. Maria București",
                Stage = CaseStage.Fond,
                Status = CaseStatus.Activ,
                CreatedByUserId = LawyerUserId
            },
            new LegalCase
            {
                Id = Guid.Parse("c4444444-4444-4444-4444-444444444401"),
                Number = "5417/211/2025",
                RegistrationDate = UtcDate(2025, 6, 12),
                Court = "Judecătoria Cluj-Napoca",
                Object = "divorț cu minori - exercitare autoritate părintească",
                Reclamant = "Maria Ionescu",
                Parat = "Dan Ionescu",
                Stage = CaseStage.Fond,
                Status = CaseStatus.Activ,
                CreatedByUserId = LawyerUserId
            },
            new LegalCase
            {
                Id = Guid.Parse("c4444444-4444-4444-4444-444444444402"),
                Number = "982/33/2025",
                RegistrationDate = UtcDate(2025, 5, 22),
                Court = "Curtea de Apel Cluj",
                Object = "contencios administrativ și fiscal - anulare decizie impunere",
                Reclamant = "SC Nord Instal Expert SRL",
                Parat = "Direcția Generală Regională a Finanțelor Publice Cluj-Napoca",
                Stage = CaseStage.Recurs,
                Status = CaseStatus.Activ,
                CreatedByUserId = LawyerUserId
            },
            new LegalCase
            {
                Id = Guid.Parse("c5555555-5555-5555-5555-555555555501"),
                Number = "12984/211/2025",
                RegistrationDate = UtcDate(2025, 10, 9),
                Court = "Judecătoria Cluj-Napoca",
                Object = "contestație la executare",
                Reclamant = "Cristian Dobre",
                Parat = "BT Leasing Transilvania IFN SA",
                Stage = CaseStage.Contestație,
                Status = (CaseStatus)1,
                CreatedByUserId = LawyerUserId
            }
        };

        foreach (var demoCase in cases)
        {
            var existing = await db.LegalCases.FindAsync(demoCase.Id);
            if (existing is null)
            {
                db.LegalCases.Add(demoCase);
                continue;
            }

            existing.Number = demoCase.Number;
            existing.RegistrationDate = demoCase.RegistrationDate;
            existing.Court = demoCase.Court;
            existing.Object = demoCase.Object;
            existing.Reclamant = demoCase.Reclamant;
            existing.Parat = demoCase.Parat;
            existing.Stage = demoCase.Stage;
            existing.Status = demoCase.Status;
            existing.CreatedByUserId = demoCase.CreatedByUserId;
        }
    }

    private static async Task UpsertHearingsAsync(CasePilotDbContext db)
    {
        var hearings = new[]
        {
            Hearing("e1111111-1111-1111-1111-111111111101", "Termen judecată - încuviințare probe", 2026, 6, 17, 9, 30, "Sala 102", "Se discută proba cu înscrisuri și interogatoriul pârâtului.", "c3333333-3333-3333-3333-333333333301"),
            Hearing("e1111111-1111-1111-1111-111111111102", "Termen judecată - administrare interogatoriu", 2026, 9, 23, 10, 0, "Sala 102", "Pârâtul va fi citat cu mențiunea personal la interogatoriu.", "c3333333-3333-3333-3333-333333333301"),
            Hearing("e1111111-1111-1111-1111-111111111201", "Termen judecată - probe raporturi de muncă", 2026, 6, 24, 11, 0, "Sala 31", "Amână cauza pentru depunerea pontajelor și a registrului de evidență a salariaților.", "c3333333-3333-3333-3333-333333333302"),
            Hearing("e1111111-1111-1111-1111-111111111202", "Termen judecată - dezbateri", 2026, 10, 7, 12, 30, "Sala 31", "Se estimează punerea concluziilor pe fond.", "c3333333-3333-3333-3333-333333333302"),
            Hearing("e1111111-1111-1111-1111-111111111301", "Termen judecată - raport expertiză medico-legală", 2026, 7, 3, 9, 0, "Sala 208", "Institutul medico-legal va comunica raportul de expertiză.", "c3333333-3333-3333-3333-333333333303"),
            Hearing("e1111111-1111-1111-1111-111111111302", "Termen judecată - obiecțiuni expertiză", 2026, 11, 12, 9, 30, "Sala 208", "Părțile pot formula obiecțiuni la raportul de expertiză.", "c3333333-3333-3333-3333-333333333303"),
            Hearing("e1111111-1111-1111-1111-111111111401", "Termen cameră de consiliu - ascultare minori", 2026, 6, 10, 8, 45, "Camera consiliu 4", "Audierea minorilor se face fără prezența părților.", "c4444444-4444-4444-4444-444444444401"),
            Hearing("e1111111-1111-1111-1111-111111111402", "Termen judecată - anchetă psihosocială", 2026, 9, 16, 10, 15, "Sala 104", "Se așteaptă referatul de anchetă psihosocială de la autoritatea tutelară.", "c4444444-4444-4444-4444-444444444401"),
            Hearing("e1111111-1111-1111-1111-111111111501", "Termen recurs - regularizare", 2026, 6, 19, 10, 0, "Sala 155", "Instanța verifică timbrajul și comunicarea întâmpinării.", "c4444444-4444-4444-4444-444444444402"),
            Hearing("e1111111-1111-1111-1111-111111111502", "Termen recurs - dezbateri", 2026, 9, 25, 11, 30, "Sala 155", "Părțile vor pune concluzii pe excepții și pe fond.", "c4444444-4444-4444-4444-444444444402"),
            Hearing("e1111111-1111-1111-1111-111111111601", "Termen judecată - suspendare executare", 2026, 6, 12, 9, 15, "Sala 101", "Se discută cauțiunea și cererea de suspendare provizorie.", "c5555555-5555-5555-5555-555555555501"),
            Hearing("e1111111-1111-1111-1111-111111111602", "Termen judecată - fond contestație", 2026, 8, 28, 9, 45, "Sala 101", "Creditorul va depune dosarul execuțional certificat.", "c5555555-5555-5555-5555-555555555501")
        };

        foreach (var hearing in hearings)
        {
            var existing = await db.HearingTerms.FindAsync(hearing.Id);
            if (existing is null)
            {
                db.HearingTerms.Add(hearing);
                continue;
            }

            existing.Title = hearing.Title;
            existing.Date = hearing.Date;
            existing.CourtRoom = hearing.CourtRoom;
            existing.Note = hearing.Note;
            existing.LegalCaseId = hearing.LegalCaseId;
        }
    }

    private static async Task UpsertDocumentsAsync(CasePilotDbContext db, string contentRootPath)
    {
        var seedDirectory = Path.Combine(contentRootPath, "SeedDocuments");
        Directory.CreateDirectory(seedDirectory);

        foreach (var demoDocument in BuildDocuments())
        {
            var content = DemoDocxBuilder.Create(demoDocument.Title, demoDocument.Paragraphs);
            var filePath = Path.Combine(seedDirectory, demoDocument.Name);
            await File.WriteAllBytesAsync(filePath, content);

            var document = await db.CaseDocuments.FindAsync(demoDocument.Id);
            if (document is null)
            {
                document = new CaseDocument { Id = demoDocument.Id };
                db.CaseDocuments.Add(document);
            }

            document.Name = demoDocument.Name;
            document.Type = demoDocument.Type;
            document.UploadedAt = demoDocument.UploadedAt;
            document.LegalCaseId = demoDocument.LegalCaseId;
            document.Content = content;
            document.ContentType = WordContentType;
            document.SizeBytes = content.LongLength;
            document.TextContent = string.Join(Environment.NewLine + Environment.NewLine, demoDocument.Paragraphs);
        }
    }

    private static DemoDocument[] BuildDocuments() =>
    [
        Document(
            "d3333333-3333-3333-3333-333333333301",
            "Cerere_chemare_judecată_restituire_împrumut.docx",
            DocumentType.Cerere,
            "c3333333-3333-3333-3333-333333333301",
            "11613/211/2025",
            UtcDateTime(2025, 9, 18, 10, 15),
            "Cerere de chemare în judecată - restituire împrumut",
            [
                "Domnule Președinte,",
                "Subsemnatul Radu-Cristian Neagu, domiciliat în Cluj-Napoca, str. Traian nr. 18, ap. 7, CNP 1840212123456, prin avocat Andrei Popescu, cu sediul profesional în Cluj-Napoca, str. Memorandumului nr. 12, formulez prezenta cerere de chemare în judecată împotriva pârâtului Mihai Ilie, domiciliat în Florești, str. Eroilor nr. 44, CNP 1800505123457.",
                "Solicit obligarea pârâtului la plata sumei de 48.500 lei, reprezentând împrumut nerestituit conform înscrisului sub semnătură privată din 14.02.2024, precum și la plata dobânzii legale penalizatoare până la data plății efective.",
                "În fapt, la data de 14.02.2024 reclamantul a remis pârâtului suma de 48.500 lei pentru acoperirea unor cheltuieli comerciale urgente, cu scadența convenită la 30.06.2024. Pârâtul a recunoscut datoria prin mesaje scrise, dar nu a restituit suma, deși a fost notificat amiabil la 12.08.2025.",
                "În drept, îmi întemeiez cererea pe dispozițiile Codului civil privind împrumutul de consumație și răspunderea contractuală, precum și pe dispozițiile Codului de procedură civilă referitoare la cuprinsul cererii introductive.",
                "Probe: înscrisul sub semnătură privată, extras cont, corespondența electronică, interogatoriul pârâtului și orice alte probe a căror necesitate va rezulta din dezbateri.",
                "Anexez dovada achitării taxei judiciare de timbru, împuternicirea avocațială și copii certificate pentru comunicare.",
                "Data: 18.09.2025. Semnătură avocat: Av. Andrei Popescu."
            ]),
        Document(
            "d3333333-3333-3333-3333-333333333302",
            "Întâmpinare_restituire_împrumut.docx",
            DocumentType.Intampinare,
            "c3333333-3333-3333-3333-333333333301",
            "11613/211/2025",
            UtcDateTime(2025, 10, 6, 13, 40),
            "Întâmpinare - pretenții",
            [
                "Domnule Președinte,",
                "Subsemnatul Mihai Ilie, pârât în dosarul nr. 11613/211/2025, formulez întâmpinare prin care solicit respingerea în parte a cererii ca neîntemeiată.",
                "Arăt că suma primită a fost de 35.000 lei, iar diferența menționată de reclamant reprezenta o contribuție voluntară la un proiect comun. Contest cuantumul pretins și modul de calcul al dobânzii solicitate.",
                "Invoc excepția prescripției parțiale a pretențiilor accesorii calculate anterior notificării și solicit compensarea cu suma de 7.800 lei reprezentând cheltuieli achitate pentru reclamant.",
                "Probe: înscrisuri, conversații electronice și interogatoriul reclamantului.",
                "Data: 06.10.2025. Semnătură: Mihai Ilie."
            ]),
        Document(
            "d3333333-3333-3333-3333-333333333303",
            "Contract_împrumut_și_scadențar.docx",
            DocumentType.Probe,
            "c3333333-3333-3333-3333-333333333301",
            "11613/211/2025",
            UtcDateTime(2025, 9, 18, 10, 25),
            "Înscris sub semnătură privată - împrumut",
            [
                "Contract de împrumut nr. 02/14.02.2024",
                "Creditor: Radu-Cristian Neagu, CNP 1840212123456. Debitor: Mihai Ilie, CNP 1800505123457.",
                "Creditorul remite debitorului suma de 48.500 lei, prin transfer bancar, cu titlu de împrumut fără dobândă convențională.",
                "Debitorul se obligă să restituie întreaga sumă până cel târziu la data de 30.06.2024, în contul indicat de creditor.",
                "Prezentul înscris este redactat în două exemplare originale și semnat de părți."
            ]),
        Document(
            "d4444444-4444-4444-4444-444444444403",
            "Cerere_contestație_concediere.docx",
            DocumentType.Cerere,
            "c3333333-3333-3333-3333-333333333302",
            "2387/117/2025",
            UtcDateTime(2025, 3, 4, 9, 20),
            "Contestație decizie de concediere",
            [
                "Către Tribunalul Cluj - Secția mixtă de contencios administrativ și fiscal, de conflicte de muncă și asigurări sociale,",
                "Subsemnata Ana-Maria Varga, domiciliată în Cluj-Napoca, aleea Detunata nr. 6, ap. 22, CNP 2910712123458, prin avocat, formulez contestație împotriva Deciziei de concediere nr. 18/12.02.2025 emise de SC Transilvania Software Solutions SRL.",
                "Solicit anularea deciziei, reintegrarea pe postul deținut anterior și obligarea angajatorului la plata drepturilor salariale indexate, majorate și actualizate de la data concedierii până la reintegrarea efectivă.",
                "În fapt, decizia nu descrie faptele imputate și nu indică motive obiective reale. Reorganizarea invocată a fost urmată de publicarea unui anunț pentru un post identic, iar criteriile de selecție nu au fost comunicate salariatei.",
                "În drept, invoc dispozițiile Codului muncii privind concedierea pentru motive care nu țin de persoana salariatului și nulitatea deciziei nelegal motivate.",
                "Probe: contract individual de muncă, decizie de concediere, corespondență HR, organigrame, anunț de recrutare și proba cu interogatoriul angajatorului.",
                "Data: 04.03.2025. Av. Andrei Popescu."
            ]),
        Document(
            "d4444444-4444-4444-4444-444444444404",
            "Întâmpinare_litigiu_muncă.docx",
            DocumentType.Intampinare,
            "c3333333-3333-3333-3333-333333333302",
            "2387/117/2025",
            UtcDateTime(2025, 4, 1, 14, 10),
            "Întâmpinare litigiu de muncă",
            [
                "SC Transilvania Software Solutions SRL formulează întâmpinare și solicită respingerea contestației.",
                "Societatea arată că postul ocupat de contestatoare a fost eliminat ca urmare a pierderii proiectului Alfa Retail și a scăderii veniturilor recurente cu 27%.",
                "Decizia a fost precedată de o analiză economică internă, iar salariatei i s-au oferit două posturi vacante compatibile, refuzate prin email la 10.02.2025.",
                "Probe: referat economic, organigrame anterior și ulterior concedierii, emailuri de consultare și extras Revisal.",
                "Data: 01.04.2025. Reprezentant convențional."
            ]),
        Document(
            "d4444444-4444-4444-4444-444444444405",
            "Cerere_malpraxis_medical.docx",
            DocumentType.Cerere,
            "c3333333-3333-3333-3333-333333333303",
            "7521/3/2024",
            UtcDateTime(2024, 11, 6, 12, 0),
            "Cerere de chemare în judecată - malpraxis",
            [
                "Către Tribunalul București,",
                "Subsemnata Elena Stan, domiciliată în București, str. Economu Cezarescu nr. 9, ap. 15, CNP 2780331123459, formulez cerere de chemare în judecată împotriva Spitalului Clinic Sf. Maria București.",
                "Solicit obligarea pârâtului la plata sumei de 180.000 lei cu titlu de daune morale și 24.350 lei daune materiale, ca urmare a conduitei medicale neconforme din perioada 12-18.05.2024.",
                "În fapt, reclamanta a fost externată fără investigații suplimentare deși prezenta semne clinice persistente. Ulterior, diagnosticul corect a impus intervenție chirurgicală de urgență și recuperare prelungită.",
                "În drept, invoc răspunderea civilă delictuală și normele speciale privind răspunderea personalului medical și a furnizorilor de servicii medicale.",
                "Probe: foi de observație, bilete de externare, raport medical privat, chitanțe, expertiză medico-legală și martori.",
                "Data: 06.11.2024. Av. Andrei Popescu."
            ]),
        Document(
            "d4444444-4444-4444-4444-444444444401",
            "Cerere_divorț_autoritate_părintească.docx",
            DocumentType.Cerere,
            "c4444444-4444-4444-4444-444444444401",
            "5417/211/2025",
            UtcDateTime(2025, 6, 12, 9, 45),
            "Cerere de divorț cu minori",
            [
                "Către Judecătoria Cluj-Napoca,",
                "Subsemnata Maria Ionescu, domiciliată în Cluj-Napoca, str. București nr. 58, ap. 11, CNP 2880404123460, formulez cerere de divorț împotriva pârâtului Dan Ionescu, domiciliat în Cluj-Napoca, str. Răsăritului nr. 21, CNP 1840909123461.",
                "Solicit desfacerea căsătoriei din culpă comună, exercitarea în comun a autorității părintești asupra minorilor I. A. și I. M., stabilirea locuinței minorilor la mamă și obligarea pârâtului la plata pensiei de întreținere.",
                "Solicit încuviințarea unui program de legături personale cu tatăl în două weekenduri pe lună și jumătate din vacanțele școlare, cu preluarea minorilor de la domiciliul mamei.",
                "În fapt, părțile sunt separate în fapt din luna martie 2025, iar conviețuirea nu mai poate continua din cauza neînțelegerilor repetate privind administrarea veniturilor și creșterea minorilor.",
                "Probe: certificat de căsătorie, certificatele de naștere ale minorilor, înscrisuri privind veniturile părților, anchetă psihosocială și audierea minorilor, dacă instanța apreciază necesar.",
                "Data: 12.06.2025. Av. Andrei Popescu."
            ]),
        Document(
            "d4444444-4444-4444-4444-444444444402",
            "Certificate_stare_civilă_divorț.docx",
            DocumentType.Probe,
            "c4444444-4444-4444-4444-444444444401",
            "5417/211/2025",
            UtcDateTime(2025, 6, 12, 9, 50),
            "Opis înscrisuri stare civilă",
            [
                "Opis înscrisuri depuse în dosarul nr. 5417/211/2025",
                "1. Certificat de căsătorie seria CX nr. 445812, emis de SPCLEP Cluj-Napoca la data de 17.08.2013.",
                "2. Certificat de naștere minor I. A., seria NZ nr. 778120, emis la data de 02.04.2015.",
                "3. Certificat de naștere minor I. M., seria NZ nr. 882144, emis la data de 21.09.2018.",
                "4. Adeverință venit reclamantă nr. 301/03.06.2025 și adeverință școală minor I. A.",
                "Toate datele din prezentul document sunt fictive și utilizate exclusiv pentru demo CasePilot."
            ]),
        Document(
            "d5555555-5555-5555-5555-555555555501",
            "Recurs_anulare_decizie_impunere.docx",
            DocumentType.Cerere,
            "c4444444-4444-4444-4444-444444444402",
            "982/33/2025",
            UtcDateTime(2025, 5, 22, 16, 0),
            "Cerere de recurs - contencios fiscal",
            [
                "Către Curtea de Apel Cluj,",
                "Subscrisa SC Nord Instal Expert SRL, CUI 48123456, cu sediul în Cluj-Napoca, str. Fabricii nr. 77, prin administrator Rareș Pop, formulează recurs împotriva sentinței civile nr. 421/2025 pronunțate de Tribunalul Cluj.",
                "Solicităm casarea sentinței și, în rejudecare, anularea Deciziei de impunere nr. CJ-1458/16.01.2025, precum și a deciziei de soluționare a contestației administrative.",
                "Motivele de recurs privesc aplicarea greșită a normelor privind deductibilitatea cheltuielilor și lipsa analizării documentelor justificative depuse în procedura administrativă.",
                "Instanța de fond a preluat concluziile organului fiscal fără a verifica raportul contractual, recepțiile de lucrări și plățile bancare efective.",
                "Probe: înscrisurile aflate la dosar, contracte, facturi, ordine de plată, procese-verbale de recepție și jurisprudență relevantă.",
                "Data: 22.05.2025. Av. Andrei Popescu."
            ]),
        Document(
            "d5555555-5555-5555-5555-555555555502",
            "Întâmpinare_recurs_fiscal.docx",
            DocumentType.Intampinare,
            "c4444444-4444-4444-4444-444444444402",
            "982/33/2025",
            UtcDateTime(2025, 6, 18, 11, 30),
            "Întâmpinare recurs fiscal",
            [
                "Direcția Generală Regională a Finanțelor Publice Cluj-Napoca formulează întâmpinare și solicită respingerea recursului ca nefondat.",
                "Recurenta nu a prezentat documente suficiente pentru justificarea prestării efective a serviciilor, iar înregistrările contabile nu pot substitui dovada realității operațiunilor.",
                "Hotărârea primei instanțe este legală și temeinică, fiind întemeiată pe analiza contractelor și a documentelor justificative puse la dispoziție de contribuabil.",
                "Data: 18.06.2025. Consilier juridic."
            ]),
        Document(
            "d6666666-6666-6666-6666-666666666601",
            "Contestație_la_executare.docx",
            DocumentType.Cerere,
            "c5555555-5555-5555-5555-555555555501",
            "12984/211/2025",
            UtcDateTime(2025, 10, 9, 8, 55),
            "Contestație la executare",
            [
                "Către Judecătoria Cluj-Napoca,",
                "Subsemnatul Cristian Dobre, domiciliat în Cluj-Napoca, str. Septimiu Albini nr. 33, ap. 3, CNP 1791122123462, formulez contestație la executare împotriva executării silite pornite în dosarul execuțional nr. 812/2025 al BEJ Radu Moldovan, la cererea intimatei BT Leasing Transilvania IFN SA.",
                "Solicit anularea somației din 25.09.2025 și a actelor subsecvente, suspendarea executării silite până la soluționarea contestației și obligarea intimatei la cheltuieli de judecată.",
                "În fapt, debitul urmărit include penalități calculate după închiderea contractului și sume deja achitate prin ordinul de plată nr. 771/18.08.2025. Contestatorul nu a primit înștiințarea prealabilă privind declararea scadenței anticipate.",
                "În drept, invoc dispozițiile Codului de procedură civilă privind contestația la executare și suspendarea executării.",
                "Probe: contract leasing, somație, extras cont, ordine de plată, corespondență cu creditorul și dosarul execuțional certificat.",
                "Data: 09.10.2025. Av. Andrei Popescu."
            ]),
        Document(
            "d6666666-6666-6666-6666-666666666602",
            "Dovada_plăți_executare.docx",
            DocumentType.Probe,
            "c5555555-5555-5555-5555-555555555501",
            "12984/211/2025",
            UtcDateTime(2025, 10, 9, 9, 5),
            "Centralizator plăți executare",
            [
                "Centralizator plăți - Cristian Dobre / BT Leasing Transilvania IFN SA",
                "Ordin de plată nr. 662/14.07.2025 - 4.200 lei.",
                "Ordin de plată nr. 717/02.08.2025 - 3.900 lei.",
                "Ordin de plată nr. 771/18.08.2025 - 6.500 lei.",
                "Total plăți efectuate după notificare: 14.600 lei.",
                "Document demo cu date fictive."
            ])
    ];

    private static DemoDocument Document(
        string id,
        string name,
        DocumentType type,
        string caseId,
        string caseNumber,
        DateTime uploadedAt,
        string title,
        string[] paragraphs) =>
        new(Guid.Parse(id), name, type, Guid.Parse(caseId), caseNumber, uploadedAt, title, paragraphs);

    private static HearingTerm Hearing(string id, string title, int year, int month, int day, int hour, int minute, string room, string note, string caseId) =>
        new()
        {
            Id = Guid.Parse(id),
            Title = title,
            Date = UtcDateTime(year, month, day, hour, minute),
            CourtRoom = room,
            Note = note,
            LegalCaseId = Guid.Parse(caseId)
        };

    private static DateTime UtcDate(int year, int month, int day) =>
        new(year, month, day, 0, 0, 0, DateTimeKind.Utc);

    private static DateTime UtcDateTime(int year, int month, int day, int hour, int minute) =>
        new(year, month, day, hour, minute, 0, DateTimeKind.Utc);

    private sealed record DemoDocument(
        Guid Id,
        string Name,
        DocumentType Type,
        Guid LegalCaseId,
        string CaseNumber,
        DateTime UploadedAt,
        string Title,
        string[] Paragraphs);

    private static class DemoDocxBuilder
    {
        public static byte[] Create(string title, IReadOnlyCollection<string> paragraphs)
        {
            using var stream = new MemoryStream();
            using (var archive = new ZipArchive(stream, ZipArchiveMode.Create, leaveOpen: true))
            {
                AddEntry(archive, "[Content_Types].xml", ContentTypesXml);
                AddEntry(archive, "_rels/.rels", PackageRelationshipsXml);
                AddEntry(archive, "word/_rels/document.xml.rels", DocumentRelationshipsXml);
                AddEntry(archive, "word/styles.xml", StylesXml);
                AddEntry(archive, "word/document.xml", BuildDocumentXml(title, paragraphs));
            }

            return stream.ToArray();
        }

        private static string BuildDocumentXml(string title, IReadOnlyCollection<string> paragraphs)
        {
            var body = new StringBuilder();
            body.Append(Paragraph(title, isTitle: true));
            body.Append(Paragraph("Document demo CasePilot - datele persoanelor sunt fictive.", isItalic: true));

            foreach (var paragraph in paragraphs)
            {
                body.Append(Paragraph(paragraph));
            }

            body.Append("""
                <w:sectPr>
                  <w:pgSz w:w="11906" w:h="16838"/>
                  <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/>
                </w:sectPr>
                """);

            return $$"""
                <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
                <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
                  <w:body>
                    {{body}}
                  </w:body>
                </w:document>
                """;
        }

        private static string Paragraph(string text, bool isTitle = false, bool isItalic = false)
        {
            var style = isTitle ? "<w:pStyle w:val=\"Title\"/>" : string.Empty;
            var italic = isItalic ? "<w:i/>" : string.Empty;
            var spacing = isTitle ? string.Empty : "<w:spacing w:after=\"160\"/>";
            var escaped = WebUtility.HtmlEncode(text);

            return $$"""
                <w:p>
                  <w:pPr>{{style}}{{spacing}}</w:pPr>
                  <w:r>
                    <w:rPr>{{italic}}</w:rPr>
                    <w:t xml:space="preserve">{{escaped}}</w:t>
                  </w:r>
                </w:p>
                """;
        }

        private static void AddEntry(ZipArchive archive, string path, string content)
        {
            var entry = archive.CreateEntry(path);
            using var writer = new StreamWriter(entry.Open(), new UTF8Encoding(false));
            writer.Write(content);
        }

        private const string ContentTypesXml = """
            <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
            <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
              <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
              <Default Extension="xml" ContentType="application/xml"/>
              <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
              <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
            </Types>
            """;

        private const string PackageRelationshipsXml = """
            <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
            <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
              <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
            </Relationships>
            """;

        private const string DocumentRelationshipsXml = """
            <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
            <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>
            """;

        private const string StylesXml = """
            <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
            <w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
              <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
                <w:name w:val="Normal"/>
                <w:rPr>
                  <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>
                  <w:sz w:val="24"/>
                </w:rPr>
              </w:style>
              <w:style w:type="paragraph" w:styleId="Title">
                <w:name w:val="Title"/>
                <w:basedOn w:val="Normal"/>
                <w:pPr>
                  <w:jc w:val="center"/>
                  <w:spacing w:after="320"/>
                </w:pPr>
                <w:rPr>
                  <w:b/>
                  <w:sz w:val="30"/>
                </w:rPr>
              </w:style>
            </w:styles>
            """;
    }
}
