'use client';

import {
  MdAutorenew,
  MdFactCheck,
  MdKeyboardReturn,
  MdMic,
  MdMicOff,
  MdNorthEast,
  MdSend,
} from 'react-icons/md';

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
    <div className="border-t border-line py-3.5 px-5 pb-[15px] bg-panel max-[760px]:p-[12px_14px]">
      <div className="flex gap-2 mb-[11px] overflow-x-auto no-scrollbar pb-0.5 [touch-action:pan-x]">
        {starters.map((item) => (
          <button
            key={`${item.label}-${item.question}`}
            type="button"
            className="flex items-center gap-1.5 py-1.5 px-[11px] border border-line rounded-md bg-transparent text-muted text-xs max-[760px]:text-[11.5px] whitespace-nowrap flex-shrink-0 cursor-pointer transition-[color,border-color,background-color] duration-150 hover:text-text hover:border-line-strong hover:bg-white/5"
            onClick={() => onAsk(item.question)}
            title={item.question}
          >
            {item.label} <MdNorthEast size={13} />
          </button>
        ))}
      </div>
      <form
        className="h-[52px] border border-line-strong rounded-[10px] flex items-center gap-2.5 px-2 bg-bg transition-all duration-200 hover:border-muted-2 focus-within:border-accent/60 focus-within:ring-1 focus-within:ring-accent/30 focus-within:shadow-[0_0_18px_-2px_color-mix(in_srgb,var(--accent)_18%,transparent),0_2px_8px_rgba(0,0,0,0.25)]"
        onSubmit={(event) => {
          event.preventDefault();
          onAsk(question, listening);
        }}
      >
        <button
          type="button"
          className={`h-9 w-9 flex-[0_0_36px] border-0 rounded-lg grid place-items-center transition-[background,color] duration-150 ${
            listening
              ? 'text-[#ff7979] bg-[#ff79791a] animate-[recordPulse_1.2s_infinite]'
              : 'bg-transparent text-muted hover:bg-panel-soft hover:text-accent'
          }`}
          onClick={onToggleVoice}
          title={listening ? 'Stop voice input' : 'Ask by voice'}
        >
          {listening ? <MdMicOff size={19} /> : <MdMic size={19} />}
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
          className="flex-1 min-w-0 bg-transparent border-0 outline-none text-text text-[14.5px] h-full placeholder:text-muted-2 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
        />
        <button
          type="submit"
          className="h-9 w-[38px] flex-[0_0_38px] grid place-items-center border-0 rounded-lg bg-accent text-accent-ink transition-[filter,transform] duration-150 hover:not-disabled:brightness-105 hover:not-disabled:-translate-y-px disabled:bg-panel-soft disabled:text-muted-2 disabled:cursor-not-allowed"
          disabled={!question.trim() || asking}
          aria-label="Send question"
        >
          {asking ? (
            <MdAutorenew size={18} className="animate-spin" />
          ) : (
            <MdSend size={18} />
          )}
        </button>
      </form>
      <div className="flex items-center justify-between text-[11.5px] max-[760px]:text-[10.5px] text-muted-2 mt-[9px]">
        <span className="flex items-center gap-1.5">
          <span className="inline-flex items-center justify-center border border-line-strong py-0.5 px-[5px] rounded text-muted-2">
            <MdKeyboardReturn size={11} />
          </span>{' '}
          to ask
        </span>
        <span className="flex items-center gap-1.5 [&>svg]:text-cyan">
          <MdFactCheck size={14} /> Answers are grounded in your loaded files
        </span>
      </div>
    </div>
  );
}
