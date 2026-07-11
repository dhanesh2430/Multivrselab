import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box, Container, Card, CardContent, TextField, Button,
  Typography, Alert, Link, InputAdornment, IconButton, CircularProgress,
} from '@mui/material';
import { Visibility, VisibilityOff, BoltOutlined } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, loading } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const result = await login(form.email, form.password);
    if (!result.success) setError(result.message);
  };

  return (
    <Box className="gradient-bg" sx={{ display: 'flex', alignItems: 'center', minHeight: '100vh' }}>
      <Container maxWidth="xs">
        {/* Logo */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <BoltOutlined sx={{ fontSize: 40, color: 'primary.light' }} />
            <Typography variant="h4" fontWeight={800} sx={{ background: 'linear-gradient(135deg, #A78BFA, #67E8F9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              LeaderHabit
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">Build streaks. Beat your friends. Level up.</Typography>
        </Box>

        <Card>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight={700} mb={0.5}>Welcome back</Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>Sign in to continue your streak 🔥</Typography>

            {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

            <Box component="form" onSubmit={handleSubmit} noValidate>
              <TextField
                id="login-email"
                label="Email" name="email" type="email" fullWidth required
                value={form.email} onChange={handleChange}
                sx={{ mb: 2 }} autoComplete="email"
              />
              <TextField
                id="login-password"
                label="Password" name="password" fullWidth required
                type={showPass ? 'text' : 'password'}
                value={form.password} onChange={handleChange}
                autoComplete="current-password"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPass((p) => !p)} edge="end" size="small">
                        {showPass ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 3 }}
              />
              <Button
                id="login-submit-btn"
                type="submit" variant="contained" fullWidth size="large"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}
              >
                {loading ? 'Signing in…' : 'Sign In'}
              </Button>
            </Box>

            <Typography variant="body2" align="center" mt={3} color="text.secondary">
              Don't have an account?{' '}
              <Link component={RouterLink} to="/register" color="primary.light" fontWeight={600}>
                Create one
              </Link>
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
