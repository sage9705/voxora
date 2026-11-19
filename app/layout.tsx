import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Voxora | Talk to your documents',
  description:
    'Ask questions about PDFs by typing or speaking. Get answers grounded in your documents, with source references.',
};

const veltrixKey = process.env.NEXT_PUBLIC_VELTRIX_PROJECT_KEY;
const veltrixEndpoint = process.env.NEXT_PUBLIC_VELTRIX_ENDPOINT || 'https://veltrix-ufyc.vercel.app/api/v1/events';

const veltrixInitScript = veltrixKey
  ? `window.addEventListener("DOMContentLoaded",function(){window.veltrix&&window.veltrix.init({projectKey:"${veltrixKey}",endpoint:"${veltrixEndpoint}",respectDoNotTrack:false})});`
  : '';

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        {veltrixKey && (
          <>
            <script defer src="/veltrix.global.js" />
            <script dangerouslySetInnerHTML={{ __html: veltrixInitScript }} />
          </>
        )}
      </body>
    </html>
  );
}
