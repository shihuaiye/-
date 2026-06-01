type QuickReplyBarProps = {
  replies: string[];
  onPick: (text: string) => void;
  disabled?: boolean;
  onManage?: () => void;
};

export function QuickReplyBar({
  replies,
  onPick,
  disabled,
  onManage,
}: QuickReplyBarProps) {
  if (!replies.length && !onManage) return null;
  return (
    <div className="quick-reply-bar">
      <span className="quick-reply-label">快捷回复</span>
      <div className="quick-reply-chips">
        {replies.map((text) => (
          <button
            key={text}
            type="button"
            className="quick-reply-chip"
            disabled={disabled}
            onClick={() => onPick(text)}
          >
            {text}
          </button>
        ))}
        {onManage && (
          <button type="button" className="quick-reply-chip manage" onClick={onManage}>
            管理自定义
          </button>
        )}
      </div>
    </div>
  );
}
