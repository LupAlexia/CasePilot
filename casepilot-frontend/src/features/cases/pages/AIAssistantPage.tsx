import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import FolderOpenOutlinedIcon from '@mui/icons-material/FolderOpenOutlined';
import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined';
import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion, AnimatePresence } from 'motion/react';
import { staggerContainer, fadeInUp, cardReveal } from '../../../lib/animations';
import { formatDateOnly } from '../../../lib/date';
import { getLegalCases } from '../../../services/api/legalCasesApi';
import { generateDocument } from '../../../services/api/aiApi';
import { uploadCaseDocument } from '../../../services/api/caseDocumentsApi';
import { extractTextFromFile } from '../../../lib/extractText';
import { downloadDocx } from '../../../lib/docxGenerator';
import type { LegalCase } from '../../../services/api/types';

const documentTypeLabels: Record<string, string> = {
  amanare: 'Cerere de amânare',
  probatoriu: 'Cerere de probatoriu',
  concluzii: 'Concluzii scrise',
  intampinare: 'Întâmpinare',
  alt: 'Document juridic'
};

const documentTypeToBackendEnum: Record<string, number> = {
  amanare: 0,    // Cerere
  probatoriu: 0, // Cerere
  concluzii: 4,  // Altele
  intampinare: 1, // Intampinare
  alt: 4         // Altele
};

