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
          '<0.15'
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
          '<0.15'
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
    <div className="page-heading">
      <div>
        <div className="eyebrow">YOUR KNOWLEDGE, IN CONVERSATION</div>
        <h1>
          Ask anything.
          <br />
          <span>Find it in your documents.</span>
        </h1>
        <p className="heading-description">
          Skip the searching. Ask a question in your own words and get answers
          grounded in the files you trust.
        </p>
      </div>
      <div className="heading-art" ref={containerRef} aria-hidden="true">
        <div className="shuffle-deck">
          <div
            className="shuffle-card card-voice"
            ref={cardVoiceRef}
            title="Voice assistance"
          >
            <AudioLines size={28} />
          </div>
          <div
            className="shuffle-card card-doc"
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
