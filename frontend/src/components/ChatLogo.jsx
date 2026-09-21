export default function ChatLogo({ className = '' }) {
  return (
    <span className={`chat-logo ${className}`.trim()} aria-hidden="true">
      <span className="chat-logo-bubble chat-logo-bubble-primary">
        <span /><span /><span />
      </span>
      <span className="chat-logo-bubble chat-logo-bubble-secondary" />
    </span>
  );
}
