import { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip
} from '@mui/material';
import { getAuditLogs, type AuditLogEntry } from '../../../services/api/authApi';

const actionColors: Record<string, 'success' | 'info' | 'warning' | 'error' | 'default'> = {
  LOGIN: 'success',
  LOGIN_FAILED: 'error',
  REGISTER: 'info',
  CREATE: 'success',
  UPDATE: 'warning',
  DELETE: 'error',
  VIEW: 'default',
};

export function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getAuditLogs(1, 100);
        setLogs(data);
      } catch (err) {
        console.error('Failed to load audit logs:', err);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 800 }}>
        Jurnal de Audit
      </Typography>

      <TableContainer component={Paper} sx={{ borderRadius: 3, maxHeight: 600 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Timestamp</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Utilizator</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Rol</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Acțiune</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Entitate</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Detalii</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>IP</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">Se încarcă...</TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">Niciun log înregistrat.</TableCell>
              </TableRow>
            ) : logs.map((log) => (
              <TableRow key={log.id} hover>
                <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                  {new Date(log.timestamp).toLocaleString('ro-RO')}
                </TableCell>
                <TableCell sx={{ fontSize: '0.85rem' }}>{log.userEmail || '—'}</TableCell>
                <TableCell>
                  <Chip label={log.userRole} size="small" color={log.userRole === 'Admin' ? 'error' : 'primary'} />
                </TableCell>
                <TableCell>
                  <Chip
                    label={log.action}
                    size="small"
                    color={actionColors[log.action] ?? 'default'}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell sx={{ fontSize: '0.85rem' }}>
                  {log.entityType}{log.entityId ? ` #${log.entityId.substring(0, 8)}` : ''}
                </TableCell>
                <TableCell sx={{ fontSize: '0.8rem', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {log.details || '—'}
                </TableCell>
                <TableCell sx={{ fontSize: '0.8rem' }}>{log.ipAddress || '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
