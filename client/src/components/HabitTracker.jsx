import { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Chip, LinearProgress,
  CircularProgress, Skeleton, Alert, IconButton, Tooltip, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem, ListItemText, Grid
} from '@mui/material';
import {
  CheckCircleOutlined, AddOutlined, LocalFireDepartmentOutlined,
  AccessTimeOutlined, DeleteOutlined, PlayArrowOutlined, InfoOutlined,
  EmojiEventsOutlined, BoltOutlined, BarChartOutlined
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function HabitTracker({ selectedGroupId, onHabitComplete, onAddHabit }) {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [completing, setCompleting] = useState({});
  const [starting, setStarting] = useState({});
  const [startedHabits, setStartedHabits] = useState(() => {
    try {
      const saved = localStorage.getItem(`started_habits_${user?.id}`);
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });
  const [pointPopMap, setPointPopMap] = useState({});
  const [error, setError] = useState('');

  // Habit Detail Dialog State
  const [detailHabit, setDetailHabit] = useState(null);

  useEffect(() => {
    if (!selectedGroupId) return;
    fetchHabits();
  }, [selectedGroupId]);

  // Persist started habits status
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`started_habits_${user.id}`, JSON.stringify(startedHabits));
    }
  }, [startedHabits, user?.id]);

  const fetchHabits = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/habits', { params: { groupId: selectedGroupId } });
      setHabits(data.habits || []);
    } catch (err) {
      setError('Failed to load habits.');
    } finally {
      setLoading(false);
    }
  };

  const isCompleted = (habit) => {
    const now = new Date();
    const windowStart = new Date(now);
    if (habit.targetType === 'daily') {
      windowStart.setHours(0, 0, 0, 0);
    } else {
      const day = windowStart.getDay();
      windowStart.setDate(windowStart.getDate() - day);
      windowStart.setHours(0, 0, 0, 0);
    }
    return habit.completions?.some((t) => new Date(t.timestamp) >= windowStart) || false;
  };

  const handleStart = async (habitId) => {
    setStarting((p) => ({ ...p, [habitId]: true }));
    try {
      await api.post(`/habits/${habitId}/start`);
      setStartedHabits((p) => ({ ...p, [habitId]: new Date().toDateString() }));
    } catch (err) {
      setError('Could not broadcast start activity.');
      setTimeout(() => setError(''), 4000);
    } finally {
      setStarting((p) => ({ ...p, [habitId]: false }));
    }
  };

  const handleComplete = async (habit) => {
    if (completing[habit._id] || isCompleted(habit)) return;
    setCompleting((p) => ({ ...p, [habit._id]: true }));
    try {
      const { data } = await api.post(`/habits/${habit._id}/complete`);
      setPointPopMap((p) => ({ ...p, [habit._id]: `+${data.pointsBreakdown.total}` }));
      setTimeout(() => setPointPopMap((p) => { const n = { ...p }; delete n[habit._id]; return n; }), 1300);
      
      updateUser({
        totalPoints: data.totalPoints,
        currentStreak: data.pointsBreakdown.newStreak,
        globalRank: data.globalRank,
      });

      // Clear start status for this habit
      setStartedHabits((p) => {
        const n = { ...p };
        delete n[habit._id];
        return n;
      });

      await fetchHabits();
      if (onHabitComplete) onHabitComplete(data);
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not complete habit.';
      setError(msg);
      setTimeout(() => setError(''), 4000);
    } finally {
      setCompleting((p) => ({ ...p, [habit._id]: false }));
    }
  };

  const handleDelete = async (habitId) => {
    if (!window.confirm('Delete this habit?')) return;
    try {
      await api.delete(`/habits/${habitId}`);
      setHabits((p) => p.filter((h) => h._id !== habitId));
      if (detailHabit?._id === habitId) setDetailHabit(null);
    } catch (err) {
      setError('Could not delete habit.');
    }
  };

  if (!selectedGroupId) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
          <Typography color="text.secondary">Select a lobby group to view habits</Typography>
        </CardContent>
      </Card>
    );
  }

  const totalCompletions = detailHabit?.completions?.length || 0;
  const totalHabitPoints = detailHabit?.completions?.reduce((acc, curr) => acc + curr.pointsEarned, 0) || 0;

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'stretch', sm: 'center' },
            justifyContent: 'space-between',
            gap: 2,
            mb: 2
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight={700}>Lobby Challenge Habits</Typography>
            <Typography variant="caption" color="text.secondary">
              {habits.filter(isCompleted).length}/{habits.length} completed
            </Typography>
          </Box>
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              width: { xs: '100%', sm: 'auto' },
              justifyContent: { xs: 'space-between', sm: 'flex-end' }
            }}
          >
            <Button
              id="view-group-page-btn"
              variant="outlined" size="small"
              startIcon={<BarChartOutlined />}
              onClick={() => navigate(`/group/${selectedGroupId}`)}
              sx={{
                borderColor: 'rgba(255,255,255,0.1)',
                flex: { xs: 1, sm: 'none' },
                whiteSpace: 'nowrap'
              }}
            >
              Lobby Info
            </Button>
            <Button
              id="add-habit-btn"
              startIcon={<AddOutlined />} size="small" variant="contained"
              color="primary" onClick={onAddHabit}
              sx={{
                flex: { xs: 1, sm: 'none' },
                whiteSpace: 'nowrap'
              }}
            >
              Add Habit
            </Button>
          </Box>
        </Box>

        {/* Progress bar */}
        {habits.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <LinearProgress
              variant="determinate"
              value={(habits.filter(isCompleted).length / habits.length) * 100}
              sx={{
                height: 6, borderRadius: 3,
                bgcolor: 'rgba(255,255,255,0.08)',
                '& .MuiLinearProgress-bar': {
                  background: 'linear-gradient(90deg, #7C3AED, #06B6D4)',
                  borderRadius: 3,
                },
              }}
            />
          </Box>
        )}

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

        {loading ? (
          [...Array(3)].map((_, i) => <Skeleton key={i} variant="rounded" height={72} sx={{ mb: 1, bgcolor: 'rgba(255,255,255,0.05)' }} />)
        ) : habits.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary" mb={1}>No habits active in this lobby</Typography>
            <Button startIcon={<AddOutlined />} onClick={onAddHabit} variant="contained" size="small">
              Create your first habit
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {habits.map((habit) => {
              const done = isCompleted(habit);
              const isCompletingLoading = completing[habit._id];
              const isStartingLoading = starting[habit._id];
              const lastEntry = habit.completions?.[habit.completions.length - 1];
              const wasStartedToday = startedHabits[habit._id] === new Date().toDateString();

              return (
                <Box
                  key={habit._id}
                  className={done ? '' : 'slide-in'}
                  sx={{
                    position: 'relative',
                    display: 'flex', alignItems: 'center', gap: 2,
                    p: 2, borderRadius: 3,
                    bgcolor: done
                      ? 'rgba(16,185,129,0.08)'
                      : wasStartedToday
                      ? 'rgba(124,58,237,0.08)'
                      : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${
                      done
                        ? 'rgba(16,185,129,0.25)'
                        : wasStartedToday
                        ? 'rgba(124,58,237,0.35)'
                        : 'rgba(255,255,255,0.08)'
                    }`,
                    transition: 'all 0.3s ease',
                    '&:hover': !done ? { bgcolor: 'rgba(124,58,237,0.08)', borderColor: 'rgba(124,58,237,0.25)' } : {},
                  }}
                >
                  {/* Point pop */}
                  {pointPopMap[habit._id] && (
                    <Typography className="point-pop" sx={{ top: 8, right: 16, color: 'success.main', fontWeight: 800 }}>
                      {pointPopMap[habit._id]}
                    </Typography>
                  )}

                  {/* Complete check button */}
                  <Tooltip title={done ? 'Completed!' : 'Mark complete'}>
                    <span>
                      <IconButton
                        id={`complete-habit-${habit._id}`}
                        onClick={() => handleComplete(habit)}
                        disabled={done || isCompletingLoading}
                        size="small"
                        sx={{
                          bgcolor: done ? 'rgba(16,185,129,0.2)' : 'rgba(124,58,237,0.1)',
                          color: done ? '#10B981' : 'primary.light',
                          '&:hover': !done ? { bgcolor: 'rgba(124,58,237,0.25)' } : {},
                          transition: 'all 0.2s',
                        }}
                      >
                        {isCompletingLoading ? <CircularProgress size={18} color="inherit" /> : <CheckCircleOutlined />}
                      </IconButton>
                    </span>
                  </Tooltip>

                  {/* Habit info */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography
                        variant="body2" fontWeight={600}
                        sx={{
                          opacity: done ? 0.6 : 1,
                          textDecoration: done ? 'line-through' : 'none',
                          cursor: 'pointer',
                          '&:hover': { color: 'primary.light', textDecoration: 'underline' }
                        }}
                        onClick={() => navigate(`/habit/${habit._id}`)}
                      >
                        {habit.title}
                      </Typography>
                      <IconButton size="small" onClick={() => navigate(`/habit/${habit._id}`)} sx={{ p: 0.2, color: 'text.secondary', opacity: 0.6 }}>
                        <InfoOutlined sx={{ fontSize: 13 }} />
                      </IconButton>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5, flexWrap: 'wrap' }}>
                      <AccessTimeOutlined sx={{ fontSize: 12, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">{habit.deadline}</Typography>
                      <Chip label={habit.difficulty || 'easy'} size="small" sx={{ height: 18, fontSize: '0.65rem', bgcolor: 'rgba(245,158,11,0.1)', color: 'warning.light' }} />
                      
                      {/* Real-time start broadcast button */}
                      {!done && !wasStartedToday && (
                        <Button
                          id={`start-habit-${habit._id}`}
                          variant="text" size="small"
                          onClick={() => handleStart(habit._id)}
                          disabled={isStartingLoading}
                          startIcon={<PlayArrowOutlined sx={{ fontSize: 12 }} />}
                          sx={{ height: 18, py: 0, px: 1, fontSize: '0.65rem', minWidth: 0, color: 'secondary.light' }}
                        >
                          {isStartingLoading ? 'Starting…' : 'Start'}
                        </Button>
                      )}

                      {wasStartedToday && !done && (
                        <Chip
                          label="In Progress ⚡" size="small"
                          sx={{ height: 18, fontSize: '0.65rem', bgcolor: 'rgba(124,58,237,0.15)', color: 'primary.light', border: '1px solid rgba(124,58,237,0.3)', fontWeight: 700 }}
                        />
                      )}

                      {lastEntry && (
                        <Typography variant="caption" color="success.main">+{lastEntry.pointsEarned} pts</Typography>
                      )}
                    </Box>
                  </Box>

                  {/* Streak badge */}
                  {habit.completions?.length > 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <LocalFireDepartmentOutlined className="streak-fire" sx={{ fontSize: 16, color: '#F59E0B' }} />
                      <Typography variant="caption" fontWeight={700} color="warning.main">
                        {habit.completions.length}
                      </Typography>
                    </Box>
                  )}

                  {/* Delete */}
                  <Tooltip title="Delete habit">
                    <IconButton
                      id={`delete-habit-${habit._id}`}
                      size="small" onClick={() => handleDelete(habit._id)}
                      sx={{ color: 'text.secondary', opacity: 0.5, '&:hover': { color: 'error.main', opacity: 1 } }}
                    >
                      <DeleteOutlined sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              );
            })}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
