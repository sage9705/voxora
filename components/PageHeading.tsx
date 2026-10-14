import { AudioLines } from 'lucide-react';

export function PageHeading() {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">
          <span className="eyebrow-line" /> YOUR KNOWLEDGE, IN CONVERSATION
        </div>
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
      <div className="heading-art" aria-hidden="true">
        <div className="art-orbit orbit-one" />
        <div className="art-orbit orbit-two" />
        <div className="art-center">
          <AudioLines size={34} />
        </div>
        <span className="art-dot dot-one" />
        <span className="art-dot dot-two" />
        <span className="art-dot dot-three" />
      </div>
    </div>
  );
}
