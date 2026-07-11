import { useState, useEffect } from 'react';
import {
  Box, Container, Grid, Typography, Fab, Tooltip, Snackbar, Alert,
  useMediaQuery, useTheme, Drawer, IconButton, Tab, Tabs, Paper, Button, Avatar
} from '@mui/material';
import {
  AddOutlined, PeopleOutlined, GroupsOutlined, MenuOutlined, CloseOutlined,
  BoltOutlined
} from '@mui/icons-material';
import Navbar from '../components/Navbar';
import HabitTracker from '../components/HabitTracker';
import Leaderboard from '../components/Leaderboard';
import NotificationFeed from '../components/NotificationFeed';
import FriendManager from '../components/FriendManager';
import GroupManager from '../components/GroupManager';
import CreateHabitDialog from '../components/CreateHabitDialog';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { avatarEmojis } from './ProfilePage';
import api from '../api/axios';

export default function DashboardPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { socket } = useSocket();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [selectedGroupId, setSelectedGroupId] = useState(() => {
    return localStorage.getItem('hf_selected_group_id') || null;
  });
  const [createHabitOpen, setCreateHabitOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sideTab, setSideTab] = useState(0);

  // Load and verify user groups on mount to select the first one if needed
  useEffect(() => {
    const fetchUserGroups = async () => {
      try {
        const { data } = await api.get('/groups');
        if (data.groups && data.groups.length > 0) {
          const savedGroupId = localStorage.getItem('hf_selected_group_id');
          const exists = data.groups.some(g => g._id === savedGroupId);
          if (exists) {
            setSelectedGroupId(savedGroupId);
          } else {
            setSelectedGroupId(data.groups[0]._id);
            localStorage.setItem('hf_selected_group_id', data.groups[0]._id);
          }
        } else {
          setSelectedGroupId(null);
          localStorage.removeItem('hf_selected_group_id');
        }
      } catch (err) {
        console.error('Failed to fetch groups on mount:', err);
      }
    };
    fetchUserGroups();
  }, []);

  const handleSelectGroup = (id) => {
    setSelectedGroupId(id);
    if (id) {
      localStorage.setItem('hf_selected_group_id', id);
    } else {
      localStorage.removeItem('hf_selected_group_id');
    }
  };
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });
  const [habitKey, setHabitKey] = useState(0); // force HabitTracker remount on new habit

  // Listen for notifications for snackbar toasts
  useEffect(() => {
    if (!socket) return;
    const onNotif = (payload) => {
      const msg = typeof payload === 'string' ? payload : payload?.message;
      setSnack({ open: true, msg, severity: 'info' });
    };
    socket.on('notification', onNotif);
    return () => socket.off('notification', onNotif);
  }, [socket]);

  const handleHabitCreated = () => {
    setHabitKey((k) => k + 1);
  };

  const handleHabitComplete = (data) => {
    setSnack({
      open: true,
      msg: `✅ +${data.pointsBreakdown.total} pts earned! ${data.pointsBreakdown.speedBonus > 0 ? `⚡ ${data.pointsBreakdown.speedBonus} speed bonus!` : ''}`,
      severity: 'success',
    });
  };

  const SidePanel = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Tabs
        value={sideTab} onChange={(_, v) => setSideTab(v)}
        variant="fullWidth"
        sx={{
          '& .MuiTab-root': { fontSize: '0.75rem', fontWeight: 600, textTransform: 'none' },
          '& .MuiTabs-indicator': { bgcolor: 'primary.main', height: 3, borderRadius: 2 },
          bgcolor: 'rgba(255,255,255,0.04)', borderRadius: 2, p: 0.5,
        }}
      >
        <Tab id="tab-groups" icon={<GroupsOutlined sx={{ fontSize: 18 }} />} iconPosition="start" label="Groups" />
        <Tab id="tab-friends" icon={<PeopleOutlined sx={{ fontSize: 18 }} />} iconPosition="start" label="Friends" />
      </Tabs>

      {sideTab === 0 && (
        <GroupManager
          onSelectGroup={(id) => { handleSelectGroup(id); setDrawerOpen(false); }}
          selectedGroupId={selectedGroupId}
        />
      )}
      {sideTab === 1 && <FriendManager />}
    </Box>
  );

  return (
    <Box className="gradient-bg" sx={{ minHeight: '100vh' }}>
      <Navbar />

      {/* Main content below AppBar */}
      <Box sx={{ pt: { xs: 8, sm: 9 }, pb: 4 }}>
        <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3 } }}>

          {/* Lobby Title Header */}
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
              <Typography
                variant="h4"
                fontWeight={800}
                sx={{
                  fontSize: { xs: '1.75rem', sm: '2.125rem' },
                  letterSpacing: '-0.02em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <BoltOutlined color="primary" /> LEADERHABIT LOBBY
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Build streaks. Beat your friends. Level up.
              </Typography>
            </Box>

            <Button
              id="sidebar-toggle-btn"
              variant="contained"
              color="primary"
              size="medium"
              onClick={() => setDrawerOpen(true)}
              startIcon={<GroupsOutlined />}
              sx={{
                boxShadow: '0 4px 14px rgba(124,58,237,0.3)',
                alignSelf: { xs: 'flex-start', sm: 'auto' },
                width: { xs: '100%', sm: 'auto' }
              }}
            >
              Groups & Friends
            </Button>
          </Box>

          {/* Profile Status Bar */}
          <Paper
            className="glass-card"
            sx={{
              p: 2,
              mb: 4,
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'flex-start', sm: 'center' },
              justifyContent: 'space-between',
              gap: 2,
              background: 'linear-gradient(135deg, rgba(124,58,237,0.05) 0%, rgba(6,182,212,0.05) 100%)',
              borderColor: 'rgba(124,58,237,0.15)',
              borderRadius: 3
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar
                onClick={() => navigate(`/profile/${user?.id || user?._id}`)}
                sx={{
                  bgcolor: 'primary.main',
                  cursor: 'pointer',
                  width: 36,
                  height: 36,
                  fontSize: '1rem',
                  boxShadow: '0 4px 10px rgba(124,58,237,0.3)',
                  transition: 'transform 0.15s',
                  '&:hover': { transform: 'scale(1.05)' }
                }}
              >
                {avatarEmojis[user?.avatar] || user?.username?.[0]?.toUpperCase()}
              </Avatar>
              <Typography variant="body1" fontWeight={700}>
                Welcome,{' '}
                <Box
                  component="span"
                  onClick={() => navigate(`/profile/${user?.id || user?._id}`)}
                  sx={{ color: 'primary.light', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                >
                  {user?.name || user?.username}
                </Box>
              </Typography>
            </Box>
            <Box
              sx={{
                display: 'flex',
                gap: { xs: 2, sm: 4 },
                flexWrap: 'wrap',
                width: { xs: '100%', sm: 'auto' },
                justifyContent: { xs: 'space-between', sm: 'flex-end' }
              }}
            >
              <Typography variant="body2" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                🔥 Streak: {user?.currentStreak || 0} {user?.currentStreak === 1 ? 'Day' : 'Days'}
              </Typography>
              <Typography variant="body2" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                🏆 Points: {user?.totalPoints?.toLocaleString() || 0}
              </Typography>
              <Typography variant="body2" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                🌍 Global Rank: #{user?.globalRank || 1}
              </Typography>
            </Box>
          </Paper>

          {/* ── Main Asymmetrical Double-Column Grid Layout ────────────────── */}
          <Grid container spacing={3}>

            {/* LEFT COLUMN (xs={12} md={7}): Today's Habits */}
            <Grid item xs={12} md={7}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <HabitTracker
                  key={habitKey}
                  selectedGroupId={selectedGroupId}
                  onHabitComplete={handleHabitComplete}
                  onAddHabit={() => setCreateHabitOpen(true)}
                />
              </Box>
            </Grid>

            {/* RIGHT COLUMN (xs={12} md={5}): Live Standings & Logs */}
            <Grid item xs={12} md={5}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Leaderboard selectedGroupId={selectedGroupId} />
                <NotificationFeed />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Slide-out Drawer for Groups & Friends Management (Desktop & Mobile) */}
      <Drawer
        anchor="left" open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: 320, bgcolor: '#0A0A0F', p: 3,
            borderRight: '1px solid rgba(255,255,255,0.07)',
          },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" fontWeight={800} color="primary.light">
            Lobby Manager
          </Typography>
          <IconButton onClick={() => setDrawerOpen(false)} size="small">
            <CloseOutlined />
          </IconButton>
        </Box>
        <SidePanel />
      </Drawer>

      {/* Create Habit Dialog */}
      <CreateHabitDialog
        open={createHabitOpen}
        onClose={() => setCreateHabitOpen(false)}
        selectedGroupId={selectedGroupId}
        onCreated={handleHabitCreated}
      />

      {/* Global Snackbar */}
      <Snackbar
        open={snack.open} autoHideDuration={5000} onClose={() => setSnack((p) => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snack.severity} variant="filled"
          onClose={() => setSnack((p) => ({ ...p, open: false }))}
          sx={{ borderRadius: 2, fontWeight: 600 }}
        >
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
