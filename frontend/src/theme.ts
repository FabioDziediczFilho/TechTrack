import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#164e70',
      dark: '#0d2f49',
      light: '#397b9f',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#12a89d',
      dark: '#087f79',
      light: '#63c9bd',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f3f6fa',
      paper: '#ffffff',
    },
    text: {
      primary: '#1d2939',
      secondary: '#66758a',
    },
    divider: '#e5ebf2',
    success: {
      main: '#17866e',
    },
    warning: {
      main: '#c98222',
    },
    error: {
      main: '#c44755',
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: '"Inter", "Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 750, letterSpacing: '-0.04em' },
    h2: { fontWeight: 750, letterSpacing: '-0.035em' },
    h3: { fontWeight: 700, letterSpacing: '-0.03em' },
    h4: { fontWeight: 700, letterSpacing: '-0.025em' },
    h5: { fontWeight: 650, letterSpacing: '-0.02em' },
    h6: { fontWeight: 650, letterSpacing: '-0.015em' },
    button: { fontWeight: 650, textTransform: 'none' },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#f3f6fa',
        },
        '::selection': {
          backgroundColor: '#b8e9e3',
          color: '#0d2f49',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: 40,
          borderRadius: 10,
          boxShadow: 'none',
        },
        contained: {
          '&:hover': {
            boxShadow: '0 6px 16px rgba(22, 78, 112, 0.18)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid #e5ebf2',
          borderRadius: 16,
          boxShadow: '0 4px 18px rgba(18, 45, 70, 0.035)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 16,
        },
        elevation1: {
          boxShadow: '0 4px 18px rgba(18, 45, 70, 0.045)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: '#f7f9fc',
          color: '#66758a',
          fontWeight: 700,
          whiteSpace: 'nowrap',
        },
        root: {
          borderColor: '#e9eef4',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          backgroundColor: '#ffffff',
        },
      },
    },
  },
})

export default theme
