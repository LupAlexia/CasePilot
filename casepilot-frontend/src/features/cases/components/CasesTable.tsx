import {
  Box,
  Divider,
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
  Tooltip,
  Typography
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

function CardField({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" spacing={1.5} justifyContent="space-between" alignItems="baseline">
      <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', fontWeight: 700, flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, textAlign: 'right', wordBreak: 'break-word' }}>
        {value}
      </Typography>
    </Stack>
  );
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

  const actions = (row: LegalCase) => (
    <>
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
    </>
  );

  return (
    <Paper sx={{ width: '100%', borderRadius: 0 }}>
      {/* ── Desktop / tablet: full table ─────────────────────────── */}
      <TableContainer sx={{ width: '100%', display: { xs: 'none', md: 'block' }, overflowX: 'auto' }}>
        <Table
          sx={{
            minWidth: { md: 860, lg: 1080, xl: 1220 },
            '& .MuiTableCell-root': {
              py: 2.2,
              px: 2.3,
              fontSize: '1rem'
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
                    {actions(row)}
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

      {/* ── Mobile: stacked cards ────────────────────────────────── */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        <Stack sx={{ p: 1.5, gap: 1.5 }}>
          {paginatedRows.length === 0 ? (
            <Typography sx={{ p: 2, color: 'text.secondary' }}>Nu există dosare.</Typography>
          ) : (
            paginatedRows.map((row) => (
              <Paper key={row.id} variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
                <Stack spacing={1.25}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                    <Typography sx={{ fontWeight: 800, fontSize: '1.02rem' }}>{row.number}</Typography>
                    <StatusChip status={row.status} />
                  </Stack>
                  <Stack spacing={0.6}>
                    <CardField label="Instanță" value={row.court} />
                    <CardField label="Obiect" value={row.object} />
                    <CardField label="Stadiu" value={row.stage} />
                  </Stack>
                  <Divider />
                  <Stack direction="row" justifyContent="flex-end" spacing={0.5}>
                    {actions(row)}
                  </Stack>
                </Stack>
              </Paper>
            ))
          )}
        </Stack>
        <Divider />
        <TablePagination
          component="div"
          count={rows.length}
          page={page}
          onPageChange={(_, newPage) => onPageChange(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(event) => onRowsPerPageChange(Number(event.target.value))}
          rowsPerPageOptions={[5, 10]}
          labelRowsPerPage="Pe pagină"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} din ${count}`}
          sx={{
            '& .MuiTablePagination-toolbar': { px: 1.5, flexWrap: 'wrap' },
            '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': { fontSize: '0.85rem' }
          }}
        />
      </Box>
    </Paper>
  );
}
