import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Inbox() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [sellers, setSellers] = useState([]);

  useEffect(() => {
    api.get('/chat/conversations').then((res) => setConversations(res.data));
    if (user.role === 'user') {
      api.get('/auth/sellers').then((res) => setSellers(res.data));
    }
  }, [user.role]);

  const otherParticipant = (conv) => conv.participants.find((p) => p._id !== user._id) || conv.participants[0];

  const startNewChat = async (sellerId) => {
    const { data } = await api.post('/chat/conversations', { sellerId });
    window.location.href = `/chat/${data._id}`;
  };

  return (
    <div className="container narrow">
      <h2>Chats</h2>

      {user.role === 'user' && sellers.length > 0 && (
        <div className="seller-list">
          <h4>Start a new chat with a seller</h4>
          {sellers.map((s) => (
            <button key={s._id} onClick={() => startNewChat(s._id)} className="seller-btn">
              {s.name}
            </button>
          ))}
        </div>
      )}

      <ul className="conversation-list">
        {conversations.map((c) => (
          <li key={c._id}>
            <Link to={`/chat/${c._id}`}>
              <strong>{otherParticipant(c)?.name}</strong>
              {c.product && <span className="muted"> — {c.product.name}</span>}
              <p className="muted">{c.lastMessage || 'No messages yet'}</p>
            </Link>
          </li>
        ))}
        {conversations.length === 0 && <p>No conversations yet.</p>}
      </ul>
    </div>
  );
}
