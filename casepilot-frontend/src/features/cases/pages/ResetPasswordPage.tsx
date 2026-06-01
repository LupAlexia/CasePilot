import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined';
import LockResetOutlinedIcon from '@mui/icons-material/LockResetOutlined';
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { type FormEvent, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { staggerContainer, fadeInUp, cardReveal, scaleIn } from '../../../lib/animations';
import { resetPassword } from '../../../services/api/authApi';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const [searchParams] = useSearchParams();

  const [token, setToken] = useState(searchParams.get('token') || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Parolele nu coincid.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Parola trebuie să aibă cel puțin 6 caractere.');
      return;
    }

    setLoading(true);
    try {
      const result = await resetPassword(token, newPassword);
      setSuccess(result.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'A apărut o eroare.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        px: 2,
        position: 'relative',
        overflow: 'hidden',
        background:
          'linear-gradient(160deg, rgba(238,243,249,0.96) 0%, rgba(221,232,245,0.95) 100%), radial-gradient(980px 380px at 100% -40%, rgba(31,78,140,0.16), transparent 70%)'
      }}
    >
      <Box
        component={motion.div}
        aria-hidden
        initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.8 }}
        animate={
          shouldReduceMotion
            ? undefined
            : { opacity: [0.2, 0.35, 0.2], scale: [1, 1.05, 1] }
        }
        transition={shouldReduceMotion ? undefined : { duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        sx={{
          position: 'absolute',
          width: { xs: 200, md: 280 },
          height: { xs: 200, md: 280 },
          bottom: { xs: -50, md: -60 },
          right: { xs: -40, md: -30 },
          background: 'radial-gradient(circle at 50% 50%, rgba(156,39,176,0.12), rgba(156,39,176,0.02))',
          borderRadius: '50%',
          pointerEvents: 'none',
          filter: 'blur(2px)'
        }}
      />

      <Box sx={{ width: '100%', maxWidth: 480, position: 'relative', zIndex: 1 }}>
        <Paper
          component={motion.div}
          initial="hidden"
          animate="visible"
          variants={cardReveal}
          sx={{ p: { xs: 3, sm: 4 }, borderRadius: 3.5 }}
        >
          <Stack
            component={motion.div}
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            spacing={3}
          >
            <Stack
              component={motion.div}
              variants={scaleIn}
              direction="row"
              spacing={1.25}
              justifyContent="center"
              alignItems="center"
            >
              <GavelOutlinedIcon color="primary" sx={{ fontSize: 36 }} />
              <Typography variant="h4" sx={{ color: 'primary.main' }}>
                CasePilot
              </Typography>
            </Stack>

            <Stack
              component={motion.div}
              variants={fadeInUp}
              spacing={1}
              alignItems="center"
            >
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(156,39,176,0.1)',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <LockResetOutlinedIcon sx={{ color: '#9c27b0', fontSize: 28 }} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700, textAlign: 'center' }}>
                Resetare parolă
              </Typography>
              <Typography sx={{ color: 'text.secondary', textAlign: 'center', fontSize: '0.9rem' }}>
                Introduceți token-ul primit și noua parolă.
              </Typography>
            </Stack>

            {error && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            {success ? (
              <Stack spacing={2}>
                <Alert severity="success" sx={{ borderRadius: 2 }}>
                  {success}
                </Alert>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/login')}
                  sx={{ minHeight: 50, fontWeight: 800 }}
                >
                  Mergi la autentificare
                </Button>
              </Stack>
            ) : (
              <Box component="form" onSubmit={handleSubmit}>
                <Stack spacing={2.4}>
                  {/* Token field is hidden when the user arrives via email link (?token=…) */}
                  {!searchParams.get('token') && (
                    <Box component={motion.div} variants={fadeInUp}>
                      <TextField
                        label="Token de resetare"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        placeholder="Inserați token-ul primit pe email"
                        required
                        fullWidth
                        multiline
                        maxRows={3}
                        sx={{
                          '& .MuiOutlinedInput-root': { fontFamily: 'monospace', fontSize: '0.85rem' },
                        }}
                      />
                    </Box>
                  )}
                  <Box component={motion.div} variants={fadeInUp}>
                    <TextField
                      type="password"
                      label="Parolă nouă"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      fullWidth
                    />
                  </Box>
                  <Box component={motion.div} variants={fadeInUp}>
                    <TextField
                      type="password"
                      label="Confirmare parolă nouă"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      fullWidth
                    />
                  </Box>
                  <Button
                    component={motion.button}
                    variants={fadeInUp}
                    whileHover={shouldReduceMotion ? undefined : { scale: 1.02, y: -2 }}
                    whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={loading}
                    sx={{ minHeight: 50, fontWeight: 800 }}
                  >
                    {loading ? 'Se resetează...' : 'Resetează parola'}
                  </Button>
                </Stack>
              </Box>
            )}

            <Typography
              component={motion.p}
              variants={fadeInUp}
              sx={{ textAlign: 'center' }}
            >
              <Button
                variant="text"
                size="small"
                onClick={() => navigate('/login')}
                sx={{ textTransform: 'none', color: 'text.secondary' }}
              >
                ← Înapoi la autentificare
              </Button>
            </Typography>
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
}
