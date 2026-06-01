# CasePilot Frontend

Frontend-ul aplicației CasePilot, implementat cu React, TypeScript și Vite, conform cerințelor din assignment:
- pagină de prezentare
- perspectivă master-detail pentru entitatea `Dosar`
- CRUD complet
- tabel paginat
- validare cu React Hook Form + Zod
- stocare exclusiv în RAM prin Zustand
- testare cu Vitest + React Testing Library
- testare end-to-end cu Playwright

## Stack tehnologic

- React 19 + TypeScript
- Vite
- Material UI (MUI)
- Zustand
- React Hook Form + Zod
- Recharts
- Vitest + React Testing Library
- Playwright

## Instalare și pornire locală

```bash
npm install
npm run dev
```

## Scripturi disponibile

```bash
npm run dev            # pornește aplicația în mod development
npm run build          # build de producție (TypeScript + Vite)
npm run preview        # rulează build-ul local
npm run test           # rulează testele unit/integration (Vitest)
npm run test:watch     # Vitest în watch mode
npm run test:coverage  # raport de coverage
npm run test:e2e       # rulează testele end-to-end (Playwright)
npm run test:e2e:ui    # rulează Playwright în UI mode
```

## Testare

### Unit + Integration (Vitest)

```bash
npm run test
```

### Run only auth tests
```bash
npx vitest run src/features/cases/pages/LoginPage.test.tsx src/features/cases/pages/RegisterPage.test.tsx src/features/auth/AuthContext.test.tsx src/services/api/authApi.test.ts --reporter verbose
```

### Run only auth tests with coverage
```bash
npx vitest run src/features/cases/pages/LoginPage.test.tsx src/features/cases/pages/RegisterPage.test.tsx src/features/auth/AuthContext.test.tsx src/services/api/authApi.test.ts --coverage --coverage.include="src/features/cases/pages/LoginPage.tsx" --coverage.include="src/features/cases/pages/RegisterPage.tsx" --coverage.include="src/features/auth/AuthContext.tsx" --coverage.include="src/services/api/authApi.ts"
```

### End-to-end (Playwright)

```bash
npm run test:e2e
```

Raportul Playwright poate fi deschis cu:

```bash
npx playwright show-report
```

Scenarii E2E critice acoperite:
- autentificare și navigare către dashboard
- gestionare dosare (creare, vizualizare statistici, ștergere)
- detaliu dosar (tab-uri, upload fișier local, flux Asistent AI)

## Utilizarea cookie-urilor

Aplicația include un sistem de monitorizare în browser bazat pe cookie-uri, activat prin consimțământ explicit.

### Consimțământ

- la prima accesare este afișat un banner de consimțământ
- utilizatorul poate alege `Acceptă cookie-uri` sau `Respinge`
- monitorizarea activității și preferințelor rulează doar după accept

### Ce date sunt salvate

1. Cookie de consimțământ:
- `casepilot_cookie_consent`
- valoare: `accepted` sau `rejected`

2. Cookie de activitate utilizator:
- `casepilot_activity`
- date monitorizate: prima vizită, ultima activitate, ruta curentă, număr vizualizări pagini, număr click-uri, adâncime scroll maximă

3. Cookie de preferințe utilizator:
- `casepilot_preferences`
- preferințe persistate: tab implicit în pagina Dosare (`table`/`statistics`), notificări email, reminder termene, autentificare în 2 pași

### Durată și scop

- cookie-ul de consimțământ și preferințe este păstrat până la 365 zile
- cookie-ul de activitate este păstrat până la 30 zile
- scopul este personalizarea experienței și observabilitate client-side pentru comportamentul în aplicație

### Implementare tehnică

- utilitare cookie: `src/lib/cookieStore.ts`
- serviciu monitorizare și preferințe: `src/lib/userMonitoring.ts`
- hook global de tracking browser events: `src/lib/useBrowserMonitoring.ts`
- banner UI consimțământ: `src/components/CookieConsentBanner.tsx`

## Observații arhitecturale

Structura este gândită pentru integrare ulterioară cu backend:
- `services/` poate fi înlocuit cu apeluri HTTP reale
- `store/` păstrează doar starea client-side
- `types/` și `schemas/` separă modelul domeniului de validarea formularelor

## Assignment 2 - Silver 
SignalR - comunicarea în timp real (real-time) între client și server
=> datele fake generate apar in real-time

## Offline sync 
- Operațiile CRUD pe Dosar funcționează și offline, cu stocare locală pe client și coadă de sincronizare.
- La reconectare, aplicația sincronizează automat coada cu serverul; în UI apar badge cu modificările în așteptare și toast-uri pentru statusul sincronizării.

## Server and client running on different machines on same LAN
- .env: VITE_API_BASE_URL=https://[IP_ADDRESS]/api <- ipconfig to find IPv4 address (Wireless LAN adapter WiFi)
- backend: dotnet run
- frontend: npm run dev 

