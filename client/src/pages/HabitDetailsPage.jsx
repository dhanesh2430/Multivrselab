import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box, Container, Grid, Typography, Card, CardContent, Button,
  Paper, Avatar, Chip, CircularProgress, Alert, Divider, List,
  ListItem, ListItemText, useTheme, IconButton, Tooltip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem as SelectMenuItem
} from '@mui/material';
import {
  ArrowBackOutlined, EditOutlined, DeleteOutlined, EmojiEventsOutlined,
  LocalFireDepartmentOutlined, AccessTimeOutlined, CategoryOutlined,
  CalendarTodayOutlined, InfoOutlined, StarOutlined
} from '@mui/icons-material';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const difficulties = ['easy', 'medium', 'hard'];
const categories = ['Fitness', 'Health', 'Learning', 'Productive', 'Social', 'Mind', 'General'];

export default function HabitDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useAuth();

  const [habit, setHabit] = useState(null);
  const [completions, setCompletions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Editing habit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    category: 'General',
    targetType: 'daily',
    dailyTarget: 1,
    weeklyTarget: 5,
    reminderTime: '09:00',
    deadline: '20:00',
    timezone: 'Asia/Kolkata',
    color: '#7C3AED',
    icon: 'Bolt',
    difficulty: 'easy'
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  const fetchHabitDetails = async () => {
    try {
      const { data } = await api.get(`/habits`);
      const matched = data.habits.find(h => h._id === id);
      if (!matched) {
        setError('Habit not found or not owned by you.');
        setLoading(false);
        return;
      }
      setHabit(matched);

      // Fetch completions history
      const historyRes = await api.get(`/habits/${id}/history`);
      setCompletions(historyRes.data.completions || []);

      // Populate edit form
      setEditForm({
        title: matched.title,
        description: matched.description || '',
        category: matched.category || 'General',
        targetType: matched.targetType || 'daily',
        dailyTarget: matched.dailyTarget || 1,
        weeklyTarget: matched.weeklyTarget || 5,
        reminderTime: matched.reminderTime || '09:00',
        deadline: matched.deadline,
        timezone: matched.timezone,
        color: matched.color || '#7C3AED',
        icon: matched.icon || 'Bolt',
        difficulty: matched.difficulty || 'easy'
      });
    } catch (err) {
      console.error('Failed to load habit details:', err);
      setError('Could not load habit details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      setLoading(true);
      fetchGroupAndHabitDetails();
    }
  }, [id]);

  const fetchGroupAndHabitDetails = async () => {
    await fetchHabitDetails();
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError('');
    try {
      const { data } = await api.put(`/habits/${id}`, editForm);
      setHabit(data.habit);
      setEditOpen(false);
      fetchHabitDetails();
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update habit.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteHabit = async () => {
    if (!window.confirm('Are you sure you want to permanently delete this habit and all its completions history?')) return;
    try {
      await api.delete(`/habits/${id}`);
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to delete habit.');
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

  // Calculate statistics
  const totalCompletions = completions.length;
  const totalPoints = completions.reduce((sum, c) => sum + c.pointsEarned, 0);
  
  // Calculate completion percentage for the past 30 days
  const past30Days = [...Array(30)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const completionDays = completions.map(c => {
    const d = new Date(c.timestamp);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  });

  const completedPast30 = past30Days.filter(day => completionDays.includes(day.getTime())).length;
  const completionRate = Math.round((completedPast30 / 30) * 100);

  return (
    <Box className="gradient-bg" sx={{ minHeight: '100vh', pb: 6 }}>
      <Navbar />

      <Container maxWidth="md" sx={{ pt: 12 }}>
        {/* Back and Edit Actions */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'stretch', sm: 'center' },
            gap: 2,
            mb: 3
          }}
        >
          <Button
            id="habit-back-btn"
            component={RouterLink}
            to="/dashboard"
            startIcon={<ArrowBackOutlined />}
            sx={{
              color: 'text.secondary',
              '&:hover': { color: 'primary.light' },
              alignSelf: { xs: 'flex-start', sm: 'auto' }
            }}
          >
            Back to Dashboard
          </Button>
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              width: { xs: '100%', sm: 'auto' },
              justifyContent: { xs: 'space-between', sm: 'flex-end' }
            }}
          >
            <Button
              id="habit-edit-btn"
              variant="outlined"
              size="small"
              startIcon={<EditOutlined />}
              onClick={() => setEditOpen(true)}
              sx={{
                borderColor: 'rgba(255,255,255,0.15)',
                flex: { xs: 1, sm: 'none' },
                whiteSpace: 'nowrap'
              }}
            >
              Edit
            </Button>
            <Button
              id="habit-delete-btn"
              variant="contained"
              color="error"
              size="small"
              startIcon={<DeleteOutlined />}
              onClick={handleDeleteHabit}
              sx={{
                flex: { xs: 1, sm: 'none' },
                whiteSpace: 'nowrap'
              }}
            >
              Delete
            </Button>
          </Box>
        </Box>

        {/* Habit Main Card */}
        <Paper
          className="glass-card"
          sx={{
            p: 3, mb: 4,
            borderLeft: `6px solid ${habit?.color || '#7C3AED'}`,
            borderRadius: 3
          }}
        >
          <Grid container spacing={3}>
            <Grid item xs={12} sm={8}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <Typography
                  variant="h4"
                  fontWeight={800}
                  sx={{
                    fontSize: { xs: '1.75rem', sm: '2.125rem' },
                    letterSpacing: '-0.02em'
                  }}
                >
                  {habit?.title}
                </Typography>
                <Chip
                  label={habit?.category || 'General'}
                  size="small"
                  icon={<CategoryOutlined sx={{ fontSize: 12 }} />}
                  sx={{ bgcolor: 'rgba(255,255,255,0.06)', color: 'text.secondary', height: 22 }}
                />
              </Box>
              <Typography variant="body1" color="text.secondary" paragraph>
                {habit?.description || 'No description provided.'}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <AccessTimeOutlined sx={{ fontSize: 14 }} /> Deadline: {habit?.deadline} ({habit?.timezone})
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <StarOutlined sx={{ fontSize: 14, color: 'warning.main' }} /> Difficulty: {habit?.difficulty?.toUpperCase()}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <CalendarTodayOutlined sx={{ fontSize: 14 }} /> Mode: {habit?.targetType?.toUpperCase()}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Stats Panel */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}>
            <Card className="glass-card" sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 3 }}>
              <Avatar sx={{ bgcolor: 'rgba(124,58,237,0.15)', color: 'primary.light' }}>
                <EmojiEventsOutlined />
              </Avatar>
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">Points Earned</Typography>
                <Typography variant="h5" fontWeight={800}>{totalPoints.toLocaleString()} pts</Typography>
              </Box>
            </Card>
          </Grid>
          <Grid item xs={6} sm={4}>
            <Card className="glass-card" sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 3 }}>
              <Avatar sx={{ bgcolor: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}>
                <LocalFireDepartmentOutlined />
              </Avatar>
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">Current Streak</Typography>
                <Typography variant="h5" fontWeight={800} color="warning.main">{user?.currentStreak || 0} Days</Typography>
              </Box>
            </Card>
          </Grid>
          <Grid item xs={6} sm={4}>
            <Card className="glass-card" sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 3 }}>
              <Avatar sx={{ bgcolor: 'rgba(16,185,129,0.15)', color: '#10B981' }}>
                <InfoOutlined />
              </Avatar>
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">30-Day Consistency</Typography>
                <Typography variant="h5" fontWeight={800} color="success.main">{completionRate}%</Typography>
              </Box>
            </Card>
          </Grid>
        </Grid>

        {/* Visual Consistency Grid (Last 30 Days) */}
        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={800} color="primary.light" gutterBottom>
              30-Day Consistency Map
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
              Your check-in history mapping for the past 30 days. Purple blocks signify completed days.
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: { xs: 0.5, sm: 1 }, my: 2 }}>
              {[...past30Days].reverse().map((day, idx) => {
                const completed = completionDays.includes(day.getTime());
                return (
                  <Tooltip key={idx} title={day.toLocaleDateString([], { month: 'short', day: 'numeric' })}>
                    <Box
                      sx={{
                        aspectRatio: '1',
                        borderRadius: 1,
                        bgcolor: completed ? (habit?.color || '#7C3AED') : 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        opacity: completed ? 1 : 0.4,
                        transition: 'transform 0.1s',
                        '&:hover': { transform: 'scale(1.1)', cursor: 'pointer' }
                      }}
                    />
                  </Tooltip>
                );
              })}
            </Box>
          </CardContent>
        </Card>

        {/* Completion History Log */}
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={800} color="primary.light" sx={{ mb: 2 }}>
              Completion History Log
            </Typography>
            {completions.length === 0 ? (
              <Typography color="text.secondary" align="center" py={2}>
                No completions recorded yet.
              </Typography>
            ) : (
              <List dense disablePadding sx={{ maxHeight: 300, overflowY: 'auto' }}>
                {completions.map((c, idx) => (
                  <ListItem key={c._id} sx={{ px: 0, py: 1, borderBottom: '1px solid rgba(255,255,255,0.04)', '&:last-child': { borderBottom: 'none' } }}>
                    <ListItemText
                      primary={new Date(c.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      secondary={c.isLate ? 'Late Completion (Streak Kept)' : 'Completed On Time'}
                      primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                      secondaryTypographyProps={{ variant: 'caption', color: c.isLate ? 'warning.main' : 'text.secondary' }}
                    />
                    <Box sx={{ textAlign: 'right' }}>
                      <Chip
                        label={`+${c.pointsEarned} pts`}
                        size="small"
                        color="success"
                        sx={{ height: 22, fontSize: '0.7rem', fontWeight: 700 }}
                      />
                    </Box>
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </Container>

      {/* Edit Habit Dialog */}
      <Dialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { bgcolor: '#12121A', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 3 } }}
      >
        <form onSubmit={handleEditSubmit}>
          <DialogTitle sx={{ fontWeight: 800 }}>Edit Habit Details</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            {editError && <Alert severity="error" sx={{ borderRadius: 2 }}>{editError}</Alert>}
            
            <TextField
              label="Habit Title"
              size="small"
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Description"
              size="small"
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              fullWidth
            />
            <TextField
              select
              label="Category"
              size="small"
              value={editForm.category}
              onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
              fullWidth
            >
              {categories.map((c) => (
                <SelectMenuItem key={c} value={c}>{c}</SelectMenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Difficulty"
              size="small"
              value={editForm.difficulty}
              onChange={(e) => setEditForm({ ...editForm, difficulty: e.target.value })}
              fullWidth
            >
              {difficulties.map((d) => (
                <SelectMenuItem key={d} value={d}>{d.toUpperCase()}</SelectMenuItem>
              ))}
            </TextField>
            <TextField
              label="Deadline (HH:MM)"
              size="small"
              placeholder="e.g. 20:00"
              value={editForm.deadline}
              onChange={(e) => setEditForm({ ...editForm, deadline: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Reminder Time (HH:MM)"
              size="small"
              placeholder="e.g. 08:00"
              value={editForm.reminderTime}
              onChange={(e) => setEditForm({ ...editForm, reminderTime: e.target.value })}
              fullWidth
            />
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setEditOpen(false)} color="inherit" size="small">Cancel</Button>
            <Button type="submit" variant="contained" disabled={editLoading} size="small">
              Save Changes
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