export function AIAssistantPage() {
  const shouldReduceMotion = useReducedMotion();
  const templateInputRef = useRef<HTMLInputElement>(null);

  const [cases, setCases] = useState<LegalCase[]>([]);
  const [isLoadingCases, setIsLoadingCases] = useState(true);

  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [additionalData, setAdditionalData] = useState('');
  const [templateText, setTemplateText] = useState('');
  const [templateFileName, setTemplateFileName] = useState('');

  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [documentSaved, setDocumentSaved] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Load cases on mount so the dropdown works even on direct navigation
  useEffect(() => {
    async function load() {
      try {
        setIsLoadingCases(true);
        const result = await getLegalCases(1, 100);
        setCases(result.items);
      } catch {
        // silently fallback to empty; user will see empty dropdown
      } finally {
        setIsLoadingCases(false);
      }
    }
    void load();
  }, []);

  const caseInfo = useMemo(
    () => cases.find((c) => c.id === selectedCaseId),
    [cases, selectedCaseId]
  );

  const handleTemplateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setTemplateFileName(file.name);
    const text = await extractTextFromFile(file);
    setTemplateText(text);
  };

  const handleGenerateDocument = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedCaseId || !documentType) return;

    setIsGenerating(true);
    setGenerateError('');
    setShowPreview(false);
    setGeneratedContent('');
    setDocumentSaved(false);
    setSaveError('');

    try {
      const result = await generateDocument({
        caseId: selectedCaseId,
        documentType,
        additionalData,
        templateText: templateText || undefined
      });
      setGeneratedContent(result.content);
      setShowPreview(true);
    } catch (err) {
      setGenerateError(
        err instanceof Error ? err.message : 'Eroare la generarea documentului.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadDocx = async () => {
    if (!generatedContent) return;
    const title = documentTypeLabels[documentType] ?? 'Document juridic';
    const filename = `${title} - ${caseInfo?.number ?? 'dosar'}.docx`;
    await downloadDocx(title, generatedContent, filename);
  };

  const handleSaveToCase = async () => {
    if (!caseInfo || !generatedContent) return;

    setIsSaving(true);
    setSaveError('');
    setDocumentSaved(false);

    try {
      const title = documentTypeLabels[documentType] ?? 'Document juridic';
      const filename = `${title} - ${caseInfo.number}.docx`;

      // Generate the actual .docx blob and turn it into a File to upload
      const { generateDocxBlob } = await import('../../../lib/docxGenerator');
      const blob = await generateDocxBlob(title, generatedContent);
      const file = new File([blob], filename, {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });

      await uploadCaseDocument(caseInfo.id, {
        name: filename,
        type: documentTypeToBackendEnum[documentType] ?? 4,
        file,
        textContent: generatedContent
      });

      setDocumentSaved(true);
      window.setTimeout(() => setDocumentSaved(false), 4000);
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : 'Documentul nu a putut fi adăugat în dosar.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Stack
      component={motion.div}
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      spacing={3.5}
    >
      <Box component={motion.div} variants={fadeInUp}>
        <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 1 }}>
          <AutoAwesomeOutlinedIcon color="secondary" sx={{ fontSize: 30 }} />
          <Typography variant="h2">Asistent AI pentru documente</Typography>
        </Stack>
        <Typography color="text.secondary" sx={{ fontSize: '0.92rem' }}>
          Generează automat documente juridice folosind informațiile din dosar și documentele încărcate.
        </Typography>
      </Box>

      <Paper component={motion.div} variants={cardReveal} sx={{ p: { xs: 2, md: 3 } }}>
        <Box component="form" onSubmit={handleGenerateDocument}>
          <Stack
            component={motion.div}
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            spacing={2.4}
          >
            {/* Case selector */}
            <Box component={motion.div} variants={fadeInUp}>
              <TextField
                select
                label="Număr dosar"
                value={selectedCaseId}
                onChange={(e) => setSelectedCaseId(e.target.value)}
                required
                fullWidth
                disabled={isLoadingCases}
              >
                <MenuItem value="">
                  {isLoadingCases ? 'Se încarcă dosarele...' : 'Selectează dosarul'}
                </MenuItem>
                {cases.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.number} — {c.court}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            {/* Document type */}
            <Box component={motion.div} variants={fadeInUp}>
              <TextField
                select
                label="Tip document"
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                required
                fullWidth
              >
                <MenuItem value="">Selectează tipul documentului</MenuItem>
                <MenuItem value="amanare">Cerere de amânare</MenuItem>
                <MenuItem value="probatoriu">Cerere de probatoriu</MenuItem>
                <MenuItem value="concluzii">Concluzii scrise</MenuItem>
                <MenuItem value="intampinare">Întâmpinare</MenuItem>
                <MenuItem value="alt">Alt tip document</MenuItem>
              </TextField>
            </Box>

            {/* Extra notes */}
            <Box component={motion.div} variants={fadeInUp}>
              <TextField
                label="Date suplimentare"
                value={additionalData}
                onChange={(e) => setAdditionalData(e.target.value)}
                multiline
                minRows={6}
                placeholder="Introdu instrucțiuni sau informații suplimentare pentru generarea documentului."
                fullWidth
              />
            </Box>

            {/* Template upload */}
            <Box component={motion.div} variants={fadeInUp}>
              <Typography sx={{ mb: 0.7, fontWeight: 700, fontSize: '0.9rem' }}>
                Șablon document (opțional)
              </Typography>
              <Typography sx={{ mb: 1.2, color: 'text.secondary', fontSize: '0.78rem' }}>
                Dacă încarci un șablon, AI va genera documentul folosind structura acestuia.
              </Typography>
              <Paper
                component={motion.div}
                whileHover={shouldReduceMotion ? undefined : { borderColor: 'rgba(31,78,140,0.5)', scale: 1.005 }}
                variant="outlined"
                sx={{
                  p: 2.8,
                  textAlign: 'center',
                  borderStyle: 'dashed',
                  transition: 'border-color 300ms ease, background-color 300ms ease',
                  '&:hover': { backgroundColor: 'rgba(31, 78, 140, 0.03)' }
                }}
              >
                <UploadFileOutlinedIcon sx={{ fontSize: 34, color: 'text.secondary', mb: 0.8 }} />
                <Typography sx={{ mb: 1.2, fontSize: '0.9rem' }}>
                  {templateFileName || 'Încarcă un șablon pentru document'}
                </Typography>
                <Button
                  component="label"
                  variant="contained"
                  startIcon={<UploadFileOutlinedIcon />}
                >
                  {templateFileName ? 'Schimbă fișierul' : 'Selectează fișier'}
                  <input
                    ref={templateInputRef}
                    hidden
                    type="file"
                    accept=".docx,.doc"
                    onChange={handleTemplateChange}
                  />
                </Button>
                {templateFileName ? (
                  <Typography sx={{ mt: 0.8, fontSize: '0.75rem', color: 'success.main' }}>
                    ✓ {templateFileName} — text extras cu succes
                  </Typography>
                ) : null}
              </Paper>
            </Box>

            {generateError ? <Alert severity="error">{generateError}</Alert> : null}

            <Button
              component={motion.button}
              variants={fadeInUp}
              whileHover={shouldReduceMotion ? undefined : { scale: 1.02, y: -2 }}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
              type="submit"
              variant="contained"
              color="secondary"
              startIcon={
                isGenerating ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <AutoAwesomeOutlinedIcon />
                )
              }
              size="large"
              disabled={isGenerating}
            >
              {isGenerating ? 'Se generează...' : 'Generează document'}
            </Button>
          </Stack>
        </Box>
      </Paper>

      <AnimatePresence>
        {showPreview ? (
          <Stack
            component={motion.div}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.45 }}
            spacing={3}
          >
            {/* Context cards (real data) */}
            <Paper
              component={motion.div}
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              sx={{ p: { xs: 2, md: 3 } }}
            >
              <Typography component={motion.h4} variants={fadeInUp} variant="h4" sx={{ mb: 0.8 }}>
                Date utilizate pentru generarea documentului
              </Typography>
              <Typography component={motion.p} variants={fadeInUp} color="text.secondary" sx={{ mb: 2.4, fontSize: '0.87rem' }}>
                AI a utilizat automat următoarele informații din dosar și documentele existente.
              </Typography>

              <Box
                component={motion.div}
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                sx={{
                  display: 'grid',
                  gap: 1.5,
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }
                }}
              >
                {[
                  {
                    icon: <FolderOpenOutlinedIcon color="primary" fontSize="small" />,
                    title: 'Număr dosar',
                    value: caseInfo?.number ?? '-'
                  },
                  {
                    icon: <GavelOutlinedIcon color="primary" fontSize="small" />,
                    title: 'Instanță',
                    value: caseInfo?.court ?? '-'
                  },
                  {
                    icon: <GroupsOutlinedIcon color="primary" fontSize="small" />,
                    title: 'Părți implicate',
                    value: caseInfo
                      ? `Reclamant: ${caseInfo.reclamant}\nPârât: ${caseInfo.parat}`
                      : '-'
                  },
                  {
                    icon: <AssignmentTurnedInOutlinedIcon color="primary" fontSize="small" />,
                    title: 'Obiectul cauzei',
                    value: caseInfo?.object ?? '-'
                  },
                  {
                    icon: <CalendarMonthOutlinedIcon color="primary" fontSize="small" />,
                    title: 'Termen înregistrat',
                    value:
                      caseInfo?.hearings?.[0]
                        ? formatDateOnly(caseInfo.hearings[0].date)
                        : 'Niciun termen înregistrat'
                  },
                  {
                    icon: <DescriptionOutlinedIcon color="primary" fontSize="small" />,
                    title: 'Documente analizate',
                    value: `${caseInfo?.documents?.length ?? 0} documente în dosar`
                  }
                ].map((item) => (
                  <Paper
                    component={motion.div}
                    key={item.title}
                    variants={cardReveal}
                    whileHover={shouldReduceMotion ? undefined : { scale: 1.015, y: -2 }}
                    variant="outlined"
                    sx={{ p: 1.8, backgroundColor: 'rgba(23,48,75,0.03)', transition: 'transform 180ms ease' }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.6 }}>
                      {item.icon}
                      <Typography sx={{ fontWeight: 700, fontSize: '0.86rem' }}>{item.title}</Typography>
                    </Stack>
                    <Typography sx={{ color: 'text.secondary', fontSize: '0.82rem', whiteSpace: 'pre-line' }}>
                      {item.value}
                    </Typography>
                  </Paper>
                ))}
              </Box>
            </Paper>

            {/* Generated document */}
            <Paper
              component={motion.div}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.2 }}
              sx={{ p: { xs: 2, md: 3 } }}
            >
              <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1.5} sx={{ mb: 2 }}>
                <Typography variant="h4">Document generat</Typography>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="outlined"
                    startIcon={<DescriptionOutlinedIcon />}
                    onClick={handleDownloadDocx}
                  >
                    Vizualizează document
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<DownloadOutlinedIcon />}
                    onClick={handleDownloadDocx}
                  >
                    Descarcă DOCX
                  </Button>
                </Stack>
              </Stack>

              <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, backgroundColor: '#fff' }}>
                <Stack spacing={1.4}>
                  <Typography sx={{ textAlign: 'center', fontWeight: 800, textTransform: 'uppercase' }}>
                    {documentTypeLabels[documentType] ?? 'Document juridic'}
                  </Typography>
                  <Typography
                    sx={{ pt: 0.7, fontSize: '0.88rem', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}
                  >
                    {generatedContent}
                  </Typography>
                </Stack>
              </Paper>

              <Stack spacing={1.3} sx={{ mt: 2.2 }}>
                {saveError ? <Alert severity="error">{saveError}</Alert> : null}

                <Button
                  component={motion.button}
                  whileHover={shouldReduceMotion ? undefined : { scale: 1.02, y: -2 }}
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                  variant="contained"
                  color="secondary"
                  startIcon={
                    isSaving ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      <CheckCircleOutlinedIcon />
                    )
                  }
                  onClick={handleSaveToCase}
                  disabled={isSaving || documentSaved}
                >
                  {isSaving ? 'Se salvează...' : 'Adaugă documentul în dosar'}
                </Button>

                <AnimatePresence>
                  {documentSaved ? (
                    <Box
                      component={motion.div}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Alert icon={<CheckCircleOutlinedIcon fontSize="inherit" />} severity="success">
                        Documentul a fost adăugat cu succes în dosar.
                      </Alert>
                    </Box>
                  ) : null}
                </AnimatePresence>
              </Stack>
            </Paper>
          </Stack>
        ) : null}
      </AnimatePresence>
    </Stack>
  );
}
