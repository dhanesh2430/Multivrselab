import { useState } from 'react';
import {
  AppBar, Toolbar, Box, Typography, IconButton, Avatar, Chip,
  Menu, MenuItem, Tooltip, Divider, Badge, List, ListItem, ListItemText, Button
} from '@mui/material';
import {
  BoltOutlined, LogoutOutlined, PersonOutlined,
  LeaderboardOutlined, WifiOutlined, WifiOffOutlined,
  NotificationsOutlined, CheckCircleOutlined, DeleteSweepOutlined,
  PeopleOutlined, GroupsOutlined, EmojiEventsOutlined
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const { user, logout } = useAuth();
  const {
    connected,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications
  } = useSocket();
  const navigate = useNavigate();

  // Menu states
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [notifMenuAnchor, setNotifMenuAnchor] = useState(null);

  const handleNotifClick = async (n) => {
    // Mark as read
    if (!n.isRead) {
      await markAsRead(n._id);
    }
    
    // Close notifications menu
    setNotifMenuAnchor(null);

    // Route dynamically based on notification type
    if (n.type === 'friend_request' || n.type === 'friend_accepted') {
      navigate(`/profile/${n.data?.requesterId || n.data?.recipientId || user?.id}`);
    } else if (n.type === 'group_invite' && n.data?.groupId) {
      navigate('/dashboard'); // Lobby handles selected group or drawer opening
    } else if (n.type === 'streak_milestone' || n.type === 'habit_completed') {
      if (n.data?.habitId) {
        navigate(`/habit/${n.data.habitId}`);
      }
    }
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case 'friend_request':
      case 'friend_accepted':
        return <PeopleOutlined sx={{ color: 'secondary.light', fontSize: 18 }} />;
      case 'group_invite':
        return <GroupsOutlined sx={{ color: 'primary.light', fontSize: 18 }} />;
      case 'streak_milestone':
      case 'achievement':
        return <EmojiEventsOutlined sx={{ color: 'warning.main', fontSize: 18 }} />;
      default:
        return <NotificationsOutlined sx={{ color: 'text.secondary', fontSize: 18 }} />;
    }
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        background: 'rgba(10,10,15,0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <Toolbar sx={{ gap: 1 }}>
        {/* Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1, cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
          <BoltOutlined sx={{ color: 'primary.light', fontSize: 28 }} />
          <Typography
            variant="h6" fontWeight={800}
            sx={{
              background: 'linear-gradient(135deg, #A78BFA, #67E8F9)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: { xs: 'none', sm: 'block' }
            }}
          >
            LeaderHabit
          </Typography>
        </Box>

        {/* Points display */}
        <Chip
          icon={<LeaderboardOutlined sx={{ fontSize: 16 }} />}
          label={`${user?.totalPoints ?? 0} pts`}
          size="small"
          onClick={() => navigate('/dashboard')}
          sx={{ bgcolor: 'rgba(124,58,237,0.15)', color: 'primary.light', borderColor: 'rgba(124,58,237,0.3)', border: '1px solid', fontWeight: 700, cursor: 'pointer' }}
        />

        {/* Streak badge */}
        {user?.currentStreak > 0 && (
          <Chip
            className="streak-fire"
            label={`🔥 ${user.currentStreak}`}
            size="small"
            sx={{ bgcolor: 'rgba(245,158,11,0.15)', color: '#F59E0B', borderColor: 'rgba(245,158,11,0.3)', border: '1px solid', fontWeight: 700 }}
          />
        )}

        {/* Connection status indicator */}
        <Tooltip title={connected ? 'Live — real-time connected' : 'Disconnected'}>
          <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 0.5, mr: 1 }}>
            {connected
              ? <WifiOutlined sx={{ fontSize: 18, color: '#10B981' }} />
              : <WifiOffOutlined sx={{ fontSize: 18, color: '#EF4444' }} />}
          </Box>
        </Tooltip>

        {/* Notifications Icon with unread badge */}
        <IconButton id="navbar-notif-btn" onClick={(e) => setNotifMenuAnchor(e.currentTarget)} size="small" sx={{ mr: 1, color: 'text.secondary' }}>
          <Badge badgeContent={unreadCount} color="error" max={9} sx={{ '& .MuiBadge-badge': { fontWeight: 700 } }}>
            <NotificationsOutlined />
          </Badge>
        </IconButton>

        {/* Notifications Menu Dropdown */}
        <Menu
          anchorEl={notifMenuAnchor}
          open={Boolean(notifMenuAnchor)}
          onClose={() => setNotifMenuAnchor(null)}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{
            sx: {
              mt: 1.5,
              width: 320,
              maxHeight: 400,
              bgcolor: '#12121A',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column'
            }
          }}
        >
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="body2" fontWeight={800} color="primary.light">
              Notifications {unreadCount > 0 ? `(${unreadCount})` : ''}
            </Typography>
            {notifications.length > 0 && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="Mark all read">
                  <IconButton size="small" onClick={markAllAsRead} color="primary">
                    <CheckCircleOutlined sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Clear all">
                  <IconButton size="small" onClick={clearNotifications} color="error">
                    <DeleteSweepOutlined sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
          </Box>
          <Divider />

          {notifications.length === 0 ? (
            <Box sx={{ py: 4, px: 2, textLines: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <NotificationsOutlined sx={{ color: 'text.secondary', opacity: 0.3, fontSize: 32, mb: 1 }} />
              <Typography variant="caption" color="text.secondary">No notifications yet.</Typography>
            </Box>
          ) : (
            <List dense disablePadding sx={{ overflowY: 'auto', flex: 1 }}>
              {notifications.map((n) => (
                <MenuItem
                  key={n._id}
                  onClick={() => handleNotifClick(n)}
                  sx={{
                    px: 2, py: 1.2,
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    bgcolor: n.isRead ? 'transparent' : 'rgba(124,58,237,0.06)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' },
                    display: 'flex', gap: 1.5, alignItems: 'flex-start',
                    transition: 'background-color 0.2s',
                    whiteSpace: 'normal'
                  }}
                >
                  <Avatar sx={{ width: 28, height: 28, bgcolor: 'rgba(255,255,255,0.05)' }}>
                    {getNotifIcon(n.type)}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: n.isRead ? 500 : 700, fontSize: '0.825rem', color: n.isRead ? 'text.secondary' : 'text.primary' }}>
                      {n.message}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      {new Date(n.createdAt || n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </Box>
                  {!n.isRead && (
                    <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#7C3AED', marginTop: 12 }} />
                  )}
                </MenuItem>
              ))}
            </List>
          )}
        </Menu>

        {/* User avatar menu */}
        <Tooltip title={user?.username || 'User Profile'}>
          <IconButton id="navbar-avatar-btn" onClick={(e) => setUserMenuAnchor(e.currentTarget)} size="small">
            <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: '0.85rem', fontWeight: 700 }}>
              {user?.username?.[0]?.toUpperCase()}
            </Avatar>
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={userMenuAnchor} open={Boolean(userMenuAnchor)} onClose={() => setUserMenuAnchor(null)}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{ sx: { mt: 1, minWidth: 180 } }}
        >
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="body2" fontWeight={700}>{user?.name || user?.username}</Typography>
            <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
          </Box>
          <Divider />
          <MenuItem
            id="navbar-profile-btn"
            onClick={() => { setUserMenuAnchor(null); navigate(`/profile/${user?.id || user?._id}`); }}
            sx={{ gap: 1 }}
          >
            <PersonOutlined fontSize="small" /> My Profile
          </MenuItem>
          <MenuItem onClick={logout} sx={{ gap: 1, color: 'error.main' }}>
            <LogoutOutlined fontSize="small" /> Sign out
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
