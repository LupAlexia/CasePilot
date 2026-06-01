import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography
} from '@mui/material';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

import { InfoItem } from '../components/InfoItem';
import { StatusChip } from '../components/StatusChip';
import { useCaseStore } from '../store/caseStore';
import {
  cardReveal,
  fadeInUp,
  slideInLeft,
  staggerContainer
} from '../../../lib/animations';
import { formatDateOnly } from '../../../lib/date';
import {
  downloadCaseDocument,
  deleteCaseDocument,
  getCaseDocuments,
  updateCaseDocument,
  uploadCaseDocument
} from '../../../services/api/caseDocumentsApi';
import { generateDocument, summarizeDocument } from '../../../services/api/aiApi';
import { createHearingTerm, updateHearingTerm, deleteHearingTerm, type HearingTermInput } from '../../../services/api/hearingTermsApi';
import { getLegalCaseById } from '../../../services/api/legalCasesApi';
import { extractTextFromFile } from '../../../lib/extractText';
import { downloadDocx } from '../../../lib/docxGenerator';
import type { CaseDocument, ApiCaseDocument, HearingTerm } from '../../../services/api/types';

function normalizeDocumentType(type: number | string): string {
  if (typeof type === 'number') {
    switch (type) {
      case 0:
        return 'Cerere';
      case 1:
        return 'Întâmpinare';
      case 2:
        return 'Probe';
      case 3:
        return 'Hotărâre';
      case 4:
        return 'Altele';
      default:
        return 'Necunoscut';
    }
  }

  switch (type.toLowerCase()) {
    case 'cerere':
      return 'Cerere';
    case 'intampinare':
    case 'întâmpinare':
      return 'Întâmpinare';
    case 'probe':
      return 'Probe';
    case 'hotarare':
    case 'hotărâre':
      return 'Hotărâre';
    case 'altele':
      return 'Altele';
    default:
      return 'Necunoscut';
  }
}

function normalizeApiDocument(document: ApiCaseDocument): CaseDocument {
  return {
    ...document,
    uploadedAt: formatDateOnly(document.uploadedAt),
    type: normalizeDocumentType(document.type)
  };
}

