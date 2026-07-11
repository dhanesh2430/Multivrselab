import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box, Container, Card, CardContent, TextField, Button,
  Typography, Alert, Link, InputAdornment, IconButton, CircularProgress,
} from '@mui/material';
import { Visibility, VisibilityOff, BoltOutlined } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register, loading } = useAuth();
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) return setError('Passwords do not match.');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    try {
      const result = await register(form.username, form.email, form.password);
      if (!result.success) setError(result.message);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Registration failed.';
      setError(errMsg);
    }
  };

  return (
    <Box className="gradient-bg" sx={{ display: 'flex', alignItems: 'center', minHeight: '100vh' }}>
      <Container maxWidth="xs">
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <BoltOutlined sx={{ fontSize: 40, color: 'primary.light' }} />
            <Typography variant="h4" fontWeight={800} sx={{ background: 'linear-gradient(135deg, #A78BFA, #67E8F9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              LeaderHabit
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">Join the competition. Start building habits.</Typography>
        </Box>

        <Card>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight={700} mb={0.5}>Create account</Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>Start your streak today 🚀</Typography>

            {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

            <Box component="form" onSubmit={handleSubmit} noValidate>
              <TextField
                id="reg-username" label="Username" name="username" fullWidth required
                value={form.username} onChange={handleChange} sx={{ mb: 2 }} autoComplete="username"
              />
              <TextField
                id="reg-email" label="Email" name="email" type="email" fullWidth required
                value={form.email} onChange={handleChange} sx={{ mb: 2 }} autoComplete="email"
              />
              <TextField
                id="reg-password" label="Password" name="password" fullWidth required
                type={showPass ? 'text' : 'password'}
                value={form.password} onChange={handleChange}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPass((p) => !p)} edge="end" size="small">
                        {showPass ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />
              <TextField
                id="reg-confirm" label="Confirm Password" name="confirm" fullWidth required
                type={showPass ? 'text' : 'password'}
                value={form.confirm} onChange={handleChange}
                sx={{ mb: 3 }} autoComplete="new-password"
              />
              <Button
                id="reg-submit-btn"
                type="submit" variant="contained" fullWidth size="large"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}
              >
                {loading ? 'Creating account…' : 'Create Account'}
              </Button>
            </Box>

            <Typography variant="body2" align="center" mt={3} color="text.secondary">
              Already have an account?{' '}
              <Link component={RouterLink} to="/login" color="primary.light" fontWeight={600}>
                Sign in
              </Link>
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
