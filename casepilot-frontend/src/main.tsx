import React from 'react';
import ReactDOM from 'react-dom/client';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { RouterProvider } from 'react-router-dom';
import '@fontsource/manrope/500.css';
import '@fontsource/manrope/700.css';
import '@fontsource/manrope/800.css';
import '@fontsource/merriweather/400.css';
import '@fontsource/merriweather/700.css';
import { appRouter } from './app/router';
import { appTheme } from './theme/theme';
import { useBrowserMonitoring } from './lib/useBrowserMonitoring';
import { CookieConsentBanner } from './components/CookieConsentBanner';
import { AuthProvider } from './features/auth/AuthContext';

function AppRoot() {
  useBrowserMonitoring();

  return (
    <>
      <RouterProvider router={appRouter} />
      <CookieConsentBanner />
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <AuthProvider>
        <AppRoot />
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
