import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { appTheme } from '../../../theme/theme';
import { DashboardHome } from './DashboardHome';
import { getCaseStatistics } from '../../../services/api/legalCasesApi';
import { getRecentDocuments, getRecentActivity } from '../../../services/api/caseDocumentsApi';
import { getHearings } from '../../../services/api/hearingsApi';
import { vi } from 'vitest';

vi.mock('../../../services/api/legalCasesApi', () => ({
  getCaseStatistics: vi.fn()
}));

vi.mock('../../../services/api/caseDocumentsApi', () => ({
  getRecentDocuments: vi.fn(),
  getRecentActivity: vi.fn()
}));

vi.mock('../../../services/api/hearingsApi', () => ({
  getHearings: vi.fn()
}));

function renderDashboard() {
  return render(
    <ThemeProvider theme={appTheme}>
      <MemoryRouter initialEntries={['/app/dashboard']}>
        <Routes>
          <Route path="/app/dashboard" element={<DashboardHome />} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>
  );
}

describe('DashboardHome', () => {
  beforeEach(() => {
    vi.mocked(getCaseStatistics).mockResolvedValue({
      totalCases: 5,
      activeCases: 3,
      postponedCases: 1,
      suspendedCases: 0,
      finalizedCases: 1,
      casesWithUpcomingHearings: 2,
      casesPerCourt: {
        'Tribunalul București': 2,
        'Judecătoria Sector 1': 1
      }
    });
    vi.mocked(getRecentDocuments).mockResolvedValue([
      { id: '1', caseId: '1', fileName: 'Document generat AI.pdf', contentType: 'application/pdf', size: 1024, uploadDate: new Date().toISOString(), aiGenerated: true }
    ] as any);
    vi.mocked(getRecentActivity).mockResolvedValue([
      { id: '1', caseId: '1', caseNumber: '1234/2024', documentName: 'Cerere', action: 'Dosar nou adăugat', date: new Date().toISOString() },
      { id: '2', caseId: '1', caseNumber: '1234/2024', documentName: 'Document generat AI', action: 'Document generat AI', date: new Date().toISOString() }
    ] as any);
    // Return a hearing in the next 7 days so the "Termene apropiate" section renders
    const soonDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
    vi.mocked(getHearings).mockResolvedValue([
      { id: 'h1', title: 'Termen judecată', date: soonDate, courtRoom: '14', note: '', caseId: 'c1', caseNumber: '1234/2024', court: 'Tribunal București' }
    ]);
  });

  it('afișează elementele cheie din dashboard', async () => {
    renderDashboard();

    expect(await screen.findByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText(/termene în următoarele 7 zile/i)).toBeInTheDocument();
    expect(screen.getByText(/dosare active/i)).toBeInTheDocument();
    expect(screen.getByText(/documente recente/i)).toBeInTheDocument();
    expect(screen.getByText(/termene apropiate/i)).toBeInTheDocument();
    expect(screen.getByText(/activitate recentă/i)).toBeInTheDocument();
  });

  it('afișează statistica numerica corectă', async () => {
    renderDashboard();

    await screen.findByText('Dashboard');
    // activeCases = 3 → rendered once; upcoming hearings = 1 (from mock)
    expect(screen.getAllByText('3').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('în lucru')).toBeInTheDocument();
    expect(screen.getByText('în ultimele 7 zile')).toBeInTheDocument();
    expect(screen.queryByText('Total dosare')).not.toBeInTheDocument();
    expect(screen.queryByText('Cu termene viitoare')).not.toBeInTheDocument();
  });

  it('afișează intrări de termene și activitate', async () => {
    renderDashboard();

    await screen.findByText('Dashboard');
    // Hearing data is async — use findByText
    expect(await screen.findAllByText('1234/2024')).toBeTruthy();
    expect(await screen.findByText(/Tribunal București/)).toBeInTheDocument();
    expect(await screen.findByText('Dosar nou adăugat')).toBeInTheDocument();
    expect(screen.getByText('Document generat AI')).toBeInTheDocument();
  });
});
