'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

type NoticeProps = {
  message: string;
  onDismiss: () => void;
  duration?: number;
};

export function Notice({ message, onDismiss, duration }: NoticeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const onDismissRef = useRef(onDismiss);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    if (!message || isHovered) return;

    // Auto-dismiss after 4 seconds (up to 6.5s for longer text)
    const timeoutDuration = duration ?? Math.max(3800, Math.min(6500, message.length * 45));

    const timer = setTimeout(() => {
      onDismissRef.current();
    }, timeoutDuration);

    return () => clearTimeout(timer);
  }, [message, duration, isHovered]);

  if (!message) return null;

  return (
    <div
      className="notice"
      role="status"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span>{message}</span>
      <button onClick={onDismiss} aria-label="Dismiss message">
        <X size={14} />
      </button>
    </div>
  );
}
