import { useEffect, useRef, useState } from 'react';
import { Box, Card, CardContent, Typography, Chip } from '@mui/material';
import { NotificationsOutlined } from '@mui/icons-material';
import { useSocket } from '../context/SocketContext';

const MAX_NOTIFICATIONS = 30;

const typeConfig = {
  completion: { color: '#10B981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
  default: { color: '#A78BFA', bg: 'rgba(124,58,237,0.08)', border: 'rgba(124,58,237,0.2)' },
};

export default function NotificationFeed({ externalNotifications = [] }) {
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const listRef = useRef(null);

  useEffect(() => {
    if (!socket) return;
    const handleNotification = (payload) => {
      const entry = typeof payload === 'string'
        ? { message: payload, type: 'default', timestamp: new Date().toISOString() }
        : payload;

      setNotifications((prev) => [{ ...entry, id: Date.now() }, ...prev].slice(0, MAX_NOTIFICATIONS));
    };
    socket.on('notification', handleNotification);
    return () => socket.off('notification', handleNotification);
  }, [socket]);

  // Merge external (e.g. locally-triggered) notifications
  useEffect(() => {
    if (externalNotifications.length === 0) return;
    setNotifications((prev) => [...externalNotifications, ...prev].slice(0, MAX_NOTIFICATIONS));
  }, [externalNotifications]);

  const formatTime = (ts) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <NotificationsOutlined sx={{ color: 'primary.light', fontSize: 20 }} />
          <Typography variant="h6" fontWeight={700}>Activity Feed</Typography>
          <Chip
            label={notifications.length}
            size="small"
            sx={{ ml: 'auto', bgcolor: 'rgba(124,58,237,0.2)', color: 'primary.light', fontWeight: 700, height: 20, fontSize: '0.7rem' }}
          />
        </Box>

        {notifications.length === 0 ? (
          <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
            Activity will appear here as your group completes habits ⚡
          </Typography>
        ) : (
          <Box ref={listRef} sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 200, overflowY: 'auto', pr: 0.5 }}>
            {notifications.map((n) => {
              const cfg = typeConfig[n.type] || typeConfig.default;
              return (
                <Box
                  key={n.id}
                  className="slide-in"
                  sx={{
                    p: 1.5, borderRadius: 2,
                    bgcolor: cfg.bg,
                    border: `1px solid ${cfg.border}`,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                  }}
                >
                  <Typography variant="body2" sx={{ color: cfg.color, fontWeight: 500, flex: 1 }}>
                    {n.message}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 1, whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {formatTime(n.timestamp)}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
