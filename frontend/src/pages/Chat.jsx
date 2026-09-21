import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import ChatLogo from '../components/ChatLogo';

const formatDateTime = (value) => (
  value
    ? new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value))
    : ''
);

export default function Chat() {
  const { conversationId } = useParams();
  const { user } = useAuth();
  const { socket, connected } = useSocket();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [othersTyping, setOthersTyping] = useState(false);
  const bottomRef = useRef(null);

  // Load message history over REST
  useEffect(() => {
    api.get(`/chat/messages/${conversationId}`).then((res) => setMessages(res.data));
  }, [conversationId]);

  // Join the room and listen for real-time events
  useEffect(() => {
    if (!socket || !connected) return;

    socket.emit('joinConversation', conversationId);

    const onNewMessage = (msg) => {
      if (msg.conversation === conversationId) {
        setMessages((prev) => [...prev, msg]);
      }
    };
    const onTyping = ({ isTyping }) => setOthersTyping(isTyping);

    socket.on('newMessage', onNewMessage);
    socket.on('typing', onTyping);

    return () => {
      socket.off('newMessage', onNewMessage);
      socket.off('typing', onTyping);
    };
  }, [socket, connected, conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!text.trim() || !socket) return;
    socket.emit('sendMessage', { conversationId, text });
    setText('');
    socket.emit('typing', { conversationId, isTyping: false });
  };

  const handleTyping = (e) => {
    setText(e.target.value);
    socket?.emit('typing', { conversationId, isTyping: true });
  };

  return (
    <div className="container narrow chat-page">
      <h2 className="chat-heading"><ChatLogo /> Chat {!connected && <span className="muted">(connecting...)</span>}</h2>

      <div className="messages">
        {messages.map((m) => (
          <div
            key={m._id}
            className={`message ${m.sender?._id === user._id ? 'mine' : 'theirs'}`}
          >
            <span className="sender">{m.sender?.name}</span>
            <p>{m.text}</p>
            <time className="message-time" dateTime={m.createdAt}>
              Sent: {formatDateTime(m.createdAt)}
            </time>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {othersTyping && <p className="muted">Typing...</p>}

      <form onSubmit={sendMessage} className="chat-input">
        <input
          value={text}
          onChange={handleTyping}
          placeholder="Type a message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
