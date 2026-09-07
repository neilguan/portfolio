import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000/',
  ),
  title: 'Neil Guan — Systems, Robotics, and Applied AI',
  description:
    'Neil Guan builds AI-assisted GPU systems, robotics research, local AI infrastructure, and hardware with verification-first engineering.',
  openGraph: {
    title: 'Neil Guan — Systems, Robotics, and Applied AI',
    description:
      'AI-assisted GPU software, robotics research, local AI infrastructure, and verification-first engineering.',
    type: 'website',
    images: [
      {
        url: './og.png',
        width: 1200,
        height: 630,
        alt: 'Neil Guan — Systems, Robotics, and Applied AI',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Neil Guan — Systems, Robotics, and Applied AI',
    description:
      'AI-assisted GPU software, robotics research, local AI infrastructure, and verification-first engineering.',
    images: ['./og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
