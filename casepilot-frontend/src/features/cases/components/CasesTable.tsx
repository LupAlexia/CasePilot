import {
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip
} from '@mui/material';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import type { LegalCase } from '../types/case';
import { StatusChip } from './StatusChip';

interface CasesTableProps {
  rows: LegalCase[];
  page: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
  onView: (row: LegalCase) => void;
  onEdit: (row: LegalCase) => void;
  onDelete: (row: LegalCase) => void;
}

export function CasesTable({
  rows,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  onView,
  onEdit,
  onDelete
}: CasesTableProps) {
  const paginatedRows = rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <TableContainer
      component={Paper}
      sx={{
        width: '100%',
        borderRadius: 0,
        overflowX: 'auto'
      }}
    >
      <Table
        sx={{
          minWidth: { xs: 860, lg: 1080, xl: 1220 },
          '& .MuiTableCell-root': {
            py: { xs: 1.8, md: 2.2 },
            px: { xs: 1.8, md: 2.3 },
            fontSize: { xs: '0.94rem', md: '1rem' }
          }
        }}
      >
        <TableHead>
          <TableRow sx={{ backgroundColor: '#eef2f8' }}>
            <TableCell>Număr dosar</TableCell>
            <TableCell>Instanță</TableCell>
            <TableCell>Obiect</TableCell>
            <TableCell>Stadiu procesual</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Acțiuni</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {paginatedRows.map((row) => (
            <TableRow
              key={row.id}
              hover
              sx={{
                '&:nth-of-type(even)': {
                  backgroundColor: 'rgba(245, 248, 253, 0.65)'
                }
              }}
            >
              <TableCell>{row.number}</TableCell>
              <TableCell>{row.court}</TableCell>
              <TableCell>{row.object}</TableCell>
              <TableCell>{row.stage}</TableCell>
              <TableCell>
                <StatusChip status={row.status} />
              </TableCell>
              <TableCell align="right">
                <Stack direction="row" justifyContent="flex-end" spacing={1}>
                  <Tooltip title="Vezi detalii">
                    <IconButton aria-label="Vezi detalii" color="primary" onClick={() => onView(row)} sx={{ width: 38, height: 38 }}>
                      <VisibilityOutlinedIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Editează">
                    <IconButton aria-label="Editează" color="primary" onClick={() => onEdit(row)} sx={{ width: 38, height: 38 }}>
                      <EditOutlinedIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Șterge">
                    <IconButton aria-label="Șterge" color="error" onClick={() => onDelete(row)} sx={{ width: 38, height: 38 }}>
                      <DeleteOutlineOutlinedIcon />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TablePagination
              count={rows.length}
              page={page}
              onPageChange={(_, newPage) => onPageChange(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(event) => onRowsPerPageChange(Number(event.target.value))}
              rowsPerPageOptions={[5, 10]}
              labelRowsPerPage="Rânduri pe pagină"
              labelDisplayedRows={({ from, to, count }) => `Afișare ${from}-${to} din ${count} dosare`}
              sx={{
                '& .MuiTablePagination-toolbar': {
                  minHeight: 70,
                  px: { xs: 1.5, md: 2.5 }
                },
                '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                  fontSize: { xs: '0.9rem', md: '0.97rem' }
                }
              }}
            />
          </TableRow>
        </TableFooter>
      </Table>
    </TableContainer>
  );
}
