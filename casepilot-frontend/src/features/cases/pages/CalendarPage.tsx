import ChevronLeftOutlinedIcon from '@mui/icons-material/ChevronLeftOutlined';
import ChevronRightOutlinedIcon from '@mui/icons-material/ChevronRightOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import { Alert, Box, CircularProgress, IconButton, Paper, Stack, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion, AnimatePresence } from 'motion/react';
import { staggerContainer, fadeInUp, cardReveal, listItem, hoverLift } from '../../../lib/animations';
import { getHearings, type HearingWithCase } from '../../../services/api/hearingsApi';

const monthNames = [
  'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
  'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'
];

const dayHeaders = ['Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sa', 'Du'];

interface CalendarEvent {
  id: string;
  dayOfMonth: number;
  month: number; // 0-based
  year: number;
  caseNumber: string;
  court: string;
  time: string;
  title: string;
  note: string;
  caseId: string;
  isoDate: string;
}

function getDaysInMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function getFirstDayOfMonth(date: Date) {
  const day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  return day === 0 ? 6 : day - 1; // Monday-first grid
}

function hearingToEvent(h: HearingWithCase): CalendarEvent {
  const d = new Date(h.date);
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return {
    id: h.id,
    dayOfMonth: d.getDate(),
    month: d.getMonth(),
    year: d.getFullYear(),
    caseNumber: h.caseNumber,
    court: h.court,
    time: `${hours}:${minutes}`,
    title: h.title || 'Termen judecată',
    note: h.note,
    caseId: h.caseId,
    isoDate: h.date
  };
}

