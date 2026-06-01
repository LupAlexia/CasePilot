import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { appTheme } from '../../../theme/theme';
import { CaseDetailPage } from './CaseDetailPage';
import { useCaseStore } from '../store/caseStore';
import { vi } from 'vitest';

vi.mock('../../../services/api/caseDocumentsApi', () => ({
  getCaseDocuments: vi.fn().mockResolvedValue([
    { id: 'doc1', caseId: '1', name: 'Cerere de chemare în judecată.pdf', type: 0, size: 1024, uploadedAt: new Date().toISOString() }
  ])
}));

function renderCaseDetail(path = '/app/dosare/1') {
  return render(
    <ThemeProvider theme={appTheme}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/app/dosare" element={<div>Dosare Listă</div>} />
          <Route path="/app/dosare/:caseId" element={<CaseDetailPage />} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>
  );
}

describe('CaseDetailPage', () => {
  beforeEach(() => {
    useCaseStore.getState().resetCases();
  });

  it('afișează datele dosarului și documentele implicite', async () => {
    renderCaseDetail();

    expect(screen.getByText(/informații dosar/i)).toBeInTheDocument();
    expect(screen.getByText('1234/2024')).toBeInTheDocument();
    expect(screen.getByText('2024-01-10')).toBeInTheDocument();
    expect(screen.getByText('SC ACME SRL')).toBeInTheDocument();
    expect(screen.getByText('SC BETA INDUSTRIES SRL')).toBeInTheDocument();
    expect(screen.getByText(/documente dosar/i)).toBeInTheDocument();
    expect(await screen.findByText(/cerere de chemare în judecată/i)).toBeInTheDocument();
  });

  it('comută tab-urile termene și asistent AI', async () => {
    const user = userEvent.setup();
    renderCaseDetail();

    await user.click(screen.getByRole('tab', { name: /termene/i }));
    expect(await screen.findByText(/termene de judecată/i)).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /asistent ai/i }));
    expect(await screen.findByText(/context disponibil/i)).toBeInTheDocument();
  });

  it('navighează înapoi la lista de dosare', async () => {
    const user = userEvent.setup();
    renderCaseDetail();

    await user.click(screen.getByRole('button', { name: /înapoi la dosare/i }));

    expect(screen.getByText('Dosare Listă')).toBeInTheDocument();
  });

  it('redirecționează când dosarul nu există', () => {
    renderCaseDetail('/app/dosare/inexistent');

    expect(screen.getByText('Dosare Listă')).toBeInTheDocument();
  });

  it('afișează mesajul fallback când dosarul nu are termene', async () => {
    const user = userEvent.setup();
    renderCaseDetail('/app/dosare/5');

    await user.click(screen.getByRole('tab', { name: /termene/i }));

    expect(await screen.findByText(/nu există termene înregistrate/i)).toBeInTheDocument();
  });
});
