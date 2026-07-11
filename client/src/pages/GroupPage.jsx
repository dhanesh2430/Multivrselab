import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box, Container, Grid, Typography, Card, CardContent, Button,
  Paper, Avatar, Chip, CircularProgress, Alert, Divider, List,
  ListItem, ListItemIcon, ListItemText, useTheme, IconButton, Tooltip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import {
  ArrowBackOutlined, GroupsOutlined, ContentCopyOutlined,
  ExitToAppOutlined, EmojiEventsOutlined, LocalFireDepartmentOutlined,
  AccessTimeOutlined, NotificationsOutlined, InfoOutlined, TrendingUpOutlined,
  TrendingDownOutlined, RemoveRedEyeOutlined,
  TaskAltOutlined, CheckCircleOutlined
} from '@mui/icons-material';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { avatarEmojis } from './ProfilePage';

const rankColors = { 1: '#F59E0B', 2: '#94A3B8', 3: '#B45309' };
const rankEmoji = { 1: '🥇', 2: '🥈', 3: '🥉' };

export default function GroupPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useAuth();
  const { socket, onlineUsers } = useSocket();

  const [group, setGroup] = useState(null);
  const [habits, setHabits] = useState([]);
  const [recentCompletions, setRecentCompletions] = useState([]);
  const [activities, setActivities] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [leaderboard, setLeaderboard] = useState([]);

  const fetchGroupDetails = async () => {
    try {
      const { data } = await api.get(`/groups/${id}/details`);
      setGroup(data.group);
      setHabits(data.habits || []);
      setRecentCompletions(data.recentCompletions || []);
      setActivities(data.activities || []);
      setStatistics(data.statistics);

      // Fetch leaderboard
      const lbRes = await api.get(`/groups/${id}/leaderboard`);
      setLeaderboard(lbRes.data.leaderboard || []);
    } catch (err) {
      console.error('Failed to load group details:', err);
      setError(err.response?.data?.message || 'Could not load group details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      setLoading(true);
      fetchGroupDetails();
    }
  }, [id]);

  // Live Socket connection for real-time leaderboard and activities
  useEffect(() => {
    if (!socket || !id) return;

    socket.emit('joinGroup', id);

    const onLeaderboardUpdate = (data) => {
      setLeaderboard(data);
    };

    const onNotification = (payload) => {
      // Refresh details to fetch new activities/completions on habit events
      fetchGroupDetails();
    };

    socket.on('leaderboardUpdate', onLeaderboardUpdate);
    socket.on('notification', onNotification);

    return () => {
      socket.off('leaderboardUpdate', onLeaderboardUpdate);
      socket.off('notification', onNotification);
    };
  }, [socket, id]);

  const handleLeaveGroup = async () => {
    if (!window.confirm('Are you sure you want to leave this group? All assigned habits will be archived.')) return;
    try {
      await api.post(`/groups/${id}/leave`);
      navigate('/dashboard');
    } catch (err) {
      setError('Could not leave group.');
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

  const isCreator = group?.creatorId?._id === user?.id || group?.creatorId === user?.id;

  return (
    <Box className="gradient-bg" sx={{ minHeight: '100vh', pb: 6 }}>
      <Navbar />

      <Container maxWidth="lg" sx={{ pt: 12 }}>
        {/* Back and Header */}
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
            id="group-back-btn"
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
          <Button
            id="group-leave-btn"
            variant="outlined"
            color="error"
            size="small"
            startIcon={<ExitToAppOutlined />}
            onClick={handleLeaveGroup}
            sx={{
              width: { xs: '100%', sm: 'auto' }
            }}
          >
            Leave Group
          </Button>
        </Box>

        {/* Group Info Banner */}
        <Paper
          className="glass-card"
          sx={{
            p: 3, mb: 4,
            background: 'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(6,182,212,0.08) 100%)',
            borderColor: 'rgba(124,58,237,0.2)',
            borderRadius: 3
          }}
        >
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                  <GroupsOutlined />
                </Avatar>
                <Box>
                  <Typography
                    variant="h4"
                    fontWeight={800}
                    sx={{
                      fontSize: { xs: '1.75rem', sm: '2.125rem' },
                      letterSpacing: '-0.02em'
                    }}
                  >
                    {group?.groupName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {group?.description || 'Social habit challenge lobby'}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid
              item
              xs={12}
              md={4}
              sx={{
                display: 'flex',
                justifyContent: { xs: 'flex-start', md: 'flex-end' },
                gap: 2
              }}
            >
              <Paper
                sx={{
                  px: 2,
                  py: 1,
                  bgcolor: 'rgba(0,0,0,0.2)',
                  borderRadius: 2,
                  textAlign: 'center',
                  width: { xs: '100%', sm: 'auto' }
                }}
              >
                <Typography variant="caption" color="text.secondary" display="block">INVITE CODE</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  <Typography variant="h6" fontWeight={800} color="secondary.light">{group?.inviteCode}</Typography>
                  <IconButton
                    size="small"
                    onClick={() => {
                      navigator.clipboard.writeText(group.inviteCode);
                      alert('Invite code copied to clipboard! 📋');
                    }}
                    sx={{ p: 0.5, color: 'secondary.light' }}
                  >
                    <ContentCopyOutlined sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Paper>

        {/* Stats Row */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={6} sm={3}>
            <Card className="glass-card" sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h5" fontWeight={800} color="primary.light">{statistics?.membersCount || 0}</Typography>
              <Typography variant="caption" color="text.secondary">Active Members</Typography>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card className="glass-card" sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h5" fontWeight={800} color="success.main">{statistics?.totalCompletionsCount || 0}</Typography>
              <Typography variant="caption" color="text.secondary">Total Completions</Typography>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card className="glass-card" sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h5" fontWeight={800} color="warning.main">🔥 {statistics?.averageStreak || 0}</Typography>
              <Typography variant="caption" color="text.secondary">Avg. Streak</Typography>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card className="glass-card" sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h5" fontWeight={800} color="secondary.light">+{statistics?.totalPointsEarned?.toLocaleString() || 0}</Typography>
              <Typography variant="caption" color="text.secondary">Points Scored</Typography>
            </Card>
          </Grid>
        </Grid>

        {/* Main Grid Content */}
        <Grid container spacing={4}>
          {/* Left Column: Live Rankings */}
          <Grid item xs={12} md={7}>
            <Card sx={{ mb: 4 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justify: 'space-between', mb: 2 }}>
                  <Typography variant="h6" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmojiEventsOutlined color="primary" /> Live Lobby Rankings
                  </Typography>
                  <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <span className="live-dot" />
                    <Typography variant="caption" color="success.main" fontWeight={600}>LIVE</Typography>
                  </Box>
                </Box>

                <TableContainer>
                  <Table size="small" sx={{ '& td, & th': { px: { xs: 1, sm: 2 } } }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Rank</TableCell>
                        <TableCell>Player</TableCell>
                        <TableCell align="right">Points</TableCell>
                        <TableCell align="right">Streak</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {leaderboard.map((entry) => {
                        const isMe = entry.userId?.toString() === user?.id || entry.userId === user?.id;
                        const isOnline = onlineUsers[entry.userId];
                        return (
                          <TableRow
                            key={entry.userId}
                            sx={{
                              bgcolor: isMe ? 'rgba(124,58,237,0.08)' : 'transparent',
                              '& td': { border: 'none', py: 1.2, px: { xs: 1, sm: 2 } }
                            }}
                          >
                            <TableCell>
                              <Typography variant="body2" fontWeight={800} sx={{ color: rankColors[entry.rank] || 'text.secondary' }}>
                                {rankEmoji[entry.rank] || `#${entry.rank}`}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Box
                                onClick={() => navigate(`/profile/${entry.userId}`)}
                                sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }}
                              >
                                <Box sx={{ position: 'relative' }}>
                                  <Avatar sx={{ width: 30, height: 30, fontSize: '0.75rem', fontWeight: 700 }}>
                                    {avatarEmojis[entry.avatar] || entry.username?.[0]?.toUpperCase()}
                                  </Avatar>
                                  {isOnline && (
                                    <span
                                      style={{
                                        position: 'absolute',
                                        bottom: 0,
                                        right: 0,
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        backgroundColor: '#10B981',
                                        border: '1px solid #12121A'
                                      }}
                                    />
                                  )}
                                </Box>
                                <Typography variant="body2" fontWeight={isMe ? 700 : 500}>
                                  {entry.name || entry.username}
                                  {isMe && <Chip label="You" size="small" sx={{ ml: 0.5, height: 16, fontSize: '0.6rem', bgcolor: 'rgba(124,58,237,0.2)', color: 'primary.light' }} />}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight={700}>
                                {entry.totalPoints.toLocaleString()}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                                <LocalFireDepartmentOutlined sx={{ fontSize: 14, color: '#F59E0B' }} />
                                <Typography variant="body2" color="warning.main" fontWeight={600}>
                                  {entry.currentStreak}
                                </Typography>
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>

            {/* Group Habits List */}
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TaskAltOutlined color="primary" /> Habits Active in Challenge
                </Typography>
                {habits.length === 0 ? (
                  <Typography color="text.secondary" align="center" py={2}>
                    No habits created in this group yet. Go to your dashboard to create one!
                  </Typography>
                ) : (
                  <List disablePadding>
                    {habits.map((h, idx) => (
                      <Box key={h._id}>
                        {idx > 0 && <Divider sx={{ my: 1.5, opacity: 0.5 }} />}
                        <ListItem disableGutters>
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <TaskAltOutlined color="success" />
                          </ListItemIcon>
                          <ListItemText
                            primary={h.title}
                            secondary={`Assigned by: @${h.userId?.username} · Target: ${h.targetType} at ${h.deadline}`}
                            primaryTypographyProps={{ fontWeight: 700, variant: 'body2', style: { cursor: 'pointer' }, onClick: () => navigate(`/habit/${h._id}`) }}
                            secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                          />
                          <IconButton size="small" color="primary" onClick={() => navigate(`/habit/${h._id}`)}>
                            <RemoveRedEyeOutlined sx={{ fontSize: 18 }} />
                          </IconButton>
                        </ListItem>
                      </Box>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Right Column: Activities and Completions */}
          <Grid item xs={12} md={5}>
            {/* Live Activities Feed */}
            <Card sx={{ mb: 4 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <NotificationsOutlined color="secondary" /> Live Activity Log
                </Typography>
                {activities.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" align="center" py={2}>
                    Lobby activity logs will appear here.
                  </Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, maxHeight: 300, overflowY: 'auto', pr: 0.5 }}>
                    {activities.map((act) => (
                      <Box
                        key={act._id}
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: 'rgba(255,255,255,0.02)',
                          border: '1px solid rgba(255,255,255,0.05)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start'
                        }}
                      >
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <Avatar sx={{ width: 22, height: 22, fontSize: '0.6rem' }}>
                            {avatarEmojis[act.userId?.avatar] || act.userId?.username?.[0]?.toUpperCase()}
                          </Avatar>
                          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                            {act.message}
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 1, whiteSpace: 'nowrap' }}>
                          {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Completed Habits history list */}
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircleOutlined color="success" /> Recent Check-Ins
                </Typography>
                {recentCompletions.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" align="center" py={2}>
                    No completions recorded in this lobby yet.
                  </Typography>
                ) : (
                  <List dense disablePadding sx={{ maxHeight: 300, overflowY: 'auto' }}>
                    {recentCompletions.map((comp) => (
                      <ListItem key={comp._id} sx={{ px: 0, py: 1, borderBottom: '1px solid rgba(255,255,255,0.04)', '&:last-child': { borderBottom: 'none' } }}>
                        <Avatar sx={{ width: 24, height: 24, mr: 1.5, fontSize: '0.65rem' }}>
                          {avatarEmojis[comp.userId?.avatar] || comp.userId?.username?.[0]?.toUpperCase()}
                        </Avatar>
                        <ListItemText
                          primary={comp.userId?.name || comp.userId?.username}
                          secondary={`Completed "${comp.habitId?.title || 'Habit'}"`}
                          primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                          secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                        />
                        <Chip
                          label={`+${comp.pointsEarned} pts`}
                          size="small"
                          color="success"
                          sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
