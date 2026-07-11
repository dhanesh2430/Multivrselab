import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Card, CardContent, Typography, Box, Button, TextField, List,
  ListItem, ListItemText, Avatar, Chip, CircularProgress, Alert, Divider,
  IconButton, Paper, Fade, Tooltip
} from '@mui/material';
import {
  PersonAddOutlined, CheckOutlined, CloseOutlined, PeopleOutlined,
  SearchOutlined, DeleteOutlined, CallMissedOutlined, SendOutlined
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { avatarEmojis } from '../pages/ProfilePage';

export default function FriendManager() {
  const navigate = useNavigate();
  const [friends, setFriends] = useState([]);
  const [pending, setPending] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState({});
  const [canceling, setCanceling] = useState({});
  const [msg, setMsg] = useState({ text: '', type: '' });
  
  const searchTimeout = useRef(null);
  const dropdownRef = useRef(null);

  const showMsg = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 5000);
  };

  const fetchAll = async () => {
    try {
      const [friendsRes, pendingRes, sentRes] = await Promise.all([
        api.get('/friends'),
        api.get('/friends/pending'),
        api.get('/friends/sent')
      ]);
      setFriends(friendsRes.data.friends || []);
      setPending(pendingRes.data.requests || []);
      setSentRequests(sentRes.data.requests || []);
    } catch (err) {
      console.error('Failed to load friends details:', err);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // Debounced search-as-you-type
  const handleQueryChange = useCallback((e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(searchTimeout.current);
    
    if (val.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    
    setSearching(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const { data } = await api.get('/friends/search', { params: { q: val.trim() } });
        setSearchResults(data.users || []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
  }, []);

  const sendRequest = async (recipientUsername) => {
    setSending((p) => ({ ...p, [recipientUsername]: true }));
    try {
      const { data } = await api.post('/friends/request', { recipient: recipientUsername });
      showMsg(data.message);
      setQuery('');
      setSearchResults([]);
      fetchAll();
    } catch (err) {
      showMsg(err.response?.data?.message || 'Failed to send request.', 'error');
    } finally {
      setSending((p) => ({ ...p, [recipientUsername]: false }));
    }
  };

  const respond = async (friendshipId, status) => {
    try {
      await api.put('/friends/respond', { friendshipId, status });
      showMsg(status === 'accepted' ? 'Friend added! 🎉' : 'Request declined.');
      fetchAll();
    } catch (err) {
      showMsg(err.response?.data?.message || 'Failed to respond.', 'error');
    }
  };

  const handleCancelRequest = async (requestId) => {
    setCanceling((p) => ({ ...p, [requestId]: true }));
    try {
      await api.delete(`/friends/request/${requestId}`);
      showMsg('Friend request cancelled.');
      fetchAll();
    } catch (err) {
      showMsg(err.response?.data?.message || 'Failed to cancel request.', 'error');
    } finally {
      setCanceling((p) => ({ ...p, [requestId]: false }));
    }
  };

  const handleRemoveFriend = async (friendshipId) => {
    if (!window.confirm('Are you sure you want to remove this friend?')) return;
    try {
      await api.delete(`/friends/${friendshipId}`);
      showMsg('Friend removed.');
      fetchAll();
    } catch (err) {
      showMsg(err.response?.data?.message || 'Failed to remove friend.', 'error');
    }
  };

  return (
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <PeopleOutlined sx={{ color: 'secondary.light' }} />
          <Typography variant="h6" fontWeight={700}>Friends</Typography>
          <Chip
            label={friends.length} size="small"
            sx={{ ml: 'auto', bgcolor: 'rgba(6,182,212,0.15)', color: 'secondary.light', fontWeight: 700, height: 20, fontSize: '0.7rem' }}
          />
        </Box>

        {msg.text && (
          <Alert severity={msg.type === 'error' ? 'error' : 'success'} sx={{ mb: 2, borderRadius: 2 }}>
            {msg.text}
          </Alert>
        )}

        {/* Search field */}
        <Box sx={{ position: 'relative', mb: 2.5 }}>
          <TextField
            id="friend-search-input"
            size="small" fullWidth
            placeholder="Search by username or email…"
            value={query}
            onChange={handleQueryChange}
            InputProps={{
              startAdornment: searching
                ? <CircularProgress size={16} sx={{ mr: 1, color: 'text.secondary' }} />
                : <SearchOutlined sx={{ mr: 1, color: 'text.secondary', fontSize: 18 }} />,
            }}
          />

          {/* Live search dropdown */}
          {searchResults.length > 0 && (
            <Fade in>
              <Paper
                ref={dropdownRef}
                elevation={8}
                sx={{
                  position: 'absolute', top: '110%', left: 0, right: 0, zIndex: 1300,
                  bgcolor: '#1A1A28', border: '1px solid rgba(124,58,237,0.3)',
                  borderRadius: 2, overflow: 'hidden', maxHeight: 240, overflowY: 'auto',
                }}
              >
                {searchResults.map((u) => {
                  const isPending = u.friendStatus === 'pending';
                  const isAccepted = u.friendStatus === 'accepted';
                  const isSentByMe = u.isRequester;

                  return (
                    <Box
                      key={u._id}
                      sx={{
                        display: 'flex', alignItems: 'center', gap: 1.5,
                        px: 2, py: 1.2,
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        '&:last-child': { borderBottom: 'none' },
                        '&:hover': { bgcolor: 'rgba(124,58,237,0.1)' },
                        transition: 'background 0.15s',
                      }}
                    >
                      <Box
                        onClick={() => navigate(`/profile/${u._id}`)}
                        sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, cursor: 'pointer', minWidth: 0 }}
                      >
                        <Avatar sx={{ width: 30, height: 30, fontSize: '0.75rem', fontWeight: 700, bgcolor: 'rgba(124,58,237,0.4)' }}>
                          {avatarEmojis[u.avatar] || u.username[0]?.toUpperCase()}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" fontWeight={600} noWrap sx={{ '&:hover': { color: 'primary.light' } }}>{u.username}</Typography>
                          <Typography variant="caption" color="text.secondary" noWrap>{u.email}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mr: 1 }}>
                          <Typography variant="caption" color="primary.light" fontWeight={600}>{u.totalPoints} pts</Typography>
                        </Box>
                      </Box>
                      
                      {isAccepted ? (
                        <Chip label="Friends" size="small" color="success" variant="outlined" sx={{ height: 24, fontSize: '0.65rem', fontWeight: 700 }} />
                      ) : isPending ? (
                        isSentByMe ? (
                          <Button
                            size="small" variant="outlined" color="warning"
                            onClick={() => handleCancelRequest(u.friendshipId)}
                            sx={{ height: 24, fontSize: '0.65rem', px: 1, minWidth: 60 }}
                          >
                            Cancel
                          </Button>
                        ) : (
                          <Chip label="Pending" size="small" color="info" sx={{ height: 24, fontSize: '0.65rem', fontWeight: 700 }} />
                        )
                      ) : (
                        <Button
                          id={`add-friend-${u._id}`}
                          size="small" variant="contained"
                          disabled={sending[u.username]}
                          onClick={() => sendRequest(u.username)}
                          startIcon={sending[u.username] ? <CircularProgress size={12} color="inherit" /> : <PersonAddOutlined sx={{ fontSize: 14 }} />}
                          sx={{ minWidth: 70, fontSize: '0.65rem', py: 0.5, px: 1.2 }}
                        >
                          Add
                        </Button>
                      )}
                    </Box>
                  );
                })}
              </Paper>
            </Fade>
          )}

          {/* No results */}
          {query.trim().length >= 2 && !searching && searchResults.length === 0 && (
            <Fade in>
              <Paper
                sx={{
                  position: 'absolute', top: '110%', left: 0, right: 0, zIndex: 1300,
                  bgcolor: '#1A1A28', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 2, px: 2, py: 1.5,
                }}
              >
                <Typography variant="body2" color="text.secondary">No users found for "<strong>{query}</strong>"</Typography>
              </Paper>
            </Fade>
          )}
        </Box>

        {/* Received Pending requests */}
        {pending.length > 0 && (
          <>
            <Typography variant="caption" color="text.secondary" fontWeight={700}
              sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', mb: 1 }}>
              Pending Invites Received ({pending.length})
            </Typography>
            <List dense disablePadding sx={{ mb: 2 }}>
              {pending.map((req) => (
                <ListItem key={req._id} disableGutters sx={{ gap: 1, py: 0.5 }}>
                  <Avatar sx={{ width: 30, height: 30, fontSize: '0.75rem', bgcolor: 'rgba(124,58,237,0.3)' }}>
                    {avatarEmojis[req.requesterId.avatar] || req.requesterId.username?.[0]?.toUpperCase()}
                  </Avatar>
                  <ListItemText
                    primary={req.requesterId.name || req.requesterId.username}
                    secondary={`@${req.requesterId.username}`}
                    primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                    secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                  />
                  <IconButton id={`accept-req-${req._id}`} size="small" color="success" onClick={() => respond(req._id, 'accepted')}>
                    <CheckOutlined fontSize="small" />
                  </IconButton>
                  <IconButton id={`decline-req-${req._id}`} size="small" color="error" onClick={() => respond(req._id, 'declined')}>
                    <CloseOutlined fontSize="small" />
                  </IconButton>
                </ListItem>
              ))}
            </List>
            <Divider sx={{ mb: 2 }} />
          </>
        )}

        {/* Sent Pending Requests */}
        {sentRequests.length > 0 && (
          <>
            <Typography variant="caption" color="text.secondary" fontWeight={700}
              sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', mb: 1 }}>
              Pending Sent Invites ({sentRequests.length})
            </Typography>
            <List dense disablePadding sx={{ mb: 2 }}>
              {sentRequests.map((req) => (
                <ListItem key={req._id} disableGutters sx={{ gap: 1, py: 0.5 }}>
                  <Avatar sx={{ width: 30, height: 30, fontSize: '0.75rem', bgcolor: 'rgba(255,255,255,0.08)' }}>
                    {avatarEmojis[req.recipientId.avatar] || req.recipientId.username?.[0]?.toUpperCase()}
                  </Avatar>
                  <ListItemText
                    primary={req.recipientId.name || req.recipientId.username}
                    secondary={`@${req.recipientId.username}`}
                    primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                    secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                  />
                  <Tooltip title="Cancel Request">
                    <span>
                      <IconButton
                        id={`cancel-req-${req._id}`}
                        size="small" color="warning"
                        disabled={canceling[req._id]}
                        onClick={() => handleCancelRequest(req._id)}
                      >
                        <CloseOutlined fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </ListItem>
              ))}
            </List>
            <Divider sx={{ mb: 2 }} />
          </>
        )}

        {/* Friends list */}
        <Typography variant="caption" color="text.secondary" fontWeight={700}
          sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', mb: 1 }}>
          Friend List ({friends.length})
        </Typography>

        {friends.length === 0 ? (
          <Typography variant="body2" color="text.secondary" align="center" py={2}>
            No friends yet — search and add some to compete! 🏆
          </Typography>
        ) : (
          <List dense disablePadding>
            {friends.map((f) => (
              <ListItem
                key={f._id}
                disableGutters
                sx={{
                  gap: 1,
                  py: 0.5,
                  borderRadius: 1,
                  px: 1,
                  display: 'flex',
                  alignItems: 'center',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.03)',
                    '& .friend-name': { color: 'primary.light' }
                  },
                  transition: 'background 0.2s'
                }}
              >
                <Box
                  onClick={() => navigate(`/profile/${f._id}`)}
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, cursor: 'pointer' }}
                >
                  <Avatar sx={{ width: 30, height: 30, fontSize: '0.75rem', bgcolor: 'rgba(6,182,212,0.3)' }}>
                    {avatarEmojis[f.avatar] || f.username?.[0]?.toUpperCase()}
                  </Avatar>
                  <ListItemText
                    primary={f.name || f.username}
                    secondary={`${f.totalPoints.toLocaleString()} pts · 🔥 ${f.currentStreak} day streak`}
                    primaryTypographyProps={{ className: 'friend-name', variant: 'body2', fontWeight: 600, sx: { transition: 'color 0.2s' } }}
                    secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                  />
                </Box>
                <Tooltip title="Remove Friend">
                  <IconButton
                    id={`remove-friend-${f.friendshipId}`}
                    size="small"
                    onClick={() => handleRemoveFriend(f.friendshipId)}
                    sx={{ color: 'text.secondary', opacity: 0.4, '&:hover': { color: 'error.main', opacity: 1 } }}
                  >
                    <DeleteOutlined fontSize="small" />
                  </IconButton>
                </Tooltip>
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
}
