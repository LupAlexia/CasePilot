import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';
import { appTheme } from '../../../theme/theme';
import { AIAssistantPage } from './AIAssistantPage';

// Mock API dependencies so tests don't need a live server
vi.mock('../../../services/api/legalCasesApi', () => ({
  getLegalCases: vi.fn().mockResolvedValue({
    items: [
      {
        id: 'case-1',
        number: '1234/2024',
        court: 'Tribunal București',
        object: 'Litigiu contractual',
        reclamant: 'SC ACME SRL',
        parat: 'SC BETA SRL',
        stage: 'Fond',
        status: 'Activ',
        registrationDate: '2024-01-10T00:00:00',
        documents: [],
        hearings: []
      }
    ],
    page: 1,
    pageSize: 100,
    totalCount: 1,
    totalPages: 1
  })
}));

vi.mock('../../../services/api/aiApi', () => ({
  generateDocument: vi.fn().mockResolvedValue({
    content: 'Document generat de AI pentru dosarul 1234/2024.'
  })
}));

vi.mock('../../../services/api/caseDocumentsApi', () => ({
  uploadCaseDocument: vi.fn().mockResolvedValue({ id: 'doc-new', name: 'test.docx' })
}));

vi.mock('../../../lib/extractText', () => ({
  extractTextFromFile: vi.fn().mockResolvedValue('')
}));

vi.mock('../../../lib/docxGenerator', () => ({
  downloadDocx: vi.fn().mockResolvedValue(undefined),
  generateDocxBlob: vi.fn().mockResolvedValue(new Blob(['test'], { type: 'application/docx' }))
}));

function renderAssistant() {
  return render(
    <ThemeProvider theme={appTheme}>
      <MemoryRouter initialEntries={['/app/asistent-ai']}>
        <Routes>
          <Route path="/app/asistent-ai" element={<AIAssistantPage />} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>
  );
}

describe('AIAssistantPage', () => {
  it('afișează formularul de generare', async () => {
    renderAssistant();

    expect(screen.getByText(/asistent ai pentru documente/i)).toBeInTheDocument();
    expect(await screen.findByLabelText(/număr dosar/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tip document/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generează document/i })).toBeInTheDocument();
  });

  it('afișează preview-ul după generare', async () => {
    const user = userEvent.setup();
    renderAssistant();

    // Wait for cases to load — the dropdown is disabled until then
    await screen.findByLabelText(/număr dosar/i);

    // MUI Select comboboxes: first = case selector, second = document type selector
    const [dosarCombobox, tipCombobox] = screen.getAllByRole('combobox');

    await user.click(dosarCombobox);
    await user.click(screen.getByRole('option', { name: /1234\/2024/i }));

    await user.click(tipCombobox);
    await user.click(screen.getByRole('option', { name: /cerere de amânare/i }));

    await user.click(screen.getByRole('button', { name: /generează document/i }));

    expect(await screen.findByText(/date utilizate pentru generarea documentului/i)).toBeInTheDocument();
    // Use role="heading" to disambiguate from the generated text content
    expect(await screen.findByRole('heading', { name: /document generat/i })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /adaugă documentul în dosar/i })).toBeInTheDocument();
  });
});