export function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const shouldReduceMotion = useReducedMotion();

  const [hearings, setHearings] = useState<HearingWithCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        setIsLoading(true);
        setError('');
        const data = await getHearings();
        setHearings(data);
      } catch {
        setError('Termenele nu au putut fi încărcate.');
      } finally {
        setIsLoading(false);
      }
    }
    void load();
  }, []);

  const events = useMemo(() => hearings.map(hearingToEvent), [hearings]);

  const daysInMonth = useMemo(() => getDaysInMonth(currentDate), [currentDate]);
  const firstDay = useMemo(() => getFirstDayOfMonth(currentDate), [currentDate]);
  const days = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => i + 1), [daysInMonth]);
  const emptyDays = useMemo(() => Array.from({ length: firstDay }, (_, i) => i), [firstDay]);

  const eventsInCurrentMonth = useMemo(
    () => events.filter(
      (e) => e.year === currentDate.getFullYear() && e.month === currentDate.getMonth()
    ),
    [events, currentDate]
  );

  const getEventsForDay = (day: number) =>
    eventsInCurrentMonth.filter((e) => e.dayOfMonth === day);

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === currentDate.getMonth() &&
      today.getFullYear() === currentDate.getFullYear()
    );
  };

  const previousMonth = () =>
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

  const nextMonth = () =>
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  return (
    <Stack
      component={motion.div}
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      spacing={3.5}
    >
      <Typography component={motion.h2} variants={fadeInUp} variant="h2">
        Calendar termene
      </Typography>

      {error ? (
        <Alert severity="error">{error}</Alert>
      ) : null}

      <Paper component={motion.div} variants={cardReveal} sx={{ p: { xs: 2, md: 3 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
          <AnimatePresence mode="wait">
            <Typography
              component={motion.h4}
              key={`${currentDate.getMonth()}-${currentDate.getFullYear()}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.25 }}
              variant="h4"
            >
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </Typography>
          </AnimatePresence>
          <Stack direction="row" spacing={1}>
            <IconButton
              component={motion.button}
              whileHover={shouldReduceMotion ? undefined : { scale: 1.1 }}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
              aria-label="Luna anterioară"
              onClick={previousMonth}
              sx={{ border: '1px solid', borderColor: 'divider' }}
            >
              <ChevronLeftOutlinedIcon />
            </IconButton>
            <IconButton
              component={motion.button}
              whileHover={shouldReduceMotion ? undefined : { scale: 1.1 }}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
              aria-label="Luna următoare"
              onClick={nextMonth}
              sx={{ border: '1px solid', borderColor: 'divider' }}
            >
              <ChevronRightOutlinedIcon />
            </IconButton>
          </Stack>
        </Stack>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <AnimatePresence mode="wait">
            <Box
              component={motion.div}
              key={`${currentDate.getMonth()}-${currentDate.getFullYear()}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 1 }}
            >
              {dayHeaders.map((day) => (
                <Typography
                  key={day}
                  sx={{
                    py: 0.8,
                    textAlign: 'center',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    color: 'text.secondary'
                  }}
                >
                  {day}
                </Typography>
              ))}

              {emptyDays.map((item) => (
                <Box
                  key={`empty-${item}`}
                  sx={{
                    minHeight: { xs: 88, md: 106 },
                    borderRadius: 2,
                    backgroundColor: 'rgba(23,48,75,0.04)'
                  }}
                />
              ))}

              {days.map((day, index) => {
                const dayEvents = getEventsForDay(day);
                const today = isToday(day);
                return (
                  <Box
                    component={motion.div}
                    key={day}
                    initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      duration: 0.25,
                      delay: shouldReduceMotion ? 0 : Math.min(index * 0.012, 0.4)
                    }}
                    whileHover={shouldReduceMotion ? undefined : { scale: 1.03, zIndex: 2 }}
                    sx={{
                      minHeight: { xs: 88, md: 106 },
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: today ? 'secondary.main' : 'rgba(23,48,75,0.14)',
                      backgroundColor: today ? 'rgba(181,133,45,0.08)' : '#fff',
                      p: 1,
                      transition: 'background-color 220ms ease, box-shadow 220ms ease',
                      '&:hover': {
                        backgroundColor: today
                          ? 'rgba(181,133,45,0.12)'
                          : 'rgba(23,48,75,0.04)',
                        boxShadow: '0 4px 12px rgba(17,43,68,0.08)'
                      }
                    }}
                  >
                    <Typography
                      sx={{
                        mb: 0.6,
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        color: today ? 'secondary.main' : 'text.primary'
                      }}
                    >
                      {day}
                    </Typography>
                    <Stack spacing={0.55}>
                      {dayEvents.map((event) => (
                        <Box
                          component={motion.div}
                          key={event.id}
                          initial={shouldReduceMotion ? false : { opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: 0.3 }}
                          title={`${event.caseNumber} - ${event.court} - ${event.time}`}
                          sx={{
                            px: 0.7,
                            py: 0.5,
                            borderRadius: 1,
                            backgroundColor: 'rgba(31,78,140,0.12)',
                            color: 'primary.main',
                            cursor: 'pointer',
                            transition: 'background-color 220ms ease, transform 180ms ease',
                            '&:hover': {
                              backgroundColor: 'rgba(31,78,140,0.2)',
                              transform: 'scale(1.04)'
                            }
                          }}
                        >
                          <Typography sx={{ fontSize: '0.66rem', fontWeight: 700, lineHeight: 1.2 }}>
                            {event.caseNumber}
                          </Typography>
                          <Stack direction="row" spacing={0.4} alignItems="center">
                            <AccessTimeOutlinedIcon sx={{ fontSize: '0.62rem' }} />
                            <Typography sx={{ fontSize: '0.62rem', lineHeight: 1.2 }}>
                              {event.time}
                            </Typography>
                          </Stack>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                );
              })}
            </Box>
          </AnimatePresence>
        )}
      </Paper>

      <Paper component={motion.div} variants={cardReveal} sx={{ p: { xs: 2, md: 3 } }}>
        <Typography variant="h4" sx={{ mb: 2.2 }}>
          Termene programate
        </Typography>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : eventsInCurrentMonth.length === 0 ? (
          <Typography color="text.secondary" sx={{ fontSize: '0.9rem' }}>
            Nu există termene în {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}.
          </Typography>
        ) : (
          <Stack
            component={motion.div}
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            spacing={1.3}
          >
            {eventsInCurrentMonth.map((event) => (
              <Paper
                component={motion.div}
                key={event.id}
                variants={listItem}
                whileHover={shouldReduceMotion ? undefined : { x: 4, ...hoverLift }}
                variant="outlined"
                sx={{
                  p: 2,
                  transition: 'background-color 220ms ease, transform 220ms ease',
                  '&:hover': { backgroundColor: 'rgba(23,48,75,0.04)' }
                }}
              >
                <Stack direction="row" justifyContent="space-between" spacing={2} alignItems="center">
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.9rem' }}>
                      {event.title} - {event.caseNumber}
                    </Typography>
                    <Typography color="text.secondary" sx={{ fontSize: '0.78rem' }}>
                      {event.court}
                      {event.note ? ` · ${event.note}` : ''}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.83rem', color: 'secondary.main' }}>
                      {event.dayOfMonth} {monthNames[event.month]} {event.year}
                    </Typography>
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end" alignItems="center">
                      <AccessTimeOutlinedIcon sx={{ fontSize: '0.75rem', color: 'text.secondary' }} />
                      <Typography color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                        {event.time}
                      </Typography>
                    </Stack>
                  </Box>
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}
      </Paper>
    </Stack>
  );
}
