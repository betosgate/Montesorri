import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'Montessori Homeschool — Complete K-6 Curriculum Platform',
    template: '%s | Montessori Homeschool',
  },
  description:
    'A complete K-6 Montessori homeschool platform with daily lessons, live Zoom classes, mastery tracking, and parent community. $50/month per student.',
  keywords: [
    'Montessori',
    'homeschool',
    'curriculum',
    'K-6',
    'elementary',
    'online learning',
    'Montessori at home',
    'homeschool program',
  ],
  openGraph: {
    title: 'Montessori Homeschool — Complete K-6 Curriculum',
    description:
      'Full Montessori curriculum with daily lessons, live classes, and progress tracking. Everything you need to homeschool the Montessori way.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
