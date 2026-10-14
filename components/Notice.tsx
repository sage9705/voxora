'use client';

import { X } from 'lucide-react';

type NoticeProps = {
  message: string;
  onDismiss: () => void;
};

export function Notice({ message, onDismiss }: NoticeProps) {
  if (!message) return null;

  return (
    <div className="notice" role="status">
      <span>{message}</span>
      <button onClick={onDismiss} aria-label="Dismiss message">
        <X size={14} />
      </button>
    </div>
  );
}
