import { createTheme, responsiveFontSizes } from '@mui/material/styles';

let appTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1f4e8c',
      light: '#5d86bc',
      dark: '#123055'
    },
    secondary: {
      main: '#b5852d'
    },
    background: {
      default: '#eef3f9',
      paper: '#ffffff'
    },
    text: {
      primary: '#17304b',
      secondary: '#4c5f73'
    },
    success: {
      main: '#3f9d5f'
    },
    warning: {
      main: '#b7901a'
    },
    error: {
      main: '#da4242'
    }
  },
  shape: {
    borderRadius: 16
  },
  typography: {
    fontFamily: ['Manrope', 'Segoe UI', 'sans-serif'].join(','),
    h1: { fontFamily: 'Merriweather, Georgia, serif', fontSize: '3.5rem', fontWeight: 700, lineHeight: 1.18 },
    h2: { fontFamily: 'Merriweather, Georgia, serif', fontSize: '2.15rem', fontWeight: 700, lineHeight: 1.2 },
    h3: { fontSize: '1.7rem', fontWeight: 800 },
    h4: { fontSize: '1.28rem', fontWeight: 800 },
    button: { textTransform: 'none', fontWeight: 700 }
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '*, *::before, *::after': {
          boxSizing: 'border-box'
        },
        html: {
          width: '100%',
          WebkitTextSizeAdjust: '100%',
          MozTextSizeAdjust: '100%',
          textSizeAdjust: '100%',
          overflowX: 'hidden'
        },
        body: {
          width: '100%',
          margin: 0,
          overflowX: 'hidden',
          background:
            'radial-gradient(1400px 580px at 90% -20%, rgba(34, 82, 145, 0.12), transparent 70%), radial-gradient(1200px 500px at 0% 0%, rgba(181, 133, 45, 0.08), transparent 65%), #eef3f9'
        },
        '#root': {
          minHeight: '100dvh'
        },
        img: {
          maxWidth: '100%',
          height: 'auto',
          display: 'block'
        },
        video: {
          maxWidth: '100%',
          height: 'auto',
          display: 'block'
        },
        svg: {
          maxWidth: '100%'
        },
        '::selection': {
          backgroundColor: 'rgba(31, 78, 140, 0.2)'
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 12px 32px rgba(19, 42, 68, 0.08)',
          border: '1px solid rgba(23, 48, 75, 0.07)',
          backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,255,255,0.96))'
        }
      }
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true
      },
      styleOverrides: {
        root: {
          borderRadius: 12,
          paddingInline: 18,
          minHeight: 42,
          transition: 'transform 180ms ease, box-shadow 220ms ease, background-color 220ms ease, border-color 220ms ease, color 220ms ease',
          '&:hover': {
            transform: 'translateY(-2px)'
          },
          '&:active': {
            transform: 'translateY(0)'
          }
        },
        contained: {
          boxShadow: '0 10px 22px rgba(27, 74, 131, 0.22)',
          '&:hover': {
            boxShadow: '0 16px 30px rgba(27, 74, 131, 0.34)'
          }
        },
        outlined: {
          '&:hover': {
            boxShadow: '0 10px 22px rgba(24, 56, 93, 0.18)'
          }
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 18,
          border: '1px solid rgba(24, 46, 70, 0.09)',
          boxShadow: '0 18px 32px rgba(16, 37, 63, 0.08)',
          background: 'linear-gradient(180deg, #ffffff 0%, #fcfdff 100%)'
        }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 800,
          color: '#17304b',
          backgroundColor: '#edf2f8'
        }
      }
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          WebkitOverflowScrolling: 'touch'
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(12px)'
        }
      }
    }
  }
});

appTheme = responsiveFontSizes(appTheme, {
  breakpoints: ['sm', 'md', 'lg'],
  factor: 2.2
});

export { appTheme };
