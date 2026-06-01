import { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, IconButton, Tooltip, LinearProgress
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { getSuspiciousUsers, resolveSuspiciousUser, type SuspiciousUserEntry } from '../../../services/api/authApi';
import { useAuth } from '../../auth/AuthContext';

function severityColor(score: number): 'error' | 'warning' | 'info' {
  if (score >= 80) return 'error';
  if (score >= 50) return 'warning';
  return 'info';
}

export function AdminWatchlistPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<SuspiciousUserEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const data = await getSuspiciousUsers();
      setEntries(data);
    } catch (err) {
      console.error('Failed to load watchlist:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadData(); }, []);

  const handleResolve = async (entryId: string) => {
    if (!user) return;
    try {
      await resolveSuspiciousUser(entryId);
      await loadData();
    } catch (err) {
      console.error('Failed to resolve:', err);
    }
  };

  const unresolved = entries.filter(e => !e.isResolved);
  const resolved = entries.filter(e => e.isResolved);

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 800 }}>
        Lista de Supraveghere
      </Typography>

      {unresolved.length === 0 && !loading && (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3, mb: 3 }}>
          <Typography color="text.secondary">
            Niciun utilizator suspect detectat. ✅
          </Typography>
        </Paper>
      )}

      {unresolved.length > 0 && (
        <TableContainer component={Paper} sx={{ borderRadius: 3, mb: 4 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Utilizator</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Motiv</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Severitate</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Detectat la</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Acțiuni</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {unresolved.map((entry) => (
                <TableRow key={entry.id} hover>
                  <TableCell>{entry.userFullName}</TableCell>
                  <TableCell>{entry.userEmail}</TableCell>
                  <TableCell sx={{ maxWidth: 280 }}>{entry.reason}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={entry.severityScore}
                        color={severityColor(entry.severityScore)}
                        sx={{ width: 60, height: 8, borderRadius: 4 }}
                      />
                      <Chip
                        label={entry.severityScore}
                        size="small"
                        color={severityColor(entry.severityScore)}
                      />
                    </Box>
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    {new Date(entry.detectedAt).toLocaleString('ro-RO')}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Marchează ca rezolvat">
                      <IconButton
                        size="small"
                        color="success"
                        onClick={() => void handleResolve(entry.id)}
                      >
                        <CheckCircleOutlineIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {resolved.length > 0 && (
        <>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: 'text.secondary' }}>
            Rezolvate ({resolved.length})
          </Typography>
          <TableContainer component={Paper} sx={{ borderRadius: 3, opacity: 0.7 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Utilizator</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Motiv</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Severitate</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Rezolvat la</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {resolved.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{entry.userFullName}</TableCell>
                    <TableCell>{entry.reason}</TableCell>
                    <TableCell>
                      <Chip label={entry.severityScore} size="small" color="default" />
                    </TableCell>
                    <TableCell>
                      {entry.resolvedAt ? new Date(entry.resolvedAt).toLocaleString('ro-RO') : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
}
