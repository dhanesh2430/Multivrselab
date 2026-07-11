import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, MenuItem, Box, Alert, CircularProgress, Grid, Typography
} from '@mui/material';
import { AddTaskOutlined } from '@mui/icons-material';
import api from '../api/axios';

const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Kolkata', 'Asia/Tokyo',
  'Asia/Singapore', 'Australia/Sydney', 'Pacific/Auckland',
];

const CATEGORIES = ['Fitness', 'Health', 'Learning', 'Productive', 'Social', 'Mind', 'General'];
const DIFFICULTIES = ['easy', 'medium', 'hard'];
const COLOR_PRESETS = ['#7C3AED', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];

export default function CreateHabitDialog({ open, onClose, selectedGroupId, onCreated }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'General',
    targetType: 'daily',
    dailyTarget: 1,
    weeklyTarget: 5,
    reminderTime: '08:00',
    deadline: '20:00',
    timezone: 'Asia/Kolkata',
    color: '#7C3AED',
    icon: 'Bolt',
    difficulty: 'easy'
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.title.trim()) return setError('Habit title is required.');
    if (!selectedGroupId) return setError('No group selected.');
    setLoading(true);
    try {
      const { data } = await api.post('/habits', { ...form, groupId: selectedGroupId });
      if (onCreated) onCreated(data.habit);
      setForm({
        title: '',
        description: '',
        category: 'General',
        targetType: 'daily',
        dailyTarget: 1,
        weeklyTarget: 5,
        reminderTime: '08:00',
        deadline: '20:00',
        timezone: 'Asia/Kolkata',
        color: '#7C3AED',
        icon: 'Bolt',
        difficulty: 'easy'
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create habit.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { bgcolor: '#12121A', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 3 } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 }}>
        <AddTaskOutlined sx={{ color: 'primary.light' }} />
        Create Challenge Habit
      </DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
        <Box component="form" id="create-habit-form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                id="habit-title"
                label="Habit Title" name="title" required fullWidth size="small"
                value={form.title} onChange={handleChange}
                placeholder="e.g. Daily Coding Challenge"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                id="habit-description"
                label="Description" name="description" fullWidth size="small"
                value={form.description} onChange={handleChange}
                placeholder="Write a brief goal outline..."
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                id="habit-category"
                select label="Category" name="category" fullWidth size="small"
                value={form.category} onChange={handleChange}
              >
                {CATEGORIES.map(c => (
                  <MenuItem key={c} value={c}>{c}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                id="habit-difficulty"
                select label="Difficulty" name="difficulty" fullWidth size="small"
                value={form.difficulty} onChange={handleChange}
              >
                {DIFFICULTIES.map(d => (
                  <MenuItem key={d} value={d}>{d.toUpperCase()}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                id="habit-target-type"
                select label="Target Period" name="targetType" fullWidth size="small"
                value={form.targetType} onChange={handleChange}
              >
                <MenuItem value="daily">Daily Target</MenuItem>
                <MenuItem value="weekly">Weekly Target</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                id="habit-timezone"
                select label="Timezone" name="timezone" fullWidth size="small"
                value={form.timezone} onChange={handleChange}
              >
                {TIMEZONES.map((tz) => (
                  <MenuItem key={tz} value={tz}>{tz}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                id="habit-deadline"
                label="Daily Deadline (HH:MM)" name="deadline" fullWidth size="small"
                value={form.deadline} onChange={handleChange}
                placeholder="e.g. 20:00"
                helperText="24h local timezone format"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                id="habit-reminder-time"
                label="Reminder Time (HH:MM)" name="reminderTime" fullWidth size="small"
                value={form.reminderTime} onChange={handleChange}
                placeholder="e.g. 08:00"
              />
            </Grid>

            {/* Color Presets */}
            <Grid item xs={12}>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>Theme Color:</Typography>
              <Grid container spacing={1}>
                {COLOR_PRESETS.map((color) => (
                  <Grid item xs={2} key={color}>
                    <Box
                      onClick={() => setForm((p) => ({ ...p, color }))}
                      sx={{
                        cursor: 'pointer',
                        height: 32,
                        borderRadius: 1,
                        bgcolor: color,
                        border: `2px solid ${form.color === color ? '#FFFFFF' : 'transparent'}`,
                        transition: 'all 0.1s',
                        '&:hover': { transform: 'scale(1.05)' }
                      }}
                    />
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button id="cancel-habit-btn" onClick={onClose} variant="outlined" color="inherit" sx={{ borderColor: 'rgba(255,255,255,0.15)' }}>
          Cancel
        </Button>
        <Button
          id="submit-habit-btn"
          form="create-habit-form" type="submit" variant="contained" disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <AddTaskOutlined />}
        >
          {loading ? 'Creating…' : 'Create Habit'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
