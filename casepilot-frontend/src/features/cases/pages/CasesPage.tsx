import { type SyntheticEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  Typography
} from '@mui/material';
import type { AlertColor } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { motion, useReducedMotion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { CasesTable } from '../components/CasesTable';
import { CaseFormDialog } from '../components/CaseFormDialog';
import { useCaseStore } from '../store/caseStore';
import type { LegalCase } from '../types/case';
import type { CaseFormValues } from '../schemas/caseSchema';
import {
  createLegalCase,
  deleteLegalCase,
  getPendingLegalCaseOperationsCount,
  getLegalCases,
  subscribeToCaseSyncStatus,
  subscribeToPendingLegalCaseOperations,
  updateLegalCase
} from '../../../services/api/legalCasesApi';
import type { LegalCaseInput } from '../../../services/api/types';
import type { LegalCase as ApiLegalCase } from '../../../services/api/types';
import { getPreferences, setPreference } from '../../../lib/userMonitoring';
import { staggerContainer, fadeInUp, cardReveal, slideInLeft, hoverLift } from '../../../lib/animations';
import { formatDateOnly } from '../../../lib/date';

function normalizeApiCase(legalCase: ApiLegalCase): LegalCase {
  return {
    ...legalCase,
    registrationDate: formatDateOnly(legalCase.registrationDate),
    stage: legalCase.stage as LegalCase['stage'],
    status: legalCase.status as LegalCase['status'],
    documents: legalCase.documents.map((document) => ({
      ...document,
      uploadedAt: formatDateOnly(document.uploadedAt),
      type: document.type as LegalCase['documents'][number]['type']
    })),
    hearings: legalCase.hearings.map((hearing) => ({
      ...hearing,
      date: formatDateOnly(hearing.date)
    }))
  };
}

export function CasesPage() {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const { cases, setCases } = useCaseStore();
  const [activeTab, setActiveTab] = useState(() => (getPreferences().casesDefaultView === 'statistics' ? 1 : 0));
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<LegalCase | null>(null);
  const [deletingCase, setDeletingCase] = useState<LegalCase | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pendingOpsCount, setPendingOpsCount] = useState(() => getPendingLegalCaseOperationsCount());
  const [syncToast, setSyncToast] = useState<{ open: boolean; message: string; severity: AlertColor }>({
    open: false,
    message: '',
    severity: 'info'
  });

  const loadCases = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError(null);

      const result = await getLegalCases(1, 100);

      setCases(result.items.map(normalizeApiCase));
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'A apărut o eroare la încărcarea dosarelor.');
    } finally {
      setIsLoading(false);
    }
  }, [setCases]);

  useEffect(() => {
    let isActive = true;

    void loadCases().finally(() => {
      if (!isActive) return;
    });

    return () => {
      isActive = false;
    };
  }, [loadCases]);

  useEffect(() => {
  const unsubscribePending = subscribeToPendingLegalCaseOperations((count) => {
    setPendingOpsCount(count);
  });

  const unsubscribeSync = subscribeToCaseSyncStatus((status) => {
    if (status === 'syncing') {
      setSyncToast({
        open: true,
        message: 'Sincronizare în curs a modificărilor offline...',
        severity: 'info'
      });
      return;
    }

    if (status === 'success') {
      setSyncToast({
        open: true,
        message: 'Sincronizarea modificărilor offline s-a finalizat.',
        severity: 'success'
      });
      return;
    }

    setSyncToast({
      open: true,
      message: 'Sincronizarea a eșuat. Se va reîncerca la reconectare.',
      severity: 'error'
    });
  });

  return () => {
    unsubscribePending();
    unsubscribeSync();
  };
}, []);

  const handleTabChange = (_: SyntheticEvent, value: number) => {
    setActiveTab(value);
    setPreference('casesDefaultView', value === 1 ? 'statistics' : 'table');
  };

  const statusCounts = useMemo(() => {
    return cases.reduce<Record<string, number>>((acc, currentCase) => {
      const key = String(currentCase.status);
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
  }, [cases]);

  const stageChartData = useMemo(() => {
    const counts = cases.reduce<Record<string, number>>((acc, currentCase) => {
      const key = String(currentCase.stage);
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [cases]);

  const statusChartData = useMemo(() => {
    return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  }, [statusCounts]);

  const courtChartData = useMemo(() => {
    const counts = cases.reduce<Record<string, number>>((acc, currentCase) => {
      const key = currentCase.court;
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [cases]);

  const statusColors = ['#1f4e8c', '#b5852d', '#999999', '#5d8f6a', '#7f6ea8'];

  const handleCreate = async (values: CaseFormValues) => {
    try {
      await createLegalCase(values as LegalCaseInput);
      await loadCases();
      setCreateOpen(false);
      setPage(0);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'A apărut o eroare la creare.');
    }
  };

  const handleUpdate = async (values: CaseFormValues) => {
    if (!editingCase) return;

    try {
      await updateLegalCase(editingCase.id, values as LegalCaseInput);
      await loadCases();
      setEditingCase(null);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'A apărut o eroare la actualizare.');
    }
  };

  const handleDelete = async () => {
    if (!deletingCase) return;

    try {
      await deleteLegalCase(deletingCase.id);
      await loadCases();
      setDeletingCase(null);
      setPage(0);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'A apărut o eroare la ștergere.');
    }
  };

  if (isLoading) {
    return (
      <Stack spacing={3.5}>
        <Paper sx={{ p: 3.5 }}>
          <Typography variant="h2">Gestionare dosare</Typography>
          <Typography color="text.secondary" sx={{ mt: 1.5 }}>
            Se încarcă dosarele...
          </Typography>
        </Paper>
      </Stack>
    );
  }

  if (loadError) {
    return (
      <Stack spacing={3.5}>
        <Alert severity="error">{loadError}</Alert>
      </Stack>
    );
  }

  return (
    <Stack
      component={motion.div}
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      spacing={3.5}
    >
      <Paper
        component={motion.div}
        variants={slideInLeft}
        sx={{
          p: { xs: 2.5, md: 3.5 },
          borderRadius: 0,
          textAlign: 'left',
          borderLeft: '6px solid',
          borderLeftColor: 'primary.main',
          background: 'linear-gradient(100deg, rgba(247,250,255,0.98) 0%, rgba(255,255,255,0.98) 72%)',
          boxShadow: '0 10px 28px rgba(21, 47, 76, 0.07)'
        }}
      >
        <Stack spacing={1}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'flex-start', sm: 'center' }}>
            <Typography variant="h2">Gestionare dosare</Typography>
            {pendingOpsCount > 0 ? (
              <Chip
                color="warning"
                size="small"
                label={`${pendingOpsCount} modificări în așteptare`}
                sx={{ fontWeight: 700 }}
              />
            ) : null}
          </Stack>
          <Typography color="text.secondary" sx={{ maxWidth: 860, lineHeight: 1.65, fontSize: { xs: '1rem', md: '1.08rem' } }}>
            Administrează dosarele, urmărește statusul procedural și păstrează toate datele importante într-un flux clar.
          </Typography>
        </Stack>
      </Paper>

      <Paper component={motion.div} variants={fadeInUp} sx={{ p: 1 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab icon={<TableChartOutlinedIcon fontSize="small" />} iconPosition="start" label="Tabel dosare" />
          <Tab icon={<BarChartOutlinedIcon fontSize="small" />} iconPosition="start" label="Statistici" />
        </Tabs>
      </Paper>

      <AnimatePresence mode="wait">
        {activeTab === 0 ? (
          <Stack
            component={motion.div}
            key="table-view"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            spacing={3}
          >
            <Box sx={{ display: 'flex', justifyContent: { xs: 'center', md: 'flex-end' } }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <Button
                  component={motion.button}
                  whileHover={shouldReduceMotion ? undefined : { scale: 1.03, y: -2 }}
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                  startIcon={<AddIcon />}
                  variant="contained"
                  onClick={() => setCreateOpen(true)}
                  sx={{
                    px: 3.6,
                    py: 1.2,
                    minHeight: 52,
                    fontSize: '0.99rem',
                    fontWeight: 800,
                    color: '#fefeff',
                    background: 'linear-gradient(135deg, #1a4b86 0%, #2b67b1 100%)',
                    boxShadow: '0 11px 24px rgba(27, 74, 131, 0.3)',
                    border: '1px solid rgba(17, 54, 99, 0.35)',
                    transition: 'transform 180ms ease, box-shadow 220ms ease, filter 220ms ease',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #19457c 0%, #2a5ea5 100%)',
                      boxShadow: '0 15px 28px rgba(27, 74, 131, 0.38)',
                      filter: 'saturate(1.06)'
                    }
                  }}
                >
                  Adaugă dosar
                </Button>
              </Stack>
            </Box>

            <Box
              component={motion.div}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.15 }}
              sx={{ width: '100%' }}
            >
              <CasesTable
                rows={cases}
                page={page}
                rowsPerPage={rowsPerPage}
                onPageChange={setPage}
                onRowsPerPageChange={(value) => {
                  setRowsPerPage(value);
                  setPage(0);
                }}
                onView={(row) => navigate(`/app/dosare/${row.id}`)}
                onEdit={(row) => setEditingCase(row)}
                onDelete={(row) => setDeletingCase(row)}
              />
            </Box>
          </Stack>
        ) : (
          <Stack
            component={motion.div}
            key="stats-view"
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: -12 }}
            variants={staggerContainer}
            spacing={4}
          >
            <Box component={motion.div} variants={fadeInUp}>
              <Alert severity="info">Statistica este calculată din datele de dosare încărcate în aplicație.</Alert>
            </Box>

            {/* Charts Grid */}
            <Box
              component={motion.div}
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' },
                gap: 3
              }}
            >
              {/* Chart 1 - Pie Chart: Distribution by Status */}
              <Paper
                component={motion.div}
                variants={cardReveal}
                sx={{
                  p: 3,
                  borderRadius: 1.5,
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                  Distribuția dosarelor după status
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry: { name?: string; percent?: number }) => `${entry.name} ${((entry.percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusChartData.map((item, index) => (
                        <Cell key={item.name} fill={statusColors[index % statusColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Paper>

              {/* Chart 2 - Bar Chart: Cases by Court */}
              <Paper
                component={motion.div}
                variants={cardReveal}
                sx={{
                  p: 3,
                  borderRadius: 1.5,
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                  Dosare pe instanță
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={courtChartData}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#1f4e8c" name="Număr dosare" />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>

              {/* Chart 3 - Bar Chart: Cases by Stage */}
              <Paper
                component={motion.div}
                variants={cardReveal}
                sx={{
                  p: 3,
                  borderRadius: 1.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  gridColumn: { xs: '1', lg: '1 / -1' }
                }}
              >
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                  Dosare pe stadiu procesual
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={stageChartData}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#b5852d" name="Număr dosare" />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Box>
          </Stack>
        )}
      </AnimatePresence>

      <CaseFormDialog open={createOpen} title="Adaugă dosar" onClose={() => setCreateOpen(false)} onSubmit={handleCreate} />

      <CaseFormDialog
        open={!!editingCase}
        title="Editează dosar"
        initialValue={editingCase ?? undefined}
        onClose={() => setEditingCase(null)}
        onSubmit={handleUpdate}
      />

      <Dialog open={!!deletingCase} onClose={() => setDeletingCase(null)}>
        <DialogTitle>Ștergere dosar</DialogTitle>
        <DialogContent>
          Confirmi ștergerea dosarului <strong>{deletingCase?.number}</strong>?
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button color="inherit" onClick={() => setDeletingCase(null)}>
            Renunță
          </Button>
          <Button color="error" variant="contained" onClick={handleDelete}>
            Șterge
          </Button>
        </DialogActions>
      </Dialog>

    <Snackbar
      open={syncToast.open}
      autoHideDuration={3200}
      onClose={() => setSyncToast((previous) => ({ ...previous, open: false }))}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert
        elevation={8}
        variant="filled"
        severity={syncToast.severity}
        sx={{
          minWidth: 340,
          borderRadius: 1.5,
          color: '#ffffff',
          fontWeight: 700,
          boxShadow: '0 12px 28px rgba(15, 23, 42, 0.28)',
          backgroundColor:
            '#166534',
          '& .MuiAlert-message': {
            color: '#ffffff',
            fontWeight: 700
          },
          '& .MuiAlert-icon': {
            color: '#ffffff',
            opacity: 0.95
          },
          '& .MuiAlert-action .MuiIconButton-root': {
            color: '#ffffff'
          },
          '&.MuiAlert-filledSuccess': {
            backgroundColor: '#166534'
          },
          '&.MuiAlert-filledWarning': {
            backgroundColor: '#b45309'
          },
          '&.MuiAlert-filledError': {
            backgroundColor: '#b91c1c'
          },
          '&.MuiAlert-filledInfo': {
            backgroundColor: '#1d4ed8'
          }
        }}
        onClose={() => setSyncToast((previous) => ({ ...previous, open: false }))}
      >
        {syncToast.message}
      </Alert>
    </Snackbar>
    </Stack>
  );
}
