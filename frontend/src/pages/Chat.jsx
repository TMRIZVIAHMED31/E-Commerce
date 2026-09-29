import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import ChatLogo from '../components/ChatLogo';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bubble, BubbleContent } from '@/components/ui/bubble';
import { Marker, MarkerContent } from '@/components/ui/marker';
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
} from '@/components/ui/message';

const formatDateTime = (value) => (
  value
    ? new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value))
    : ''
);

const initialsFor = (name = '') => name
  .split(' ')
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0].toUpperCase())
  .join('') || '?';

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
        {messages.map((m) => {
          const isMine = m.sender?._id === user._id;
          const senderName = m.sender?.name || 'Unknown user';
          const avatarUrl = m.sender?.avatar || m.sender?.image;

          return (
            <Message key={m._id} align={isMine ? 'end' : 'start'}>
              <MessageAvatar>
                <Avatar>
                  {avatarUrl && <AvatarImage src={avatarUrl} alt={senderName} />}
                  <AvatarFallback>{initialsFor(senderName)}</AvatarFallback>
                </Avatar>
              </MessageAvatar>
              <MessageContent>
                <span className="sender">{senderName}</span>
                <Bubble variant={isMine ? 'default' : 'muted'}>
                  <BubbleContent>{m.text}</BubbleContent>
                </Bubble>
                <MessageFooter>
                  {formatDateTime(m.createdAt)}{isMine ? ' - Delivered' : ''}
                </MessageFooter>
              </MessageContent>
            </Message>
          );
        })}
        {othersTyping && (
          <Marker role="status">
            <MarkerContent>
              Someone is typing...
            </MarkerContent>
          </Marker>
        )}
        <div ref={bottomRef} />
      </div>

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
