import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#7C3AED',       // Violet-600
      light: '#A78BFA',      // Violet-400
      dark: '#5B21B6',       // Violet-800
      contrastText: '#fff',
    },
    secondary: {
      main: '#06B6D4',       // Cyan-500
      light: '#67E8F9',
      dark: '#0E7490',
      contrastText: '#fff',
    },
    success: { main: '#10B981' },
    warning: { main: '#F59E0B' },
    error: { main: '#EF4444' },
    background: {
      default: '#0A0A0F',
      paper: '#12121A',
    },
    divider: 'rgba(255,255,255,0.08)',
    text: {
      primary: '#F1F5F9',
      secondary: '#94A3B8',
    },
  },
  typography: {
    fontFamily: '"Inter", -apple-system, sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-0.02em' },
    h2: { fontWeight: 700, letterSpacing: '-0.01em' },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { fontWeight: 600, textTransform: 'none', letterSpacing: '0.01em' },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '10px 22px',
          transition: 'all 0.2s ease',
          '&:hover': { transform: 'translateY(-1px)', boxShadow: '0 6px 20px rgba(124,58,237,0.35)' },
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)',
          '&:hover': { background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)' },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#12121A',
          border: '1px solid rgba(255,255,255,0.07)',
          backdropFilter: 'blur(20px)',
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
          '&:hover': { borderColor: 'rgba(124,58,237,0.3)', boxShadow: '0 0 0 1px rgba(124,58,237,0.15)' },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#12121A',
          border: '1px solid rgba(255,255,255,0.07)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
            '&:hover fieldset': { borderColor: 'rgba(124,58,237,0.5)' },
            '&.Mui-focused fieldset': { borderColor: '#7C3AED' },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600 },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: 'rgba(124,58,237,0.1)',
            color: '#A78BFA',
            fontWeight: 700,
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          },
        },
      },
    },
  },
});

export default theme;