export function CaseDetailPage() {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const { caseId } = useParams();

  const [activeTab, setActiveTab] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const templateInputRef = useRef<HTMLInputElement>(null);

  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [documentsError, setDocumentsError] = useState('');

  const [selectedDocument, setSelectedDocument] = useState('');
  const [showSummary, setShowSummary] = useState(false);

  const [aiDocumentType, setAiDocumentType] = useState('');
  const [aiAdditionalData, setAiAdditionalData] = useState('');
  const [showAiPreview, setShowAiPreview] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<File | null>(null);
  const [aiTemplateText, setAiTemplateText] = useState('');

  // AI generate state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');

  // AI summarize state
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryContent, setSummaryContent] = useState('');
  const [summaryError, setSummaryError] = useState('');

  // AI save-to-case state
  const [isSavingGenerated, setIsSavingGenerated] = useState(false);
  const [generatedSaved, setGeneratedSaved] = useState(false);

  const [editDocument, setEditDocument] = useState<CaseDocument | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState(0);

  const [uploadType, setUploadType] = useState(0);

  // ── Hearing CRUD state ───────────────────────────────────────
  const [hearings, setHearings] = useState<HearingTerm[]>([]);
  const [hearingDialogOpen, setHearingDialogOpen] = useState(false);
  const [editHearing, setEditHearing] = useState<HearingTerm | null>(null);
  const [hearingTitle, setHearingTitle] = useState('');
  const [hearingDate, setHearingDate] = useState('');
  const [hearingCourtRoom, setHearingCourtRoom] = useState('');
  const [hearingNote, setHearingNote] = useState('');
  const [hearingError, setHearingError] = useState('');
  const [isSavingHearing, setIsSavingHearing] = useState(false);

  const getCaseById = useCaseStore((state) => state.getCaseById);
  const legalCase = useMemo(
    () => (caseId ? getCaseById(caseId) : undefined),
    [caseId, getCaseById]
  );

  // Sync hearings from the case object in the store
  const setCases = useCaseStore((state) => state.setCases);
  const allCases = useCaseStore((state) => state.cases);

  useEffect(() => {
    if (legalCase) setHearings(legalCase.hearings ?? []);
  }, [legalCase]);

  const refreshCase = async () => {
    if (!caseId) return;
    try {
      const updated = await getLegalCaseById(caseId);
      setCases(allCases.map(c => c.id === updated.id ? {
        ...c,
        hearings: updated.hearings ?? []
      } : c));
      setHearings(updated.hearings ?? []);
    } catch { /* silently ignore — stale data is acceptable */ }
  };

  // Hearing dialog helpers
  const openHearingDialog = (hearing?: HearingTerm) => {
    if (hearing) {
      setEditHearing(hearing);
      setHearingTitle(hearing.title);
      // datetime-local input expects "YYYY-MM-DDTHH:MM"
      const d = new Date(hearing.date);
      const pad = (n: number) => String(n).padStart(2, '0');
      setHearingDate(
        `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
      );
      setHearingCourtRoom(hearing.courtRoom);
      setHearingNote(hearing.note);
    } else {
      setEditHearing(null);
      setHearingTitle('');
      setHearingDate('');
      setHearingCourtRoom('');
      setHearingNote('');
    }
    setHearingError('');
    setHearingDialogOpen(true);
  };

  const closeHearingDialog = () => {
    setHearingDialogOpen(false);
    setEditHearing(null);
    setHearingError('');
  };

  const handleSaveHearing = async () => {
    if (!caseId || !hearingTitle.trim() || !hearingDate) {
      setHearingError('Titlul și data sunt obligatorii.');
      return;
    }
    setIsSavingHearing(true);
    setHearingError('');
    try {
      const payload: HearingTermInput = {
        title: hearingTitle.trim(),
        date: new Date(hearingDate).toISOString(),
        courtRoom: hearingCourtRoom.trim(),
        note: hearingNote.trim()
      };
      if (editHearing) {
        await updateHearingTerm(caseId, editHearing.id, payload);
      } else {
        await createHearingTerm(caseId, payload);
      }
      closeHearingDialog();
      await refreshCase();
    } catch (err) {
      setHearingError(err instanceof Error ? err.message : 'Eroare la salvarea termenului.');
    } finally {
      setIsSavingHearing(false);
    }
  };

  const handleDeleteHearing = async (hearingId: string) => {
    if (!caseId) return;
    try {
      await deleteHearingTerm(caseId, hearingId);
      await refreshCase();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    async function loadDocuments() {
      if (!caseId) return;

      try {
        setIsLoadingDocuments(true);
        setDocumentsError('');

        const docs = await getCaseDocuments(caseId);
        setDocuments(docs.map(normalizeApiDocument));
      } catch (error) {
        console.error(error);
        setDocumentsError('Documentele nu au putut fi încărcate.');
      } finally {
        setIsLoadingDocuments(false);
      }
    }

    loadDocuments();
  }, [caseId]);

  const refreshDocuments = async () => {
    if (!caseId) return;

    const docs = await getCaseDocuments(caseId);
    setDocuments(docs.map(normalizeApiDocument));
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !caseId) return;

    try {
      setDocumentsError('');
      // Extract text for AI (best-effort, never blocks upload)
      const textContent = await extractTextFromFile(file);
      await uploadCaseDocument(caseId, {
        name: file.name,
        type: uploadType,
        file,
        textContent: textContent || undefined
      });
      await refreshDocuments();
    } catch (error) {
      console.error(error);
      setDocumentsError(
        error instanceof Error ? error.message : 'Documentul nu a putut fi adăugat.'
      );
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!caseId) return;

    try {
      setDocumentsError('');
      await deleteCaseDocument(caseId, documentId);
      await refreshDocuments();
    } catch (error) {
      console.error(error);
      setDocumentsError('Documentul nu a putut fi șters.');
    }
  };

  const handleEdit = (doc: CaseDocument) => {
    setEditDocument(doc);
    setEditName(doc.name);
    setEditType(Number(doc.type));
  };

  const handleCloseEditDialog = () => {
    setEditDocument(null);
    setEditName('');
    setEditType(0);
  };

  const handleSaveEdit = async () => {
    if (!caseId || !editDocument) return;

    try {
      setDocumentsError('');

      await updateCaseDocument(caseId, editDocument.id, {
        name: editName.trim(),
        type: editType
      });

      await refreshDocuments();
      handleCloseEditDialog();
    } catch (error) {
      console.error(error);
      setDocumentsError('Documentul nu a putut fi actualizat.');
    }
  };

  if (!legalCase) {
    return <Navigate to="/app/dosare" replace />;
  }

  return (
    <Stack
      component={motion.div}
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      spacing={3}
    >
      <Button
        component={motion.button}
        variants={fadeInUp}
        startIcon={<ArrowBackIcon />}
        variant="text"
        sx={{ alignSelf: 'flex-start' }}
        onClick={() => navigate('/app/dosare')}
      >
        Înapoi la dosare
      </Button>

      <Paper
        component={motion.div}
        variants={slideInLeft}
        sx={{
          p: { xs: 2.5, md: 3.5 },
          borderRadius: 0,
          textAlign: 'left',
          borderLeft: '6px solid',
          borderLeftColor: 'primary.main',
          background:
            'linear-gradient(100deg, rgba(247,250,255,0.98) 0%, rgba(255,255,255,0.98) 72%)',
          boxShadow: '0 10px 28px rgba(21, 47, 76, 0.07)'
        }}
      >
        <Stack spacing={4}>
          <Stack spacing={1}>
            <Typography variant="h3">Informații dosar</Typography>
            <Typography
              color="text.secondary"
              sx={{
                maxWidth: 860,
                lineHeight: 1.65,
                fontSize: { xs: '1rem', md: '1.06rem' }
              }}
            >
              Detalii complete despre dosar, documente și termene într-un format
              clar și ușor de urmărit.
            </Typography>
          </Stack>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
              gap: 4,
              rowGap: 3
            }}
          >
            <InfoItem label="Număr dosar" value={legalCase.number} />
            <InfoItem
              label="Data înregistrare"
              value={formatDateOnly(legalCase.registrationDate)}
            />
            <InfoItem label="Instanță" value={legalCase.court} />
            <InfoItem label="Obiect" value={legalCase.object} />
            <InfoItem label="Reclamant" value={legalCase.reclamant} />
            <InfoItem label="Pârât" value={legalCase.parat} />
            <InfoItem label="Stadiu procesual" value={legalCase.stage} />
            <InfoItem
              label="Status"
              value={<StatusChip status={legalCase.status} />}
            />
          </Box>
        </Stack>
      </Paper>

      <Paper component={motion.div} variants={cardReveal} sx={{ p: 0 }}>
        <Tabs
          value={activeTab}
          onChange={(_, value) => setActiveTab(value)}
          sx={{ px: 2.5, pt: 1.25 }}
        >
          <Tab
            icon={<DescriptionOutlinedIcon fontSize="small" />}
            iconPosition="start"
            label="Documente"
          />
          <Tab
            icon={<CalendarMonthOutlinedIcon fontSize="small" />}
            iconPosition="start"
            label="Termene"
          />
          <Tab
            icon={<AutoAwesomeOutlinedIcon fontSize="small" />}
            iconPosition="start"
            label="Asistent AI"
          />
        </Tabs>

        <Box sx={{ p: 3.5, pt: 3 }}>
          <AnimatePresence mode="wait">
            {activeTab === 0 ? (
              <Stack
                component={motion.div}
                key="documents-tab"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
                spacing={2.5}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: { xs: 'stretch', md: 'center' },
                    gap: 2,
                    flexWrap: 'wrap'
                  }}
                >
                  <Typography variant="h4">Documente dosar</Typography>

                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1.5}
                    alignItems={{ xs: 'stretch', sm: 'center' }}
                  >
                    <TextField
                      select
                      size="small"
                      value={uploadType}
                      onChange={(e) => setUploadType(Number(e.target.value))}
                      sx={{ minWidth: 220 }}
                      SelectProps={{ native: true }}
                    >
                      <option value={0}>Cerere</option>
                      <option value={1}>Întâmpinare</option>
                      <option value={2}>Probe</option>
                      <option value={3}>Hotărâre</option>
                      <option value={4}>Altele</option>
                    </TextField>

                    <Button
                      component={motion.button}
                      whileHover={
                        shouldReduceMotion
                          ? undefined
                          : { scale: 1.03, y: -2 }
                      }
                      whileTap={
                        shouldReduceMotion ? undefined : { scale: 0.98 }
                      }
                      variant="contained"
                      startIcon={<UploadFileOutlinedIcon />}
                      onClick={() => fileInputRef.current?.click()}
                      sx={{
                        px: 3.4,
                        py: 1.15,
                        minHeight: 50,
                        fontSize: '0.97rem',
                        fontWeight: 800,
                        color: '#fefeff',
                        background:
                          'linear-gradient(135deg, #1a4b86 0%, #2b67b1 100%)',
                        boxShadow: '0 11px 24px rgba(27, 74, 131, 0.3)',
                        border: '1px solid rgba(17, 54, 99, 0.35)',
                        transition:
                          'transform 180ms ease, box-shadow 220ms ease, filter 220ms ease',
                        '&:hover': {
                          background:
                            'linear-gradient(135deg, #19457c 0%, #2a5ea5 100%)',
                          boxShadow: '0 15px 28px rgba(27, 74, 131, 0.38)',
                          filter: 'saturate(1.06)'
                        }
                      }}
                    >
                      Încarcă document
                    </Button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      hidden
                      onChange={handleFileUpload}
                      accept=".pdf,.docx,.doc,.txt"
                    />
                  </Stack>
                </Box>

                {documentsError ? (
                  <Alert severity="error">{documentsError}</Alert>
                ) : null}

                <TableContainer
                  component={Paper}
                  variant="outlined"
                  sx={{ width: '100%', borderRadius: 0, overflowX: 'auto' }}
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
                        <TableCell>Nume document</TableCell>
                        <TableCell>Tip document</TableCell>
                        <TableCell>Dată încărcare</TableCell>
                        <TableCell align="right">Acțiuni</TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {isLoadingDocuments ? (
                        <TableRow>
                          <TableCell colSpan={4}>
                            Se încarcă documentele...
                          </TableCell>
                        </TableRow>
                      ) : documents.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4}>
                            Nu există documente înregistrate pentru acest dosar.
                          </TableCell>
                        </TableRow>
                      ) : (
                        documents.map((doc, index) => (
                          <TableRow
                            component={motion.tr}
                            key={doc.id}
                            initial={
                              shouldReduceMotion
                                ? false
                                : { opacity: 0, x: -12 }
                            }
                            animate={{ opacity: 1, x: 0 }}
                            transition={{
                              duration: 0.3,
                              delay: shouldReduceMotion ? 0 : index * 0.06
                            }}
                            hover
                            sx={{
                              '&:nth-of-type(even)': {
                                backgroundColor: 'rgba(245, 248, 253, 0.65)'
                              }
                            }}
                          >
                            <TableCell>{doc.name}</TableCell>
                            <TableCell>
                              {doc.type}
                            </TableCell>
                            <TableCell>
                              {formatDateOnly(doc.uploadedAt)}
                            </TableCell>
                            <TableCell align="right">
                              <Stack
                                direction="row"
                                justifyContent="flex-end"
                                spacing={1}
                              >
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<FileDownloadOutlinedIcon />}
                                  disabled={!(doc.sizeBytes && doc.sizeBytes > 0)}
                                  onClick={() => {
                                    if (caseId && doc.sizeBytes && doc.sizeBytes > 0) {
                                      downloadCaseDocument(caseId, doc.id, doc.name).catch(
                                        console.error
                                      );
                                    }
                                  }}
                                  sx={{ minHeight: 34, px: 1.55 }}
                                >
                                  Descarcă
                                </Button>

                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<EditOutlinedIcon />}
                                  onClick={() => handleEdit(doc)}
                                  sx={{ minHeight: 34, px: 1.55 }}
                                >
                                  Editează
                                </Button>

                                <Button
                                  size="small"
                                  color="error"
                                  variant="outlined"
                                  startIcon={<DeleteOutlineOutlinedIcon />}
                                  onClick={() => handleDelete(doc.id)}
                                  sx={{ minHeight: 34, px: 1.55 }}
                                >
                                  Șterge
                                </Button>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

              </Stack>
            ) : null}

            {activeTab === 1 ? (
              <Stack
                component={motion.div}
                key="hearings-tab"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
                spacing={2.5}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
                  <Typography variant="h4">Termene de judecată</Typography>
                  <Button
                    variant="contained"
                    startIcon={<UploadFileOutlinedIcon />}
                    onClick={() => openHearingDialog()}
                    sx={{
                      px: 2.8, py: 1.1, fontWeight: 700,
                      background: 'linear-gradient(135deg, #1a4b86 0%, #2b67b1 100%)',
                      color: '#fefeff',
                      boxShadow: '0 8px 20px rgba(27,74,131,0.25)'
                    }}
                  >
                    Adaugă termen
                  </Button>
                </Box>

                <TableContainer
                  component={Paper}
                  variant="outlined"
                  sx={{ width: '100%', borderRadius: 0, overflowX: 'auto' }}
                >
                  <Table
                    sx={{
                      minWidth: { xs: 760, lg: 980, xl: 1100 },
                      '& .MuiTableCell-root': {
                        py: { xs: 1.75, md: 2.1 },
                        px: { xs: 1.7, md: 2.2 },
                        fontSize: { xs: '0.93rem', md: '0.99rem' }
                      }
                    }}
                  >
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#eef2f8' }}>
                        <TableCell>Denumire</TableCell>
                        <TableCell>Dată</TableCell>
                        <TableCell>Sala</TableCell>
                        <TableCell>Notă</TableCell>
                        <TableCell align="right">Acțiuni</TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {hearings.length ? (
                        hearings.map((hearing, index) => (
                          <TableRow
                            component={motion.tr}
                            key={hearing.id}
                            initial={shouldReduceMotion ? false : { opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: shouldReduceMotion ? 0 : index * 0.06 }}
                            hover
                            sx={{ '&:nth-of-type(even)': { backgroundColor: 'rgba(245, 248, 253, 0.65)' } }}
                          >
                            <TableCell>{hearing.title}</TableCell>
                            <TableCell>{formatDateOnly(hearing.date)}</TableCell>
                            <TableCell>{hearing.courtRoom}</TableCell>
                            <TableCell>{hearing.note}</TableCell>
                            <TableCell align="right">
                              <Stack direction="row" justifyContent="flex-end" spacing={1}>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<EditOutlinedIcon />}
                                  onClick={() => openHearingDialog(hearing)}
                                  sx={{ minHeight: 34, px: 1.55 }}
                                >
                                  Editează
                                </Button>
                                <Button
                                  size="small"
                                  color="error"
                                  variant="outlined"
                                  startIcon={<DeleteOutlineOutlinedIcon />}
                                  onClick={() => handleDeleteHearing(hearing.id)}
                                  sx={{ minHeight: 34, px: 1.55 }}
                                >
                                  Șterge
                                </Button>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5}>
                            Nu există termene înregistrate pentru acest dosar.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Stack>
            ) : null}

            {activeTab === 2 ? (
              <Stack
                component={motion.div}
                key="ai-tab"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
                spacing={4}
              >
                <Paper
                  component={motion.div}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  variant="outlined"
                  sx={{ p: 3 }}
                >
                  <Stack spacing={3}>
                    <Box
                      sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}
                    >
                      <FolderOutlinedIcon
                        sx={{ fontSize: 28, color: 'secondary.main' }}
                      />
                      <Typography variant="h5" sx={{ fontWeight: 600 }}>
                        Sinteză document
                      </Typography>
                    </Box>

                    <Typography
                      color="text.secondary"
                      sx={{ fontSize: '0.95rem', lineHeight: 1.6 }}
                    >
                      Selectează un document din dosar pentru a genera o sinteză
                      a informațiilor importante.
                    </Typography>

                    <Stack spacing={2.5}>
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 500, mb: 1 }}
                        >
                          Selectează document
                        </Typography>

                        <TextField
                          select
                          fullWidth
                          value={selectedDocument}
                          onChange={(e) => setSelectedDocument(e.target.value)}
                          SelectProps={{ native: true }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              fontSize: '0.95rem'
                            }
                          }}
                        >
                          <option value="">Selectează un document</option>
                          {documents.map((doc) => (
                            <option key={doc.id} value={doc.id}>
                              {doc.name} ({doc.type})
                            </option>
                          ))}
                          {documents.length === 0 && (
                            <option disabled value="">
                              Nu sunt documente disponibile
                            </option>
                          )}
                        </TextField>
                      </Box>

                      <Button
                        component={motion.button}
                        whileHover={
                          shouldReduceMotion
                            ? undefined
                            : { scale: 1.02, y: -2 }
                        }
                        whileTap={
                          shouldReduceMotion ? undefined : { scale: 0.98 }
                        }
                        fullWidth
                        variant="contained"
                        startIcon={
                          isSummarizing ? (
                            <CircularProgress size={18} color="inherit" />
                          ) : (
                            <AutoAwesomeOutlinedIcon />
                          )
                        }
                        onClick={async () => {
                          if (!selectedDocument || !caseId) return;
                          setIsSummarizing(true);
                          setSummaryError('');
                          setSummaryContent('');
                          setShowSummary(false);
                          try {
                            const res = await summarizeDocument(caseId, selectedDocument);
                            setSummaryContent(res.summary);
                            setShowSummary(true);
                          } catch (err) {
                            setSummaryError(
                              err instanceof Error ? err.message : 'Eroare la generarea sintezei.'
                            );
                          } finally {
                            setIsSummarizing(false);
                          }
                        }}
                        disabled={!selectedDocument || isSummarizing}
                        sx={{
                          py: 1.3,
                          fontWeight: 600,
                          fontSize: '0.95rem'
                        }}
                      >
                        {isSummarizing ? 'Se generează sinteza...' : 'Generează sinteză'}
                      </Button>
                      {summaryError ? (
                        <Alert severity="error">{summaryError}</Alert>
                      ) : null}

                      <AnimatePresence>
                        {showSummary && summaryContent && (
                          <Paper
                            component={motion.div}
                            initial={{ opacity: 0, y: 16, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.4 }}
                            sx={{
                              p: 3,
                              mt: 2,
                              background:
                                'linear-gradient(135deg, rgba(247, 250, 255, 0.6) 0%, rgba(255, 255, 255, 0.9) 100%)',
                              border: '1px solid',
                              borderColor: 'divider'
                            }}
                          >
                            <Typography
                              variant="h6"
                              sx={{ fontWeight: 600, mb: 2 }}
                            >
                              Sinteză document
                            </Typography>
                            <Typography
                              sx={{
                                fontSize: '0.9rem',
                                color: 'text.secondary',
                                lineHeight: 1.75,
                                whiteSpace: 'pre-wrap'
                              }}
                            >
                              {summaryContent}
                            </Typography>
                          </Paper>
                        )}
                      </AnimatePresence>
                    </Stack>
                  </Stack>
                </Paper>

                <Divider />

                <Paper
                  component={motion.div}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  variant="outlined"
                  sx={{ p: 3 }}
                >
                  <Stack spacing={3}>
                    <Box
                      sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}
                    >
                      <AutoAwesomeOutlinedIcon
                        sx={{ fontSize: 28, color: 'primary.main' }}
                      />
                      <Typography variant="h5" sx={{ fontWeight: 600 }}>
                        Generează document pentru acest dosar
                      </Typography>
                    </Box>

                    <Typography
                      color="text.secondary"
                      sx={{ fontSize: '0.95rem', lineHeight: 1.6 }}
                    >
                      Generează automat un document juridic folosind
                      informațiile din acest dosar.
                    </Typography>

                    <Box
                      component="form"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!caseId || !aiDocumentType) return;
                        setIsGenerating(true);
                        setGenerateError('');
                        setShowAiPreview(false);
                        setGeneratedContent('');
                        setGeneratedSaved(false);
                        try {
                          const res = await generateDocument({
                            caseId,
                            documentType: aiDocumentType,
                            additionalData: aiAdditionalData,
                            templateText: aiTemplateText || undefined
                          });
                          setGeneratedContent(res.content);
                          setShowAiPreview(true);
                        } catch (err) {
                          setGenerateError(
                            err instanceof Error ? err.message : 'Eroare la generarea documentului.'
                          );
                        } finally {
                          setIsGenerating(false);
                        }
                      }}
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2.5
                      }}
                    >
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 500, mb: 1 }}
                        >
                          Tip document
                        </Typography>
                        <TextField
                          select
                          fullWidth
                          value={aiDocumentType}
                          onChange={(e) => setAiDocumentType(e.target.value)}
                          SelectProps={{ native: true }}
                          required
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              fontSize: '0.95rem'
                            }
                          }}
                        >
                          <option value="">Selectează tipul documentului</option>
                          <option value="amanare">Cerere de amânare</option>
                          <option value="probatoriu">Cerere de probatoriu</option>
                          <option value="concluzii">Concluzii scrise</option>
                          <option value="intampinare">Întâmpinare</option>
                          <option value="alt">Alt tip document</option>
                        </TextField>
                      </Box>

                      <Box>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 500, mb: 1 }}
                        >
                          Date suplimentare
                        </Typography>
                        <TextField
                          fullWidth
                          multiline
                          rows={4}
                          value={aiAdditionalData}
                          onChange={(e) => setAiAdditionalData(e.target.value)}
                          placeholder="Introdu instrucțiuni sau informații suplimentare..."
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              fontSize: '0.95rem'
                            }
                          }}
                        />
                      </Box>

                      <Box>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 500, mb: 1.5 }}
                        >
                          Șablon document (opțional)
                        </Typography>
                        <Paper
                          component={motion.div}
                          whileHover={
                            shouldReduceMotion
                              ? undefined
                              : {
                                  borderColor: 'rgba(31,78,140,0.5)',
                                  scale: 1.005
                                }
                          }
                          sx={{
                            p: 2,
                            textAlign: 'center',
                            border: '2px dashed',
                            borderColor: 'divider',
                            background: 'rgba(0, 0, 0, 0.02)',
                            cursor: 'pointer',
                            transition: 'all 220ms ease',
                            '&:hover': {
                              borderColor: 'primary.main',
                              background: 'rgba(31, 78, 140, 0.04)'
                            }
                          }}
                          onClick={() => templateInputRef.current?.click()}
                        >
                          <CloudUploadOutlinedIcon
                            sx={{
                              fontSize: 32,
                              color: 'text.secondary',
                              mb: 1
                            }}
                          />
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 500, mb: 0.5 }}
                          >
                            {selectedTemplate
                              ? selectedTemplate.name
                              : 'Încarcă un șablon'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {selectedTemplate
                              ? 'Click pentru a schimba fișierul'
                              : 'Formatul acceptat: .docx, .doc'}
                          </Typography>
                          <input
                            ref={templateInputRef}
                            type="file"
                            hidden
                            accept=".docx,.doc"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setSelectedTemplate(file);
                                const text = await extractTextFromFile(file);
                                setAiTemplateText(text);
                              }
                            }}
                          />
                        </Paper>
                      </Box>

                      {generateError ? (
                        <Alert severity="error">{generateError}</Alert>
                      ) : null}

                      <Button
                        component={motion.button}
                        whileHover={
                          shouldReduceMotion
                            ? undefined
                            : { scale: 1.02, y: -2 }
                        }
                        whileTap={
                          shouldReduceMotion ? undefined : { scale: 0.98 }
                        }
                        type="submit"
                        fullWidth
                        variant="contained"
                        startIcon={
                          isGenerating ? (
                            <CircularProgress size={18} color="inherit" />
                          ) : (
                            <AutoAwesomeOutlinedIcon />
                          )
                        }
                        disabled={isGenerating}
                        sx={{
                          py: 1.3,
                          fontWeight: 600,
                          fontSize: '0.95rem'
                        }}
                      >
                        {isGenerating ? 'Se generează...' : 'Generează document'}
                      </Button>
                    </Box>

                    <AnimatePresence>
                      {showAiPreview && generatedContent && (
                        <Paper
                          component={motion.div}
                          initial={{ opacity: 0, y: 16, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.4 }}
                          sx={{
                            p: 3,
                            mt: 2,
                            background: '#ffffff',
                            border: '1px solid',
                            borderColor: 'divider'
                          }}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              mb: 2.5,
                              flexWrap: 'wrap',
                              gap: 1
                            }}
                          >
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              Document generat
                            </Typography>
                            <Stack direction="row" spacing={1}>
                              <Button
                                variant="contained"
                                startIcon={<FileDownloadOutlinedIcon />}
                                size="small"
                                onClick={() => {
                                  const typeLabels: Record<string, string> = {
                                    amanare: 'Cerere de amânare',
                                    probatoriu: 'Cerere de probatoriu',
                                    concluzii: 'Concluzii scrise',
                                    intampinare: 'Întâmpinare',
                                    alt: 'Document juridic'
                                  };
                                  const title = typeLabels[aiDocumentType] ?? 'Document juridic';
                                  downloadDocx(
                                    title,
                                    generatedContent,
                                    `${title} - ${legalCase.number}.docx`
                                  ).catch(console.error);
                                }}
                                sx={{ fontSize: '0.85rem', py: 0.7, px: 1.8 }}
                              >
                                Descarcă DOCX
                              </Button>
                              <Button
                                variant="outlined"
                                startIcon={
                                  isSavingGenerated ? (
                                    <CircularProgress size={14} />
                                  ) : (
                                    <CheckCircleOutlinedIcon fontSize="small" />
                                  )
                                }
                                size="small"
                                disabled={isSavingGenerated || generatedSaved}
                                onClick={async () => {
                                  if (!caseId) return;
                                  setIsSavingGenerated(true);
                                  try {
                                    const typeLabels: Record<string, string> = {
                                      amanare: 'Cerere de amânare',
                                      probatoriu: 'Cerere de probatoriu',
                                      concluzii: 'Concluzii scrise',
                                      intampinare: 'Întâmpinare',
                                      alt: 'Document juridic'
                                    };
                                    const typeEnums: Record<string, number> = {
                                      amanare: 0, probatoriu: 0, concluzii: 4,
                                      intampinare: 1, alt: 4
                                    };
                                    const title = typeLabels[aiDocumentType] ?? 'Document juridic';
                                    const filename = `${title} - ${legalCase.number}.docx`;
                                    const { generateDocxBlob } = await import('../../../lib/docxGenerator');
                                    const blob = await generateDocxBlob(title, generatedContent);
                                    const file = new File([blob], filename, {
                                      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                                    });
                                    await uploadCaseDocument(caseId, {
                                      name: filename,
                                      type: typeEnums[aiDocumentType] ?? 4,
                                      file,
                                      textContent: generatedContent
                                    });
                                    await refreshDocuments();
                                    setGeneratedSaved(true);
                                    window.setTimeout(() => setGeneratedSaved(false), 4000);
                                  } catch (err) {
                                    console.error(err);
                                  } finally {
                                    setIsSavingGenerated(false);
                                  }
                                }}
                                sx={{ fontSize: '0.85rem', py: 0.7, px: 1.8 }}
                              >
                                {generatedSaved ? '✓ Salvat' : 'Adaugă în dosar'}
                              </Button>
                            </Stack>
                          </Box>

                          <Divider sx={{ mb: 2 }} />

                          <Typography
                            sx={{
                              fontSize: '0.9rem',
                              lineHeight: 1.75,
                              whiteSpace: 'pre-wrap',
                              color: 'text.primary'
                            }}
                          >
                            {generatedContent}
                          </Typography>
                        </Paper>
                      )}
                    </AnimatePresence>
                  </Stack>
                </Paper>

                <Box
                  component={motion.div}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <Alert
                    severity="info"
                    sx={{
                      fontSize: '0.9rem',
                      '& .MuiAlert-message': {
                        lineHeight: 1.6
                      }
                    }}
                  >
                    <strong>Context disponibil:</strong> Dosar curent #
                    {legalCase.number} · Instanță: {legalCase.court} ·
                    Documente în dosar: {documents.length}
                  </Alert>
                </Box>
              </Stack>
            ) : null}
          </AnimatePresence>
        </Box>
      </Paper>

      <Dialog
        open={!!editDocument}
        onClose={handleCloseEditDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Editează document</DialogTitle>

        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Nume document"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              fullWidth
            />

            <TextField
              select
              label="Tip document"
              value={editType}
              onChange={(e) => setEditType(Number(e.target.value))}
              SelectProps={{ native: true }}
              fullWidth
            >
              <option value={0}>Cerere</option>
              <option value={1}>Întâmpinare</option>
              <option value={2}>Probe</option>
              <option value={3}>Hotărâre</option>
              <option value={4}>Altele</option>
            </TextField>
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseEditDialog}>Anulează</Button>
          <Button
            variant="contained"
            onClick={handleSaveEdit}
            disabled={!editName.trim()}
          >
            Salvează
          </Button>
        </DialogActions>
      </Dialog>
      {/* ── Hearing Add/Edit Dialog ─────────────────────────────── */}
      <Dialog open={hearingDialogOpen} onClose={closeHearingDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editHearing ? 'Editează termen' : 'Adaugă termen de judecată'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {hearingError ? <Alert severity="error">{hearingError}</Alert> : null}
            <TextField
              label="Denumire termen"
              value={hearingTitle}
              onChange={(e) => setHearingTitle(e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Data și ora"
              type="datetime-local"
              value={hearingDate}
              onChange={(e) => setHearingDate(e.target.value)}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Sala"
              value={hearingCourtRoom}
              onChange={(e) => setHearingCourtRoom(e.target.value)}
              fullWidth
            />
            <TextField
              label="Notă"
              value={hearingNote}
              onChange={(e) => setHearingNote(e.target.value)}
              fullWidth
              multiline
              rows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeHearingDialog} disabled={isSavingHearing}>Anulează</Button>
          <Button
            variant="contained"
            onClick={handleSaveHearing}
            disabled={isSavingHearing || !hearingTitle.trim() || !hearingDate}
            startIcon={isSavingHearing ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {isSavingHearing ? 'Se salvează...' : 'Salvează'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}