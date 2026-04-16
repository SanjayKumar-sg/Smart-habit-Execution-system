import { useState, useEffect, useRef } from 'react';
import { auth as authApi } from '../api/client';
import { useStore } from '../store/useStore';
import { MdChat, MdClose, MdSend, MdPerson } from 'react-icons/md';

export default function Chat() {
  const { user, role } = useStore();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [unread, setUnread] = useState(0);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const pollRef = useRef(null);

  // Load contacts (doctor's accepted patients or patient's doctor)
  useEffect(() => {
    if (role === 'doctor') {
      authApi.doctorPatients().then(r => {
        const accepted = (r.data?.relationships || []).filter(rel => rel.status === 'accepted');
        setContacts(accepted.map(rel => ({
          id: rel.patient_id,
          name: rel.patient_name,
          username: rel.patient_username,
        })));
      }).catch(() => {});
    } else if (role === 'patient') {
      // Patient: load their doctor from leaderboard (simplified — just load doctors)
      authApi.leaderboard().then(r => {
        const doctors = (r.data || []).filter(u => u.role === 'doctor');
        setContacts(doctors.map(d => ({
          id: d.id,
          name: `Dr. ${d.first_name || d.username}`,
          username: d.username,
        })));
      }).catch(() => {});
    }
  }, [role]);

  // Poll for unread count
  useEffect(() => {
    const poll = () => {
      authApi.unreadCount().then(r => setUnread(r.data?.unread || 0)).catch(() => {});
    };
    poll();
    const id = setInterval(poll, 10000);
    return () => clearInterval(id);
  }, []);

  // Load + poll messages
  useEffect(() => {
    if (!selectedContact) return;
    const load = () => {
      authApi.getMessages(selectedContact.id).then(r => {
        setMessages(r.data || []);
        setUnread(0);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }).catch(() => {});
    };
    load();
    pollRef.current = setInterval(load, 5000);
    return () => clearInterval(pollRef.current);
  }, [selectedContact]);

  const handleSend = async () => {
    if (!text.trim() || !selectedContact || sending) return;
    setSending(true);
    try {
      await authApi.sendMessage({ receiver_id: selectedContact.id, message: text.trim() });
      setText('');
      const r = await authApi.getMessages(selectedContact.id);
      setMessages(r.data || []);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch { /* silent */ } finally { setSending(false); }
  };

  if (role !== 'doctor' && role !== 'patient') return null;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 1000,
          width: 56, height: 56, borderRadius: '50%',
          background: 'linear-gradient(135deg,#7C3AED,#06B6D4)',
          border: 'none', cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 32px rgba(124,58,237,0.4)',
          transition: 'transform 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        {open ? <MdClose size={26} color="white" /> : <MdChat size={26} color="white" />}
        {!open && unread > 0 && (
          <span style={{
            position: 'absolute', top: 2, right: 2,
            background: '#EF4444', color: 'white', borderRadius: '50%',
            width: 20, height: 20, fontSize: '0.7rem', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{unread}</span>
        )}
      </button>

      {/* Chat Panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: '6rem', right: '2rem', zIndex: 999,
          width: 360, height: 500,
          background: 'var(--bg-card)', borderRadius: '20px',
          border: '1px solid var(--border)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          display: 'flex', flexDirection: 'column',
          animation: 'fadeIn 0.2s ease',
        }}>
          {/* Header */}
          <div style={{
            padding: '1rem', borderBottom: '1px solid var(--border)',
            background: 'linear-gradient(135deg,rgba(124,58,237,0.15),rgba(6,182,212,0.08))',
            borderRadius: '20px 20px 0 0',
          }}>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.5rem' }}>
              💬 {role === 'doctor' ? 'Message Patient' : 'Message Your Doctor'}
            </div>
            {/* Contact selector */}
            {contacts.length > 0 ? (
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {contacts.map(c => (
                  <button key={c.id} onClick={() => setSelectedContact(c)} style={{
                    padding: '0.25rem 0.6rem', borderRadius: '99px', fontSize: '0.75rem',
                    border: `1px solid ${selectedContact?.id === c.id ? 'var(--primary-light)' : 'var(--border)'}`,
                    background: selectedContact?.id === c.id ? 'rgba(124,58,237,0.2)' : 'transparent',
                    color: selectedContact?.id === c.id ? 'var(--primary-light)' : 'var(--text-secondary)',
                    cursor: 'pointer', fontWeight: 600,
                  }}>
                    <MdPerson style={{ verticalAlign: 'middle', marginRight: 3 }} />
                    {c.name}
                  </button>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {role === 'doctor' ? 'No accepted patients yet.' : 'No doctor assigned yet.'}
              </p>
            )}
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {!selectedContact ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '4rem', fontSize: '0.875rem' }}>
                Select a contact to start chatting
              </div>
            ) : messages.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '4rem', fontSize: '0.875rem' }}>
                No messages yet. Say hello! 👋
              </div>
            ) : (
              messages.map(msg => {
                const isMe = msg.sender === user?.id;
                return (
                  <div key={msg.id} style={{
                    display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start',
                  }}>
                    <div style={{
                      maxWidth: '75%', padding: '0.6rem 0.9rem',
                      borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: isMe
                        ? 'linear-gradient(135deg,#7C3AED,#06B6D4)'
                        : 'var(--bg-surface)',
                      color: isMe ? 'white' : 'var(--text-primary)',
                      fontSize: '0.875rem', lineHeight: 1.4,
                      border: isMe ? 'none' : '1px solid var(--border)',
                    }}>
                      {msg.message}
                      <div style={{ fontSize: '0.65rem', opacity: 0.7, marginTop: 3, textAlign: 'right' }}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          {selectedContact && (
            <div style={{
              padding: '0.75rem', borderTop: '1px solid var(--border)',
              display: 'flex', gap: '0.5rem', alignItems: 'center',
            }}>
              <input
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Type a message…"
                style={{
                  flex: 1, background: 'var(--bg-surface)', border: '1px solid var(--border)',
                  borderRadius: '12px', padding: '0.6rem 0.9rem', color: 'var(--text-primary)',
                  fontSize: '0.875rem', outline: 'none',
                }}
              />
              <button onClick={handleSend} disabled={sending || !text.trim()} style={{
                width: 38, height: 38, borderRadius: '50%', border: 'none',
                background: text.trim() ? 'linear-gradient(135deg,#7C3AED,#06B6D4)' : 'var(--bg-glass)',
                cursor: text.trim() ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}>
                <MdSend size={18} color={text.trim() ? 'white' : 'var(--text-muted)'} />
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
