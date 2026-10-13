import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Voxora | Talk to your documents',
  description:
    'Ask questions about PDFs by typing or speaking. Get answers grounded in your documents, with source references.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
