'use client';

import {
  ArrowUpRight,
  LoaderCircle,
  Mic,
  MicOff,
  Send,
  ShieldCheck,
} from 'lucide-react';

type ComposerProps = {
  question: string;
  setQuestion: (q: string) => void;
  asking: boolean;
  listening: boolean;
  starters: Array<{ label: string; question: string }>;
  onAsk: (question?: string, fromVoice?: boolean) => void;
  onToggleVoice: () => void;
};

export function Composer({
  question,
  setQuestion,
  asking,
  listening,
  starters,
  onAsk,
  onToggleVoice,
}: ComposerProps) {
  return (
    <div className="composer-wrap">
      <div className="suggested-prompts">
        {starters.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => onAsk(item.question)}
            title={item.question}
          >
            {item.label} <ArrowUpRight size={12} />
          </button>
        ))}
      </div>
      <form
        className="composer"
        onSubmit={(event) => {
          event.preventDefault();
          onAsk(question, listening);
        }}
      >
        <button
          type="button"
          className={`mic-button ${listening ? 'recording' : ''}`}
          onClick={onToggleVoice}
          title={listening ? 'Stop voice input' : 'Ask by voice'}
        >
          {listening ? <MicOff size={18} /> : <Mic size={18} />}
        </button>
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder={
            listening
              ? 'Listening… speak your question'
              : 'Ask a question about your documents…'
          }
          aria-label="Your question"
        />
        <button
          type="submit"
          className="send-button"
          disabled={!question.trim() || asking}
          aria-label="Send question"
        >
          {asking ? (
            <LoaderCircle size={17} className="spin" />
          ) : (
            <Send size={17} />
          )}
        </button>
      </form>
      <div className="composer-foot">
        <span>
          <span className="kbd">↵</span> to ask
        </span>
        <span>
          <ShieldCheck size={13} /> Answers are grounded in your loaded files
        </span>
      </div>
    </div>
  );
}
