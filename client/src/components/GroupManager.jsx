import { useState, useEffect } from 'react';
import {
  Card, CardContent, Typography, Box, Button, TextField, List,
  ListItem, ListItemText, Avatar, Chip, CircularProgress, Alert, Divider,
  IconButton, Tooltip, InputAdornment
} from '@mui/material';
import {
  GroupsOutlined, AddOutlined, PersonAddOutlined, ContentCopyOutlined,
  AutorenewOutlined, LoginOutlined
} from '@mui/icons-material';
import api from '../api/axios';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

export default function GroupManager({ onSelectGroup, selectedGroupId }) {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [inviteUserId, setInviteUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const showMsg = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 4000);
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const { data } = await api.get('/groups');
      setGroups(data.groups);
      if (data.groups.length > 0 && !selectedGroupId) {
        onSelectGroup(data.groups[0]._id);
      }
    } catch {/* silent */}
  };

  const createGroup = async () => {
    if (!groupName.trim()) return;
    setLoading(true);
    try {
      const { data } = await api.post('/groups', { groupName: groupName.trim() });
      showMsg(`Group "${data.group.groupName}" created! Code: ${data.group.inviteCode} 🎉`);
      setGroupName('');
      await fetchGroups();
      if (socket) socket.emit('joinGroup', data.group._id);
      onSelectGroup(data.group._id);
    } catch (err) {
      showMsg(err.response?.data?.message || 'Failed to create group.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const joinGroupByCode = async () => {
    if (!inviteCodeInput.trim()) return;
    setLoading(true);
    try {
      const { data } = await api.post('/groups/join', { inviteCode: inviteCodeInput.trim() });
      showMsg(data.message);
      setInviteCodeInput('');
      await fetchGroups();
      if (socket) socket.emit('joinGroup', data.group._id);
      onSelectGroup(data.group._id);
    } catch (err) {
      showMsg(err.response?.data?.message || 'Failed to join group.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const inviteToGroup = async () => {
    if (!inviteUserId.trim() || !selectedGroupId) return;
    setLoading(true);
    try {
      const { data } = await api.post(`/groups/${selectedGroupId}/invite`, { userId: inviteUserId.trim() });
      showMsg(data.message);
      setInviteUserId('');
      fetchGroups();
    } catch (err) {
      showMsg(err.response?.data?.message || 'Failed to invite user.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const regenerateCode = async () => {
    if (!selectedGroupId) return;
    setLoading(true);
    try {
      const { data } = await api.post(`/groups/${selectedGroupId}/regenerate-code`);
      showMsg(data.message);
      await fetchGroups();
    } catch (err) {
      showMsg(err.response?.data?.message || 'Failed to regenerate invite code.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const activeGroup = groups.find((g) => g._id === selectedGroupId);
  const isCreator = activeGroup?.creatorId?._id === user?.id || activeGroup?.creatorId === user?.id;

  return (
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <GroupsOutlined sx={{ color: 'primary.light' }} />
          <Typography variant="h6" fontWeight={700}>Lobbies</Typography>
          <Chip label={groups.length} size="small" sx={{ ml: 'auto', bgcolor: 'rgba(124,58,237,0.15)', color: 'primary.light', fontWeight: 700, height: 20, fontSize: '0.7rem' }} />
        </Box>

        {msg.text && <Alert severity={msg.type === 'error' ? 'error' : 'success'} sx={{ mb: 2, borderRadius: 2 }}>{msg.text}</Alert>}

        {/* Join Group by Code */}
        <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
          <TextField
            id="join-code-input"
            size="small" fullWidth placeholder="Enter Invite Code (e.g. A9B8C7)"
            value={inviteCodeInput} onChange={(e) => setInviteCodeInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && joinGroupByCode()}
          />
          <Button
            id="join-group-btn"
            variant="contained" color="secondary" onClick={joinGroupByCode} disabled={loading}
            startIcon={<LoginOutlined />}
            sx={{ whiteSpace: 'nowrap' }}
          >
            Join
          </Button>
        </Box>

        {/* Create group */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <TextField
            id="group-name-input"
            size="small" fullWidth placeholder="New group name"
            value={groupName} onChange={(e) => setGroupName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && createGroup()}
          />
          <Button
            id="create-group-btn"
            variant="contained" onClick={createGroup} disabled={loading}
            startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <AddOutlined />}
          >
            Create
          </Button>
        </Box>

        {/* Group list */}
        {groups.length === 0 ? (
          <Typography variant="body2" color="text.secondary" align="center" py={2}>
            No groups yet — join or create one!
          </Typography>
        ) : (
          <List dense disablePadding sx={{ mb: 2 }}>
            {groups.map((g) => (
              <ListItem
                key={g._id}
                button
                onClick={() => onSelectGroup(g._id)}
                selected={selectedGroupId === g._id}
                sx={{
                  borderRadius: 2, mb: 0.5,
                  bgcolor: selectedGroupId === g._id ? 'rgba(124,58,237,0.15)' : 'transparent',
                  border: `1px solid ${selectedGroupId === g._id ? 'rgba(124,58,237,0.35)' : 'transparent'}`,
                  '&:hover': { bgcolor: 'rgba(124,58,237,0.08)' },
                  transition: 'all 0.2s',
                }}
              >
                <Avatar sx={{ width: 30, height: 30, mr: 1, bgcolor: 'rgba(124,58,237,0.3)', fontSize: '0.75rem', fontWeight: 700 }}>
                  {g.groupName[0]?.toUpperCase()}
                </Avatar>
                <ListItemText
                  primary={g.groupName}
                  secondary={`${g.members.length} member${g.members.length !== 1 ? 's' : ''} · Invite: ${g.inviteCode}`}
                  primaryTypographyProps={{ variant: 'body2', fontWeight: selectedGroupId === g._id ? 700 : 500 }}
                  secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                />
                <Tooltip title="Copy Invite Code">
                  <IconButton
                    id={`copy-invite-code-${g._id}`}
                    size="small" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(g.inviteCode); showMsg('Invite Code copied!'); }}
                    sx={{ opacity: 0.7, '&:hover': { opacity: 1, color: 'primary.light' } }}
                  >
                    <ContentCopyOutlined sx={{ fontSize: 14 }} />
                  </IconButton>
                </Tooltip>
              </ListItem>
            ))}
          </List>
        )}

        {/* Selected group detail tools */}
        {activeGroup && (
          <>
            <Divider sx={{ mb: 2 }} />

            {/* Invite Info Box */}
            <Box sx={{ mb: 2, p: 1.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                GROUP INVITE CODE
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
                <Typography variant="body1" fontWeight={800} color="secondary.light" letterSpacing="0.05em">
                  {activeGroup.inviteCode}
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Tooltip title="Copy Invite Code">
                    <IconButton
                      size="small"
                      onClick={() => { navigator.clipboard.writeText(activeGroup.inviteCode); showMsg('Invite Code copied! 📋'); }}
                      sx={{ color: 'secondary.light' }}
                    >
                      <ContentCopyOutlined sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                  {isCreator && (
                    <Tooltip title="Regenerate Code">
                      <IconButton
                        size="small" onClick={regenerateCode} disabled={loading}
                        sx={{ color: 'warning.main' }}
                      >
                        <AutorenewOutlined sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Box>
            </Box>

            {/* Direct member invite */}
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Add user directly
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <TextField
                id="invite-user-id"
                size="small" fullWidth placeholder="Username or email"
                value={inviteUserId} onChange={(e) => setInviteUserId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && inviteToGroup()}
              />
              <Button
                id="invite-to-group-btn"
                variant="outlined" onClick={inviteToGroup} disabled={loading}
                startIcon={<PersonAddOutlined />}
                sx={{ whiteSpace: 'nowrap', borderColor: 'rgba(124,58,237,0.4)' }}
              >
                Add
              </Button>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
}
