import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box, Container, Grid, Typography, Card, CardContent, Button,
  Paper, Avatar, Chip, CircularProgress, Alert, Divider, List,
  ListItem, ListItemIcon, ListItemText, useTheme, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, FormHelperText, Snackbar
} from '@mui/material';
import {
  ArrowBackOutlined, EmojiEventsOutlined, LocalFireDepartmentOutlined,
  LeaderboardOutlined, GroupsOutlined, TaskAltOutlined, CalendarTodayOutlined,
  EditOutlined, KeyOutlined, CheckCircleOutlined, PersonOutlined
} from '@mui/icons-material';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export const avatarEmojis = {
  avatar1: '🦊',
  avatar2: '🐱',
  avatar3: '🐨',
  avatar4: '🦁',
  avatar5: '🐼',
  avatar6: '🐸',
};

export default function ProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const { user: currentUser, updateUser } = useAuth();
  
  const [profile, setProfile] = useState(null);
  const [habits, setHabits] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', username: '', email: '', avatar: 'avatar1' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [pwForm, setPwForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');

  const [toast, setToast] = useState({ open: false, msg: '', severity: 'success' });

  const fetchProfile = async () => {
    try {
      const { data } = await api.get(`/auth/profile/${id}`);
      setProfile(data.user);
      setHabits(data.habits || []);
      setGroups(data.groups || []);
      
      if (data.isSelf) {
        setEditForm({
          name: data.user.name || '',
          username: data.user.username || '',
          email: data.user.email || '',
          avatar: data.user.avatar || 'avatar1'
        });
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
      setError(err.response?.data?.message || 'Could not load user profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      setLoading(true);
      fetchProfile();
    }
  }, [id]);

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError('');
    try {
      const { data } = await api.put('/auth/profile', editForm);
      setProfile(data.user);
      // Sync with global auth state
      updateUser(data.user);
      setEditOpen(false);
      setToast({ open: true, msg: 'Profile updated successfully! 👤', severity: 'success' });
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setEditLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('New passwords do not match.');
      return;
    }
    setPwLoading(true);
    setPwError('');
    try {
      await api.put('/auth/password', {
        oldPassword: pwForm.oldPassword,
        newPassword: pwForm.newPassword
      });
      setPasswordOpen(false);
      setPwForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setToast({ open: true, msg: 'Password changed successfully! 🔑', severity: 'success' });
    } catch (err) {
      setPwError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setPwLoading(false);
    }
  };

  if (loading) {
    return (
      <Box className="gradient-bg" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress size={50} color="primary" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box className="gradient-bg" sx={{ minHeight: '100vh', pt: 10 }}>
        <Container maxWidth="sm">
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>
          <Button variant="contained" startIcon={<ArrowBackOutlined />} onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </Container>
      </Box>
    );
  }

  const isSelf = currentUser?.id === id || currentUser?._id === id;

  return (
    <Box className="gradient-bg" sx={{ minHeight: '100vh', pb: 6 }}>
      <Navbar />

      <Container maxWidth="md" sx={{ pt: 12 }}>
        {/* Back Button */}
        <Button
          id="profile-back-btn"
          component={RouterLink}
          to="/dashboard"
          startIcon={<ArrowBackOutlined />}
          sx={{ mb: 4, color: 'text.secondary', '&:hover': { color: 'primary.light' } }}
        >
          Back to Dashboard
        </Button>

        <Grid container spacing={4}>
          {/* Left Column: User Header & Stats */}
          <Grid item xs={12} md={5}>
            <Card className="glass-card" sx={{ p: 1, mb: 3 }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', py: 4 }}>
                <Avatar
                  sx={{
                    width: 100,
                    height: 100,
                    bgcolor: 'primary.main',
                    fontSize: '2.5rem',
                    fontWeight: 800,
                    boxShadow: '0 8px 24px rgba(124, 58, 237, 0.4)',
                    mb: 2,
                    border: `3px solid ${theme.palette.primary.light}`
                  }}
                >
                  {avatarEmojis[profile?.avatar] || profile?.username?.[0]?.toUpperCase()}
                </Avatar>

                <Typography variant="h5" fontWeight={800} sx={{ mb: 0.5 }}>
                  {profile?.name || profile?.username}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  @{profile?.username}
                </Typography>
                
                {isSelf && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                    {profile?.email}
                  </Typography>
                )}

                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5, mb: 3 }}>
                  <CalendarTodayOutlined sx={{ fontSize: 14 }} />
                  Joined {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'recently'}
                </Typography>

                {/* Edit Controls for Personal Profile */}
                {isSelf && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%' }}>
                    <Button
                      id="edit-profile-btn"
                      variant="contained"
                      size="small"
                      startIcon={<EditOutlined />}
                      onClick={() => setEditOpen(true)}
                      fullWidth
                    >
                      Edit Profile
                    </Button>
                    <Button
                      id="change-password-btn"
                      variant="outlined"
                      size="small"
                      color="secondary"
                      startIcon={<KeyOutlined />}
                      onClick={() => setPasswordOpen(true)}
                      fullWidth
                    >
                      Change Password
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats Summary */}
            <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', mb: 2, ml: 1 }}>
              Performance Stats
            </Typography>

            <Paper className="glass-card" sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Points Stat */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'rgba(124,58,237,0.15)', color: 'primary.light' }}>
                  <EmojiEventsOutlined />
                </Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary">Total Points</Typography>
                  <Typography variant="h6" fontWeight={800}>{profile?.totalPoints?.toLocaleString() ?? 0} pts</Typography>
                </Box>
              </Box>

              <Divider sx={{ opacity: 0.5 }} />

              {/* Rank Stat */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'rgba(6,182,212,0.15)', color: 'secondary.light' }}>
                  <LeaderboardOutlined />
                </Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary">Global Rank</Typography>
                  <Typography variant="h6" fontWeight={800}>#{profile?.globalRank ?? 1}</Typography>
                </Box>
              </Box>

              <Divider sx={{ opacity: 0.5 }} />

              {/* Current Streak Stat */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar className="streak-fire" sx={{ bgcolor: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}>
                  <LocalFireDepartmentOutlined />
                </Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary">Current Streak</Typography>
                  <Typography variant="h6" fontWeight={800} color="warning.main">
                    {profile?.currentStreak ?? 0} {profile?.currentStreak === 1 ? 'Day' : 'Days'} 🔥
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ opacity: 0.5 }} />

              {/* Longest Streak Stat */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar className="streak-fire" sx={{ bgcolor: 'rgba(245,158,11,0.08)', color: '#EF4444' }}>
                  <LocalFireDepartmentOutlined />
                </Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary">Longest Streak</Typography>
                  <Typography variant="h6" fontWeight={800} color="error.light">
                    {profile?.longestStreak ?? 0} {profile?.longestStreak === 1 ? 'Day' : 'Days'} ⚡
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* Right Column: Habits and Groups */}
          <Grid item xs={12} md={7}>
            <Grid container spacing={2} sx={{ mb: 4 }}>
              <Grid item xs={4}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 2 }}>
                  <Typography variant="h5" fontWeight={800} color="primary.light">{profile?.habitsCompleted ?? 0}</Typography>
                  <Typography variant="caption" color="text.secondary">Completions</Typography>
                </Paper>
              </Grid>
              <Grid item xs={4}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 2 }}>
                  <Typography variant="h5" fontWeight={800} color="secondary.light">{profile?.friendsCount ?? 0}</Typography>
                  <Typography variant="caption" color="text.secondary">Friends</Typography>
                </Paper>
              </Grid>
              <Grid item xs={4}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 2 }}>
                  <Typography variant="h5" fontWeight={800} color="warning.light">{profile?.groupsJoinedCount ?? 0}</Typography>
                  <Typography variant="caption" color="text.secondary">Lobbies</Typography>
                </Paper>
              </Grid>
            </Grid>

            {/* Habits Section */}
            <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <TaskAltOutlined color="primary" /> Habits Tracking ({habits.length})
            </Typography>

            <Paper className="glass-card" sx={{ p: 3, mb: 4 }}>
              {habits.length === 0 ? (
                <Typography color="text.secondary" align="center" py={2}>
                  No active habits being tracked.
                </Typography>
              ) : (
                <List disablePadding>
                  {habits.map((habit, idx) => (
                    <Box key={habit._id}>
                      {idx > 0 && <Divider sx={{ my: 2, opacity: 0.5 }} />}
                      <ListItem disableGutters sx={{ alignItems: 'flex-start' }}>
                        <ListItemIcon sx={{ minWidth: 36, mt: 0.5 }}>
                          <TaskAltOutlined color="success" />
                        </ListItemIcon>
                        <ListItemText
                          primary={habit.title}
                          secondary={`Deadline: ${habit.deadline} (${habit.timezone}) · Target: ${habit.targetType}`}
                          primaryTypographyProps={{ fontWeight: 700, variant: 'body1', style: { cursor: 'pointer' }, onClick: () => navigate(`/habit/${habit._id}`) }}
                          secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                        />
                        <Chip
                          label={`Completions: ${habit.completions?.length || 0}`}
                          size="small"
                          onClick={() => navigate(`/habit/${habit._id}`)}
                          sx={{ alignSelf: 'center', bgcolor: 'rgba(16,185,129,0.1)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)', fontWeight: 700, cursor: 'pointer' }}
                        />
                      </ListItem>
                    </Box>
                  ))}
                </List>
              )}
            </Paper>

            {/* Groups Section */}
            <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <GroupsOutlined color="secondary" /> Competing In ({groups.length})
            </Typography>

            <Paper className="glass-card" sx={{ p: 3 }}>
              {groups.length === 0 ? (
                <Typography color="text.secondary" align="center" py={2}>
                  Not a member of any habit group.
                </Typography>
              ) : (
                <List disablePadding>
                  {groups.map((group, idx) => (
                    <Box key={group._id}>
                      {idx > 0 && <Divider sx={{ my: 2, opacity: 0.5 }} />}
                      <ListItem disableGutters>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <GroupsOutlined color="secondary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={group.groupName}
                          secondary={group.description || 'Active Competing Lobby'}
                          primaryTypographyProps={{ fontWeight: 700, variant: 'body1' }}
                          secondaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                        />
                        {isSelf && (
                          <Chip
                            label={`Invite Code: ${group.inviteCode}`}
                            size="small"
                            variant="outlined"
                            sx={{ alignSelf: 'center', fontWeight: 600 }}
                          />
                        )}
                      </ListItem>
                    </Box>
                  ))}
                </List>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* Edit Profile Dialog */}
      <Dialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { bgcolor: '#12121A', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 3 } }}
      >
        <form onSubmit={handleEditSubmit}>
          <DialogTitle sx={{ fontWeight: 800 }}>Edit Profile</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            {editError && <Alert severity="error" sx={{ borderRadius: 2 }}>{editError}</Alert>}
            
            <TextField
              label="Display Name"
              size="small"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              fullWidth
            />
            <TextField
              label="Username"
              size="small"
              value={editForm.username}
              onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
              fullWidth
            />
            <TextField
              label="Email"
              size="small"
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              fullWidth
            />

            {/* Avatar picker grid */}
            <Typography variant="body2" fontWeight={700} sx={{ mt: 1 }}>Select Avatar Profile Emoji:</Typography>
            <Grid container spacing={1}>
              {Object.entries(avatarEmojis).map(([key, emoji]) => (
                <Grid item xs={2} key={key}>
                  <Box
                    onClick={() => setEditForm({ ...editForm, avatar: key })}
                    sx={{
                      cursor: 'pointer',
                      fontSize: '1.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      p: 1,
                      borderRadius: 2,
                      bgcolor: editForm.avatar === key ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.03)',
                      border: `2px solid ${editForm.avatar === key ? '#7C3AED' : 'transparent'}`,
                      '&:hover': { bgcolor: 'rgba(124,58,237,0.1)' },
                      transition: 'all 0.15s'
                    }}
                  >
                    {emoji}
                  </Box>
                </Grid>
              ))}
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setEditOpen(false)} color="inherit" size="small">Cancel</Button>
            <Button type="submit" variant="contained" disabled={editLoading} size="small" startIcon={editLoading && <CircularProgress size={14} />}>
              Save Profile
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog
        open={passwordOpen}
        onClose={() => setPasswordOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { bgcolor: '#12121A', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 3 } }}
      >
        <form onSubmit={handlePasswordSubmit}>
          <DialogTitle sx={{ fontWeight: 800 }}>Change Password</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            {pwError && <Alert severity="error" sx={{ borderRadius: 2 }}>{pwError}</Alert>}
            
            <TextField
              label="Current Password"
              type="password"
              size="small"
              value={pwForm.oldPassword}
              onChange={(e) => setPwForm({ ...pwForm, oldPassword: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="New Password (min 6 chars)"
              type="password"
              size="small"
              value={pwForm.newPassword}
              onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Confirm New Password"
              type="password"
              size="small"
              value={pwForm.confirmPassword}
              onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
              fullWidth
              required
            />
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setPasswordOpen(false)} color="inherit" size="small">Cancel</Button>
            <Button type="submit" variant="contained" color="secondary" disabled={pwLoading} size="small" startIcon={pwLoading && <CircularProgress size={14} />}>
              Update Password
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Toast Notification */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={toast.severity} onClose={() => setToast({ ...toast, open: false })} variant="filled" sx={{ borderRadius: 2, fontWeight: 600 }}>
          {toast.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
