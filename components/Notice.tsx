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

    const timeoutDuration =
      duration ?? Math.max(3800, Math.min(6500, message.length * 45));

    const timer = setTimeout(() => {
      onDismissRef.current();
    }, timeoutDuration);

    return () => clearTimeout(timer);
  }, [message, duration, isHovered]);

  if (!message) return null;

  return (
    <div
      className="fixed z-10 bottom-[62px] left-[calc(var(--sidebar)+(100vw-var(--sidebar))/2)] -translate-x-1/2 flex items-center gap-3.5 max-w-[min(600px,calc(100vw-30px))] bg-panel-raised border border-line-strong shadow-[var(--shadow)] rounded-[10px] py-[13px] px-4 text-[13px] leading-[1.5] animate-[noticePop_0.22s_cubic-bezier(0.16,1,0.3,1)] max-[760px]:left-1/2 max-[760px]:bottom-5 max-[760px]:text-[12.5px]"
      role="status"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span>{message}</span>
      <button
        className="bg-transparent border-0 text-muted grid place-items-center flex-none cursor-pointer rounded p-0.5 transition-colors duration-150 hover:text-text hover:bg-white/10"
        onClick={onDismiss}
        aria-label="Dismiss message"
      >
        <X size={14} />
      </button>
    </div>
  );
}
