import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined';
import DevicesOutlinedIcon from '@mui/icons-material/DevicesOutlined';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { staggerContainer, fadeInUp, cardReveal } from '../../../lib/animations';
import { useAuth } from '../../auth/AuthContext';
import {
  changePassword,
  updateProfile,
  getPreferences as fetchServerPrefs,
  updatePreferences,
  getSessions,
  revokeSession,
  type SessionInfo,
} from '../../../services/api/profileApi';

export function ProfilePage() {
  const { user, updateUser, logout } = useAuth();
  const shouldReduceMotion = useReducedMotion();

  // ── Profile edit ────────────────────────────────────────────
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ── Change password ─────────────────────────────────────────
  const [pwExpanded, setPwExpanded] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ── Notifications ───────────────────────────────────────────
  const [hearingReminders, setHearingReminders] = useState(false);
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  // ── Account info ────────────────────────────────────────────
  const [createdAt, setCreatedAt] = useState<string | null>(null);

  // ── Sessions ────────────────────────────────────────────────
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  // Load server preferences + sessions on mount
  useEffect(() => {
    fetchServerPrefs()
      .then(prefs => {
        setHearingReminders(prefs.hearingNotificationsEnabled);
        setCreatedAt(prefs.createdAt);
        setPrefsLoaded(true);
      })
      .catch(() => setPrefsLoaded(true));

    getSessions()
      .then(setSessions)
      .catch(() => { /* ignore */ })
      .finally(() => setSessionsLoading(false));
  }, []);

  // ── Handlers ────────────────────────────────────────────────

  async function handleSaveProfile() {
    if (!fullName.trim()) return;
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      const res = await updateProfile(fullName.trim());
      updateUser({ fullName: res.fullName });
      setEditing(false);
      setProfileMsg({ type: 'success', text: 'Profilul a fost actualizat.' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: err instanceof Error ? err.message : 'Eroare la salvare.' });
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleChangePassword() {
    if (!currentPw || !newPw || !confirmPw) {
      setPwMsg({ type: 'error', text: 'Completați toate câmpurile.' });
      return;
    }
    if (newPw !== confirmPw) {
      setPwMsg({ type: 'error', text: 'Parola nouă și confirmarea nu coincid.' });
      return;
    }
    if (newPw.length < 6) {
      setPwMsg({ type: 'error', text: 'Parola nouă trebuie să aibă cel puțin 6 caractere.' });
      return;
    }
    setPwSaving(true);
    setPwMsg(null);
    try {
      await changePassword(currentPw, newPw);
      setPwMsg({ type: 'success', text: 'Parola schimbată. Vă veți deconecta automat în 3 secunde.' });
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
      setTimeout(() => logout(), 3000);
    } catch (err) {
      setPwMsg({ type: 'error', text: err instanceof Error ? err.message : 'Eroare la schimbarea parolei.' });
    } finally {
      setPwSaving(false);
    }
  }

  async function handleHearingRemindersToggle(enabled: boolean) {
    setHearingReminders(enabled);
    try {
      await updatePreferences(enabled);
    } catch {
      setHearingReminders(!enabled); // revert on error
    }
  }

  async function handleRevokeSession(sessionId: string) {
    try {
      await revokeSession(sessionId);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch { /* ignore */ }
  }

  function formatSessionAgent(ua: string) {
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return ua.slice(0, 40);
  }

  return (
    <Stack
      component={motion.div}
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      spacing={3.5}
    >
      <Typography component={motion.h2} variants={fadeInUp} variant="h2">Profil</Typography>

      <Box
        component={motion.div}
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }
        }}
      >
        {/* ── Date cont ──────────────────────────────────────── */}
        <Stack spacing={3}>
          <Paper component={motion.div} variants={cardReveal} sx={{ p: { xs: 2.2, md: 3 } }}>
            <Stack spacing={2.2}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h4">Date cont</Typography>
                {!editing && (
                  <Button
                    variant="outlined"
                    startIcon={<EditOutlinedIcon />}
                    onClick={() => { setEditing(true); setProfileMsg(null); }}
                  >
                    Editează profil
                  </Button>
                )}
              </Stack>

              {profileMsg && (
                <Alert severity={profileMsg.type} onClose={() => setProfileMsg(null)}>
                  {profileMsg.text}
                </Alert>
              )}

              <Box component={motion.div} variants={fadeInUp}>
                <TextField
                  label="Nume complet"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  fullWidth
                  disabled={!editing}
                  slotProps={{ input: { readOnly: !editing } }}
                />
              </Box>
              <Box component={motion.div} variants={fadeInUp}>
                <TextField label="Email" value={user?.email ?? ''} fullWidth disabled />
              </Box>
              <Box component={motion.div} variants={fadeInUp}>
                <TextField label="Roluri de sistem" value={user?.roles.join(', ') ?? 'User'} fullWidth disabled />
              </Box>
              {createdAt && (
                <Box component={motion.div} variants={fadeInUp}>
                  <TextField
                    label="Cont creat pe"
                    value={new Date(createdAt).toLocaleDateString('ro-RO', { day: '2-digit', month: 'long', year: 'numeric' })}
                    fullWidth
                    disabled
                  />
                </Box>
              )}

              {editing && (
                <Stack direction="row" spacing={1.5}>
                  <Button
                    variant="contained"
                    startIcon={profileSaving ? <CircularProgress size={16} color="inherit" /> : <SaveOutlinedIcon />}
                    disabled={profileSaving || !fullName.trim()}
                    onClick={() => void handleSaveProfile()}
                  >
                    Salvează modificările
                  </Button>
                  <Button variant="outlined" onClick={() => { setEditing(false); setFullName(user?.fullName ?? ''); setProfileMsg(null); }}>
                    Anulează
                  </Button>
                </Stack>
              )}
            </Stack>
          </Paper>

          {/* ── Sesiuni active ──────────────────────────────── */}
          <Paper component={motion.div} variants={cardReveal} sx={{ p: { xs: 2.2, md: 3 } }}>
            <Stack direction="row" spacing={1.1} alignItems="center" sx={{ mb: 2 }}>
              <DevicesOutlinedIcon fontSize="small" color="primary" />
              <Typography variant="h4">Sesiuni active</Typography>
            </Stack>
            {sessionsLoading ? (
              <CircularProgress size={20} />
            ) : sessions.length === 0 ? (
              <Typography color="text.secondary" sx={{ fontSize: '0.9rem' }}>Nu există sesiuni active.</Typography>
            ) : (
              <Stack spacing={1.2}>
                {sessions.map((session, idx) => (
                  <Box key={session.id}>
                    {idx > 0 && <Box sx={{ borderTop: '1px solid', borderColor: 'divider', mb: 1.2 }} />}
                    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                      <Box>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography sx={{ fontSize: '0.88rem', fontWeight: 600 }}>
                            {formatSessionAgent(session.userAgent)}
                          </Typography>
                          {session.isCurrent && (
                            <Chip label="Curent" size="small" color="primary" sx={{ height: 18, fontSize: '0.7rem' }} />
                          )}
                        </Stack>
                        <Typography color="text.secondary" sx={{ fontSize: '0.78rem' }}>
                          Ultima activitate: {new Date(session.lastActivityAt).toLocaleString('ro-RO')}
                        </Typography>
                      </Box>
                      {!session.isCurrent && (
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={() => void handleRevokeSession(session.id)}
                        >
                          Revocă
                        </Button>
                      )}
                    </Stack>
                  </Box>
                ))}
              </Stack>
            )}
          </Paper>
        </Stack>

        {/* ── Right column ───────────────────────────────────── */}
        <Stack spacing={3}>

          {/* ── Securitate ─────────────────────────────────── */}
          <Paper component={motion.div} variants={cardReveal} sx={{ p: 2.5 }}>
            <Stack direction="row" spacing={1.1} alignItems="center" sx={{ mb: 1.8 }}>
              <SecurityOutlinedIcon fontSize="small" color="primary" />
              <Typography variant="h4">Securitate</Typography>
            </Stack>

            {!pwExpanded ? (
              <Button
                variant="outlined"
                startIcon={<LockOutlinedIcon />}
                fullWidth
                onClick={() => { setPwExpanded(true); setPwMsg(null); }}
              >
                Schimbă parola
              </Button>
            ) : (
              <Stack spacing={1.5}>
                {pwMsg && (
                  <Alert severity={pwMsg.type} onClose={() => setPwMsg(null)}>
                    {pwMsg.text}
                  </Alert>
                )}
                <TextField
                  label="Parolă curentă"
                  type="password"
                  value={currentPw}
                  onChange={e => setCurrentPw(e.target.value)}
                  fullWidth
                  size="small"
                />
                <TextField
                  label="Parolă nouă"
                  type="password"
                  value={newPw}
                  onChange={e => setNewPw(e.target.value)}
                  fullWidth
                  size="small"
                />
                <TextField
                  label="Confirmă parola nouă"
                  type="password"
                  value={confirmPw}
                  onChange={e => setConfirmPw(e.target.value)}
                  fullWidth
                  size="small"
                />
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="contained"
                    size="small"
                    disabled={pwSaving}
                    startIcon={pwSaving ? <CircularProgress size={14} color="inherit" /> : undefined}
                    onClick={() => void handleChangePassword()}
                  >
                    Salvează
                  </Button>
                  <Button variant="outlined" size="small" onClick={() => { setPwExpanded(false); setCurrentPw(''); setNewPw(''); setConfirmPw(''); setPwMsg(null); }}>
                    Anulează
                  </Button>
                </Stack>
              </Stack>
            )}
          </Paper>

          {/* ── Notificări ──────────────────────────────────── */}
          <Paper component={motion.div} variants={cardReveal} sx={{ p: 2.5 }}>
            <Stack direction="row" spacing={1.1} alignItems="center" sx={{ mb: 1.8 }}>
              <NotificationsOutlinedIcon fontSize="small" color="primary" />
              <Typography variant="h4">Notificări</Typography>
            </Stack>
            <Stack spacing={0.5}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Stack direction="row" spacing={0.8} alignItems="center">
                    <EventNoteOutlinedIcon fontSize="small" color="secondary" />
                    <Typography sx={{ fontSize: '0.86rem', fontWeight: 600 }}>Reminder termene</Typography>
                  </Stack>
                  <Typography color="text.secondary" sx={{ fontSize: '0.76rem' }}>
                    Email cu o zi înainte de fiecare termen
                  </Typography>
                </Box>
                <Switch
                  checked={hearingReminders}
                  disabled={!prefsLoaded}
                  onChange={e => void handleHearingRemindersToggle(e.target.checked)}
                />
              </Stack>
            </Stack>
          </Paper>

        </Stack>
      </Box>
    </Stack>
  );
}
