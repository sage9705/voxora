'use client';

import { useEffect, useRef } from 'react';
import { AudioLines, FileText } from 'lucide-react';
import gsap from 'gsap';

export function PageHeading() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardVoiceRef = useRef<HTMLDivElement>(null);
  const cardDocRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Initial card stack setup
      gsap.set(cardVoiceRef.current, {
        x: 0,
        y: 0,
        rotation: 0,
        scale: 1,
        zIndex: 2,
        opacity: 1,
      });

      gsap.set(cardDocRef.current, {
        x: 4,
        y: 4,
        rotation: -4,
        scale: 0.92,
        zIndex: 1,
        opacity: 0.75,
      });

      // Card shuffle timeline: alternatively sliding out and tucking behind
      const shuffleTl = gsap.timeline({ repeat: -1 });

      shuffleTl
        // Display Voice card on top for 2.2s
        .to({}, { duration: 2.2 })
        // Voice card slides out to the right with card tilt
        .to(cardVoiceRef.current, {
          x: 52,
          y: -6,
          rotation: 12,
          scale: 1.05,
          duration: 0.42,
          ease: 'power2.out',
        })
        // Document card steps up to front
        .to(
          cardDocRef.current,
          {
            x: 0,
            y: 0,
            rotation: 0,
            scale: 1,
            opacity: 1,
            zIndex: 2,
            duration: 0.35,
            ease: 'power2.out',
          },
          '<0.15',
        )
        // Swap voice card z-index behind document card
        .set(cardVoiceRef.current, { zIndex: 1 })
        // Slide voice card in behind document card
        .to(cardVoiceRef.current, {
          x: -4,
          y: 4,
          rotation: 4,
          scale: 0.92,
          opacity: 0.75,
          duration: 0.42,
          ease: 'power2.inOut',
        })

        // Display Document card on top for 2.2s
        .to({}, { duration: 2.2 })
        // Document card slides out to the left with opposite tilt
        .to(cardDocRef.current, {
          x: -52,
          y: -6,
          rotation: -12,
          scale: 1.05,
          duration: 0.42,
          ease: 'power2.out',
        })
        // Voice card steps up to front
        .to(
          cardVoiceRef.current,
          {
            x: 0,
            y: 0,
            rotation: 0,
            scale: 1,
            opacity: 1,
            zIndex: 2,
            duration: 0.35,
            ease: 'power2.out',
          },
          '<0.15',
        )
        // Swap document card z-index behind voice card
        .set(cardDocRef.current, { zIndex: 1 })
        // Slide document card in behind voice card
        .to(cardDocRef.current, {
          x: 4,
          y: 4,
          rotation: -4,
          scale: 0.92,
          opacity: 0.75,
          duration: 0.42,
          ease: 'power2.inOut',
        });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div className="pt-11 pb-8 flex items-center justify-between min-h-[236px] max-[760px]:py-8 max-[760px]:min-h-0">
      <div>
        <div className="flex items-center gap-[9px] font-mono font-semibold text-[11.5px] tracking-[1.3px] text-muted max-[760px]:text-[10.5px]">
          YOUR KNOWLEDGE, IN CONVERSATION
        </div>
        <h1 className="font-heading font-semibold text-[clamp(34px,4.1vw,48px)] leading-[1.14] tracking-[-2px] my-[19px_0_14px] max-[1050px]:text-[39px] max-[760px]:text-[clamp(30px,8vw,40px)] max-[760px]:tracking-[-1.7px] max-[760px]:my-[15px_0_10px]">
          Ask anything.
          <br />
          <span className="text-muted">Find it in your documents.</span>
        </h1>
        <p className="text-[15px] leading-[1.7] text-muted max-w-[520px] m-0 max-[760px]:text-[13.5px] max-[760px]:max-w-[440px]">
          Skip the searching. Ask a question in your own words and get answers
          grounded in the files you trust.
        </p>
      </div>
      <div
        className="relative w-[140px] h-[120px] flex-[0_0_140px] mr-[25px] grid place-items-center max-[1050px]:mr-0 max-[1050px]:scale-[0.85] max-[760px]:hidden"
        ref={containerRef}
        aria-hidden="true"
      >
        <div className="relative w-[60px] h-16 grid place-items-center z-[2]">
          <div
            className="absolute w-[58px] h-[62px] rounded-2xl bg-panel-raised border border-line-strong grid place-items-center shadow-[0_10px_28px_rgba(0,0,0,0.35)] [transform-origin:center_center] [will-change:transform,opacity] text-accent"
            ref={cardVoiceRef}
            title="Voice assistance"
          >
            <AudioLines size={28} />
          </div>
          <div
            className="absolute w-[58px] h-[62px] rounded-2xl bg-panel-raised border border-[color-mix(in_srgb,var(--accent)_25%,var(--line-strong))] grid place-items-center shadow-[0_10px_28px_rgba(0,0,0,0.35)] [transform-origin:center_center] [will-change:transform,opacity] text-text"
            ref={cardDocRef}
            title="Document intelligence"
          >
            <FileText size={26} />
          </div>
        </div>
      </div>
    </div>
  );
}
