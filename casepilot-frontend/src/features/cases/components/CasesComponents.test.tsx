import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material';
import type { ReactElement } from 'react';
import { appTheme } from '../../../theme/theme';
import { CaseFormDialog } from './CaseFormDialog';
import { CasesTable } from './CasesTable';
import { StatusChip } from './StatusChip';
import { InfoItem } from './InfoItem';
import { initialCases } from '../data/mockCases';

function wrap(ui: ReactElement) {
  return render(<ThemeProvider theme={appTheme}>{ui}</ThemeProvider>);
}

describe('CaseFormDialog', () => {
  it('validează câmpurile obligatorii', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    wrap(<CaseFormDialog open title="Adaugă dosar" onClose={vi.fn()} onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: /salvează/i }));

    expect(screen.getByText(/numărul dosarului este obligatoriu/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('trimite date valide', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    wrap(<CaseFormDialog open title="Adaugă dosar" onClose={vi.fn()} onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Număr dosar'), '7777/2026');
    await user.type(screen.getByLabelText('Instanță'), 'Tribunalul Cluj');
    await user.type(screen.getByLabelText('Obiect'), 'Pretenții');
    await user.type(screen.getByLabelText('Reclamant'), 'SC Client SRL');
    await user.type(screen.getByLabelText('Pârât'), 'SC Debitor SRL');
    await user.click(screen.getByRole('button', { name: /salvează/i }));

    expect(onSubmit).toHaveBeenCalled();
    expect(onSubmit.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        number: '7777/2026',
        court: 'Tribunalul Cluj',
        object: 'Pretenții',
        reclamant: 'SC Client SRL',
        parat: 'SC Debitor SRL',
        stage: 'Fond',
        status: 'Activ'
      })
    );
  });

  it('închide dialogul de editare la anulare', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    wrap(
      <CaseFormDialog
        open
        title="Editează dosar"
        onClose={onClose}
        onSubmit={vi.fn()}
        initialValue={initialCases[0]}
      />
    );

    expect(screen.getByDisplayValue('1234/2024')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /anulează/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('CasesTable', () => {
  it('afișează date și apelează acțiunile', async () => {
    const user = userEvent.setup();
    const onView = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const onPageChange = vi.fn();
    const onRowsPerPageChange = vi.fn();

    const rows = [...initialCases, { ...initialCases[0], id: 'extra-row' }];

    wrap(
      <CasesTable
        rows={rows}
        page={0}
        rowsPerPage={5}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
        onView={onView}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    const row = screen.getByText('1234/2024').closest('tr');
    expect(row).not.toBeNull();

    await user.click(within(row as HTMLElement).getByRole('button', { name: /vezi detalii/i }));
    await user.click(within(row as HTMLElement).getByRole('button', { name: /editează/i }));
    await user.click(within(row as HTMLElement).getByRole('button', { name: /șterge/i }));

    const nextPageButton = screen.getByRole('button', { name: /go to next page/i });
    await user.click(nextPageButton);
    expect(onPageChange).toHaveBeenCalled();

    await user.click(screen.getByLabelText(/rânduri pe pagină/i));
    await user.click(screen.getByRole('option', { name: '10' }));
    expect(onRowsPerPageChange).toHaveBeenCalledWith(10);

    expect(onView).toHaveBeenCalled();
    expect(onEdit).toHaveBeenCalled();
    expect(onDelete).toHaveBeenCalled();
  });
});

describe('StatusChip și InfoItem', () => {
  it('randă chip pentru status și item informativ', () => {
    wrap(
      <>
        <StatusChip status="Activ" />
        <InfoItem label="Instanță" value="Tribunal" />
      </>
    );

    expect(screen.getByText('Activ')).toBeInTheDocument();
    expect(screen.getByText('Instanță')).toBeInTheDocument();
    expect(screen.getByText('Tribunal')).toBeInTheDocument();
  });
});
