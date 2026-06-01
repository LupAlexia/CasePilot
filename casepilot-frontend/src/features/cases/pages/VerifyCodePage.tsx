import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { type FormEvent, useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { staggerContainer, fadeInUp, cardReveal, scaleIn } from '../../../lib/animations';
import { useAuth } from '../../auth/AuthContext';
import { verifyLoginCode, resendVerificationCode } from '../../../services/api/authApi';

export function VerifyCodePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();
  const { login } = useAuth();

  const verificationToken = (location.state as { verificationToken?: string })?.verificationToken;
  const maskedEmail = (location.state as { maskedEmail?: string })?.maskedEmail || '***@***.***';

  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Redirect if no verification token
  useEffect(() => {
    if (!verificationToken) {
      navigate('/login', { replace: true });
    }
  }, [verificationToken, navigate]);

  const handleDigitChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste of full code
      const pastedDigits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newDigits = [...digits];
      pastedDigits.forEach((d, i) => {
        if (index + i < 6) newDigits[index + i] = d;
      });
      setDigits(newDigits);
      const nextIndex = Math.min(index + pastedDigits.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const digit = value.replace(/\D/g, '');
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    const code = digits.join('');
    if (code.length !== 6) {
      setError('Introduceți toate cele 6 cifre.');
      return;
    }

    setLoading(true);
    try {
      const user = await verifyLoginCode({
        verificationToken: verificationToken!,
        code,
      });
      login(user);
      navigate('/app');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verificare eșuată.');
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    setResendSuccess('');
    try {
      await resendVerificationCode(verificationToken!);
      setResendSuccess('Codul a fost retrimis. Verificați inbox-ul email.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nu s-a putut retrimite codul.');
    } finally {
      setResending(false);
    }
  };

  if (!verificationToken) return null;

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
      {/* Animated background orb */}
      <Box
        component={motion.div}
        aria-hidden
        initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.8 }}
        animate={
          shouldReduceMotion
            ? undefined
            : { opacity: [0.2, 0.4, 0.2], scale: [1, 1.06, 1] }
        }
        transition={shouldReduceMotion ? undefined : { duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        sx={{
          position: 'absolute',
          width: { xs: 180, md: 280 },
          height: { xs: 180, md: 280 },
          top: { xs: -50, md: -60 },
          right: { xs: -40, md: -20 },
          background: 'radial-gradient(circle at 40% 40%, rgba(46,125,50,0.15), rgba(46,125,50,0.02))',
          borderRadius: '50%',
          pointerEvents: 'none',
          filter: 'blur(2px)'
        }}
      />

      <Box sx={{ width: '100%', maxWidth: 460, position: 'relative', zIndex: 1 }}>
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
                  backgroundColor: 'rgba(46,125,50,0.1)',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <LockOutlinedIcon sx={{ color: '#2e7d32', fontSize: 28 }} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700, textAlign: 'center' }}>
                Verificare în doi pași
              </Typography>
              <Typography sx={{ color: 'text.secondary', textAlign: 'center', fontSize: '0.9rem' }}>
                Am trimis un cod de verificare la{' '}
                <strong>{maskedEmail}</strong>
              </Typography>
            </Stack>

            {error && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            {resendSuccess && (
              <Alert severity="success" sx={{ borderRadius: 2 }}>
                {resendSuccess}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={3}>
                {/* 6-digit code input */}
                <Stack direction="row" spacing={1} justifyContent="center">
                  {digits.map((digit, index) => (
                    <TextField
                      key={index}
                      inputRef={(el) => { inputRefs.current[index] = el; }}
                      value={digit}
                      onChange={(e) => handleDigitChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      inputProps={{
                        maxLength: 6,
                        style: {
                          textAlign: 'center',
                          fontSize: '1.5rem',
                          fontWeight: 700,
                          padding: '12px 0',
                          width: '100%',
                        },
                      }}
                      sx={{
                        width: 52,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        },
                      }}
                    />
                  ))}
                </Stack>

                <Button
                  component={motion.button}
                  whileHover={shouldReduceMotion ? undefined : { scale: 1.02, y: -2 }}
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading || digits.join('').length !== 6}
                  sx={{ minHeight: 50, fontWeight: 800 }}
                >
                  {loading ? 'Se verifică...' : 'Verifică codul'}
                </Button>
              </Stack>
            </Box>

            <Stack
              component={motion.div}
              variants={fadeInUp}
              spacing={0.5}
              alignItems="center"
            >
              <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>
                Nu ai primit codul?
              </Typography>
              <Button
                variant="text"
                size="small"
                onClick={handleResend}
                disabled={resending}
                sx={{ textTransform: 'none' }}
              >
                {resending ? 'Se retrimite...' : 'Retrimite codul'}
              </Button>
              <Button
                variant="text"
                size="small"
                onClick={() => navigate('/login')}
                sx={{ color: 'text.secondary', textTransform: 'none', fontSize: '0.85rem' }}
              >
                ← Înapoi la autentificare
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
}
