import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { appTheme } from '../../../theme/theme';
import { CasesPage } from './CasesPage';
import { CaseDetailPage } from './CaseDetailPage';
import { useCaseStore } from '../store/caseStore';
import {
  createLegalCase,
  deleteLegalCase,
  getLegalCases,
  getPendingLegalCaseOperationsCount,
  subscribeToCaseSyncStatus,
  subscribeToPendingLegalCaseOperations,
  updateLegalCase
} from '../../../services/api/legalCasesApi';
import type { LegalCase as ApiLegalCase } from '../../../services/api/types';
import { initialCases } from '../data/mockCases';

vi.mock('../../../services/api/legalCasesApi', () => ({
  getLegalCases: vi.fn(),
  createLegalCase: vi.fn(),
  updateLegalCase: vi.fn(),
  deleteLegalCase: vi.fn(),
  getPendingLegalCaseOperationsCount: vi.fn(() => 0),
  subscribeToPendingLegalCaseOperations: vi.fn(() => () => {}),
  subscribeToCaseSyncStatus: vi.fn(() => () => {})
}));

vi.mock('../../../services/api/caseDocumentsApi', () => ({
  getCaseDocuments: vi.fn().mockResolvedValue([
    { id: 'doc1', caseId: '1', name: 'Cerere de chemare în judecată.pdf', type: 0, size: 1024, uploadedAt: new Date().toISOString() }
  ])
}));


let casesData: ApiLegalCase[] = initialCases as unknown as ApiLegalCase[];

function renderCasesFlow() {
  return render(
    <ThemeProvider theme={appTheme}>
      <MemoryRouter initialEntries={['/app/dosare']}>
        <Routes>
          <Route path="/app/dosare" element={<CasesPage />} />
          <Route path="/app/dosare/:caseId" element={<CaseDetailPage />} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>
  );
}

describe('CasesPage', () => {
  beforeEach(() => {
    useCaseStore.getState().resetCases();
    casesData = [...initialCases];

    vi.mocked(getLegalCases).mockImplementation(async () => ({
      items: casesData as unknown as never,
      page: 1,
      pageSize: 20,
      totalCount: casesData.length,
      totalPages: 1
    }));

    vi.mocked(createLegalCase).mockImplementation(async (payload) => {
      const created = {
        id: 'created-case-id',
        ...payload,
        documents: [],
        hearings: []
      };

      casesData = [created as never, ...casesData];
      return created as never;
    });

    vi.mocked(updateLegalCase).mockImplementation(async (id, payload) => {
      casesData = casesData.map((item) =>
        item.id === id
          ? {
              ...item,
              ...payload
            }
          : item
      );

      return casesData.find((item) => item.id === id) as never;
    });

    vi.mocked(deleteLegalCase).mockImplementation(async (id) => {
      casesData = casesData.filter((item) => item.id !== id);
    });

    vi.mocked(getPendingLegalCaseOperationsCount).mockReturnValue(0);
    vi.mocked(subscribeToPendingLegalCaseOperations).mockImplementation((listener) => {
      listener(0);
      return () => {};
    });
    vi.mocked(subscribeToCaseSyncStatus).mockImplementation(() => () => {});

  });

  it('afișează dosarele inițiale', async () => {
    renderCasesFlow();

    await screen.findByText('1234/2024');
    expect(screen.getByText('Gestionare dosare')).toBeInTheDocument();
    expect(screen.getByText('1234/2024')).toBeInTheDocument();
    expect(screen.getByText('7890/2024')).toBeInTheDocument();
  });

  it('creează un dosar nou cu validare', async () => {
    const user = userEvent.setup();
    renderCasesFlow();

    await screen.findByText('1234/2024');

    await user.click(screen.getByRole('button', { name: /adaugă dosar/i }));
    await user.click(screen.getByRole('button', { name: /salvează/i }));

    expect(screen.getByText(/numărul dosarului este obligatoriu/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText('Număr dosar'), '7777/2026');
    await user.type(screen.getByLabelText('Instanță'), 'Tribunalul Cluj');
    await user.type(screen.getByLabelText('Obiect'), 'Pretenții');
    await user.type(screen.getByLabelText('Reclamant'), 'SC Client SRL');
    await user.type(screen.getByLabelText('Pârât'), 'SC Debitor SRL');
    await user.click(screen.getByRole('button', { name: /salvează/i }));

    expect(await screen.findByText('7777/2026')).toBeInTheDocument();
  });

  it('editează un dosar existent', async () => {
    const user = userEvent.setup();
    renderCasesFlow();

    await screen.findByText('5678/2024');

    const row = screen.getByText('5678/2024').closest('tr');
    expect(row).not.toBeNull();

    const editButton = within(row as HTMLElement).getByRole('button', { name: /editează/i });
    await user.click(editButton);

    const objectField = screen.getByLabelText('Obiect');
    await user.clear(objectField);
    await user.type(objectField, 'Recuperare creanțe comerciale');
    await user.click(screen.getByRole('button', { name: /salvează/i }));

    expect(await screen.findByText('Recuperare creanțe comerciale')).toBeInTheDocument();
  });

  it('șterge un dosar', async () => {
    const user = userEvent.setup();
    renderCasesFlow();

    await screen.findByText('9012/2024');

    const row = screen.getByText('9012/2024').closest('tr');
    expect(row).not.toBeNull();

    const deleteButton = within(row as HTMLElement).getByRole('button', { name: /șterge/i });
    await user.click(deleteButton);
    await user.click(screen.getByRole('button', { name: /^șterge$/i }));

    await screen.findByText('1234/2024');
    expect(screen.queryByText('9012/2024')).not.toBeInTheDocument();
  });

  it('navighează către pagina de detaliu', async () => {
    const user = userEvent.setup();
    renderCasesFlow();

    await screen.findByText('1234/2024');

    const row = screen.getByText('1234/2024').closest('tr');
    expect(row).not.toBeNull();

    const viewButton = within(row as HTMLElement).getByRole('button', { name: /vezi detalii/i });
    await user.click(viewButton);

    expect(screen.getByText('Informații dosar')).toBeInTheDocument();
  });

  it('afișează tabul de statistici și valorile calculate', async () => {
    const user = userEvent.setup();
    renderCasesFlow();

    await screen.findByText('1234/2024');

    await user.click(screen.getByRole('tab', { name: /statistici/i }));

    expect(await screen.findByText(/statistica este calculată din datele de dosare/i)).toBeInTheDocument();
    expect(screen.queryByText('Dosare active')).not.toBeInTheDocument();
    expect(screen.queryByText('Dosare amânate')).not.toBeInTheDocument();
    expect(screen.queryByText('Dosare suspendate')).not.toBeInTheDocument();
    expect(screen.queryByText('Dosare finalizate')).not.toBeInTheDocument();
    expect(screen.getByText('Distribuția dosarelor după status')).toBeInTheDocument();
    expect(screen.getByText('Dosare pe instanță')).toBeInTheDocument();
    expect(screen.getByText('Dosare pe stadiu procesual')).toBeInTheDocument();
  });
});
