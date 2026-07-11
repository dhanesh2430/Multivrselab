import { useEffect, useState, useRef } from 'react';
import {
  Card, CardContent, Typography, Box, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Avatar, Chip, Skeleton,
  Select, MenuItem
} from '@mui/material';
import {
  LeaderboardOutlined, EmojiEventsOutlined, LocalFireDepartmentOutlined,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { avatarEmojis } from '../pages/ProfilePage';

const rankColors = { 1: '#F59E0B', 2: '#94A3B8', 3: '#B45309' };
const rankEmoji = { 1: '🥇', 2: '🥈', 3: '🥉' };

export default function Leaderboard({ selectedGroupId }) {
  const { user } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState('totalPoints'); // totalPoints, currentStreak, consistencyScore, speedScore
  const [flashRow, setFlashRow] = useState(null);
  const prevDataRef = useRef([]);

  useEffect(() => {
    if (!selectedGroupId) return;
    fetchLeaderboard();
  }, [selectedGroupId, sortBy]);

  // Live socket listener
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = (data) => {
      // If we are sorting by totalPoints, we can live update.
      // For other sortings, we let the client re-fetch or sort locally.
      if (sortBy === 'totalPoints') {
        const sortedData = [...data].sort((a, b) => b.totalPoints - a.totalPoints)
          .map((entry, idx) => ({ ...entry, rank: idx + 1 }));

        const changed = sortedData.find((entry) => {
          const prev = prevDataRef.current.find((p) => p.userId === entry.userId);
          return prev && prev.totalPoints !== entry.totalPoints;
        });

        if (changed) {
          setFlashRow(changed.userId);
          setTimeout(() => setFlashRow(null), 1200);
        }
        prevDataRef.current = sortedData;
        setLeaderboard(sortedData);
      } else {
        // If sorting is custom, re-fetch rankings
        fetchLeaderboard();
      }
    };

    socket.on('leaderboardUpdate', handleUpdate);
    return () => socket.off('leaderboardUpdate', handleUpdate);
  }, [socket, sortBy, selectedGroupId]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/leaderboard/group/${selectedGroupId}`, {
        params: { sortBy }
      });
      setLeaderboard(data.leaderboard || []);
      prevDataRef.current = data.leaderboard || [];
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!selectedGroupId) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
          <Typography color="text.secondary">Select a lobby group to view rankings</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <LeaderboardOutlined sx={{ color: 'primary.light' }} />
          <Typography variant="h6" fontWeight={700}>Lobby Leaderboard</Typography>
          
          {/* Sorting selection */}
          <Select
            size="small"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            sx={{
              ml: 'auto',
              fontSize: '0.72rem',
              height: 28,
              bgcolor: 'rgba(255,255,255,0.03)',
              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.08)' }
            }}
          >
            <MenuItem value="totalPoints" sx={{ fontSize: '0.75rem' }}>Total Points</MenuItem>
            <MenuItem value="currentStreak" sx={{ fontSize: '0.75rem' }}>Current Streak</MenuItem>
            <MenuItem value="consistencyScore" sx={{ fontSize: '0.75rem' }}>Consistency Score</MenuItem>
            <MenuItem value="speedScore" sx={{ fontSize: '0.75rem' }}>Speed Score</MenuItem>
          </Select>
        </Box>

        {loading ? (
          [...Array(4)].map((_, i) => (
            <Skeleton key={i} variant="rounded" height={52} sx={{ mb: 1, bgcolor: 'rgba(255,255,255,0.05)' }} />
          ))
        ) : leaderboard.length === 0 ? (
          <Typography color="text.secondary" align="center" py={4}>No members in this lobby yet</Typography>
        ) : (
          <TableContainer>
            <Table size="small" sx={{ '& td, & th': { px: { xs: 1, sm: 2 } } }}>
              <TableHead>
                <TableRow>
                  <TableCell>Rank</TableCell>
                  <TableCell>Player</TableCell>
                  <TableCell align="right">Score</TableCell>
                  <TableCell align="right">Streak</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {leaderboard.map((entry) => {
                  const isMe = entry.userId?.toString() === user?.id;
                  const isFlashing = flashRow === entry.userId?.toString() || flashRow === entry.userId;
                  const isOnline = onlineUsers[entry.userId];
                  
                  // Display sorted value in score column
                  let displayScore = entry.totalPoints;
                  if (sortBy === 'consistencyScore') displayScore = entry.consistencyScore;
                  if (sortBy === 'speedScore') displayScore = entry.speedScore;

                  return (
                    <TableRow
                      key={entry.userId}
                      sx={{
                        bgcolor: isFlashing
                          ? 'rgba(124,58,237,0.2)'
                          : isMe
                          ? 'rgba(124,58,237,0.08)'
                          : 'transparent',
                        transition: 'background-color 0.4s ease',
                        '& td': { border: 'none', py: 1.2, px: { xs: 1, sm: 2 } },
                        '&:hover td': { bgcolor: 'rgba(255,255,255,0.03)' },
                      }}
                    >
                      <TableCell>
                        <Typography
                          variant="body2" fontWeight={800}
                          sx={{ color: rankColors[entry.rank] || 'text.secondary', minWidth: 32 }}
                        >
                          {rankEmoji[entry.rank] || `#${entry.rank}`}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box
                          onClick={() => navigate(`/profile/${entry.userId}`)}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            cursor: 'pointer',
                            '&:hover': {
                              '& .player-name': { color: 'primary.light' },
                              '& .player-avatar': { transform: 'scale(1.05)', boxShadow: '0 0 8px rgba(124,58,237,0.4)' }
                            },
                            transition: 'all 0.2s'
                          }}
                        >
                          <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                            <Avatar
                              className="player-avatar"
                              sx={{
                                width: 30, height: 30, fontSize: '0.75rem', fontWeight: 700,
                                bgcolor: isMe ? 'primary.main' : 'rgba(255,255,255,0.1)',
                                transition: 'transform 0.2s, box-shadow 0.2s'
                              }}
                            >
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
                          <Box>
                            <Typography className="player-name" component="span" variant="body2" fontWeight={isMe ? 700 : 500} sx={{ transition: 'color 0.2s' }}>
                              {entry.name || entry.username}
                              {isMe && <Chip label="You" size="small" sx={{ ml: 0.5, height: 16, fontSize: '0.6rem', bgcolor: 'rgba(124,58,237,0.2)', color: 'primary.light' }} />}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={700} color={isFlashing ? 'primary.light' : 'text.primary'}>
                          {displayScore.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                          {entry.currentStreak > 0 && (
                            <LocalFireDepartmentOutlined className="streak-fire" sx={{ fontSize: 14, color: '#F59E0B' }} />
                          )}
                          <Typography variant="body2" color={entry.currentStreak > 0 ? 'warning.main' : 'text.secondary'} fontWeight={600}>
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
        )}
      </CardContent>
    </Card>
  );
}
