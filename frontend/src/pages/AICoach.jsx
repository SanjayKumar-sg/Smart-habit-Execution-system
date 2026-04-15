import { useState, useEffect, useRef } from 'react';
import { insights as insightsApi } from '../api/client';
import toast from 'react-hot-toast';
import { MdSend, MdSmartToy, MdPerson } from 'react-icons/md';

export default function AICoach() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    insightsApi.coach().then(r => setMessages(r.data.reverse())).catch(() => {});
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const msg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', content: msg }]);
    setLoading(true);
    try {
      const { data } = await insightsApi.sendMessage({ message: msg });
      setMessages(prev => {
        // remove optimistisc UI user msg if exact match, but let's just replace all with fresh fetch or append ai_response
        // for simplicity, append ai_response
        return [...prev, data.ai_response];
      });
    } catch {
      toast.error('Coach is offline');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: 800, margin: '0 auto', display:'flex', flexDirection:'column', height:'calc(100vh - var(--header-h) - 4rem)' }}>
      <div style={{ marginBottom: '1rem' }}>
        <h1 className="h2 flex align-center gap-2"><MdSmartToy color="var(--primary-light)" /> AI Habit Coach</h1>
        <p className="text-muted text-sm">Personalized advice based on your habit patterns and medical profile.</p>
      </div>

      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
        <div className="chat-messages" style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
          {messages.length === 0 && !loading && (
            <div className="text-center text-muted" style={{ margin: 'auto' }}>
              <MdSmartToy size={48} style={{ opacity:0.5, marginBottom:'1rem' }} />
              <p>Say hello! Ask for habit advice, motivation, or medical recommendations.</p>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={m.id || i} style={{ display:'flex', flexDirection:'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:'0.2rem', marginLeft: m.role==='assistant'? '0.5rem':0, marginRight: m.role==='user'? '0.5rem':0 }}>
                {m.role === 'user' ? 'You' : 'Coach'}
              </div>
              <div className={`chat-bubble ${m.role}`}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-start' }}>
              <div className="chat-bubble assistant" style={{ display:'flex', gap:'4px' }}>
                <span className="dot-typing"></span>...
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <form className="chat-input-row" onSubmit={handleSend}>
          <input className="form-input" style={{ flex: 1 }} placeholder="Ask your coach anything..."
            value={input} onChange={e => setInput(e.target.value)} disabled={loading} />
          <button className="btn btn-primary" type="submit" disabled={loading || !input.trim()}>
            <MdSend />
          </button>
        </form>
      </div>
    </div>
  );
}
