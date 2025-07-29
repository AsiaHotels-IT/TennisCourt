import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import MuiCard from '@mui/material/Card';
import { styled } from '@mui/material/styles';
import AppTheme from '../../component/AppTheme';
import ColorModeSelect from '../../component/ColorModeSelect';
import { SitemarkIcon } from '../../component/CustomIcons';
import { login } from '../../function/auth';
import { useNavigate } from 'react-router-dom';
import bg from '../../img/TennisCourt.jpg';

const bgImage = `url(${bg})`;

const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: 'auto',
  [theme.breakpoints.up('sm')]: {
    maxWidth: '420px',
  },
  boxShadow:
    '0 8px 32px 0 rgba(0,0,0,0.12), 0 1.5px 6px 0 rgba(0,0,0,0.04)',
  borderRadius: 22,
  background: 'rgba(255,255,255,0.96)',
  backdropFilter: 'blur(5px)',
  ...theme.applyStyles('dark', {
    background: 'rgba(34,34,48,0.95)',
    boxShadow:
      '0 8px 32px 0 rgba(10,10,23,0.6), 0 1.5px 6px 0 rgba(0,0,0,0.06)',
  }),
}));

const SignInContainer = styled(Stack)(({ theme }) => ({
  height: '100vh',
  minHeight: '100%',
  padding: theme.spacing(2),
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  backgroundImage: `${bgImage}`,
  backgroundRepeat: 'no-repeat',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  '&::before': {
    content: '""',
    display: 'block',
    position: 'absolute',
    zIndex: 0,
    inset: 0,
    background:
      'linear-gradient(120deg, rgba(179, 152, 154, 0.7))',
    mixBlendMode: 'multiply',
  },
}));

export default function Login(props) {
  const [emailError, setEmailError] = React.useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = React.useState('');
  const [passwordError, setPasswordError] = React.useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = React.useState('');
  const [loginError, setLoginError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoginError('');
    setLoading(true);

    const data = new FormData(event.currentTarget);
    const loginData = {
      username: data.get('username'),
      password: data.get('password'),
    };

    try {
      const res = await login(loginData);
      if (res && res.data.user) {
        localStorage.setItem('user', JSON.stringify(res.data.user));
        if (res.data.user.role === 'cashier') {
          navigate('/booking');
        } else if (res.data.user.role === 'auditor') {
          navigate('/auditBooking');
        } else {
          navigate('/');
        }
      }
    } catch (err) {
      setLoginError(err.response?.data?.message || err.message || 'เข้าสู่ระบบไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <SignInContainer direction="column">
        <Card variant="outlined" sx={{ zIndex: 2 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <Typography 
              variant="h5"
              sx={{ width: '100%', fontWeight: 700, letterSpacing: 1, fontFamily: 'Noto Sans Thai, sans-serif' }}
              gutterBottom>
              ระบบจองสนามเทนนิส โรงแรมเอเชีย
            </Typography>
          </div>
          {loginError && (
            <Typography color="error" sx={{ textAlign: 'center', mb: 2, fontWeight: 500 }}>
              {loginError}
            </Typography>
          )}
          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            sx={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              gap: 2,
            }}
          >
            <FormControl>
              <FormLabel htmlFor="username">Username</FormLabel>
              <TextField
                error={emailError}
                helperText={emailErrorMessage}
                id="username"
                name="username"
                placeholder="Username"
                autoFocus
                required
                fullWidth
                variant="outlined"
                color={emailError ? 'error' : 'primary'}
                sx={{
                  background: 'rgba(255,255,255,0.85)',
                  borderRadius: 2,
                  input: { fontWeight: 500 }
                }}
              />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="password">Password</FormLabel>
              <TextField
                error={passwordError}
                helperText={passwordErrorMessage}
                name="password"
                placeholder="••••••"
                type="password"
                id="password"
                autoComplete="current-password"
                required
                fullWidth
                variant="outlined"
                color={passwordError ? 'error' : 'primary'}
                sx={{
                  background: 'rgba(255,255,255,0.85)',
                  borderRadius: 2,
                  input: { fontWeight: 500 }
                }}
              />
            </FormControl>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                mt: 1,
                fontWeight: 700,
                fontSize: 18,
                letterSpacing: 2,
                background: '#7e5939ff',
                color: '#fff',
                borderRadius: 50,
                py: 1.2,
                boxShadow: '0 4px 12px 0 rgba(101,0,10,0.08)',
                '&:hover': {
                  background: '#a97a50',
                },
              }}
            >
              {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </Button>
          </Box>
        </Card>
        <Box sx={{ mt: 5, textAlign: 'center', zIndex: 2, color: "#fff", fontWeight: 300, letterSpacing: 1 }}>
          <span>Asia Hotel Tennis Court Booking System</span>
        </Box>
      </SignInContainer>
    </AppTheme>
  );
}