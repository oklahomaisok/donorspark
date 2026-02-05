import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

export const metadata: Metadata = {
  title: 'DonorSpark | Story Decks That Move Donors to Give',
  description: 'Turn your nonprofit website into a stunning, shareable impact deck in seconds. Powered by AI.',
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.png',
  },
  openGraph: {
    title: 'DonorSpark | Story Decks That Move Donors to Give',
    description: 'Turn your nonprofit website into a stunning, shareable impact deck in seconds. Powered by AI.',
    url: 'https://donorspark.app',
    siteName: 'DonorSpark',
    images: [
      {
        url: 'https://donorspark.app/og-image.png',
        width: 1200,
        height: 630,
        alt: 'DonorSpark - Story Decks That Move Donors to Give',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DonorSpark | Story Decks That Move Donors to Give',
    description: 'Turn your nonprofit website into a stunning, shareable impact deck in seconds. Powered by AI.',
    images: ['https://donorspark.app/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@300;400;500;600;700&display=swap"
            rel="stylesheet"
          />
        </head>
        <body className="antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
