ximport type { Metadata } from 'next';
import './globals.css';
import { LocationProvider } from '@/context/LocationContext';

export const metadata: Metadata = {
  title: 'Sales Command Center & KPI Intelligence Dashboard',
  description: 'Enterprise Sales Command Center & KPI Intelligence Engine for GoHighLevel',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen w-full flex bg-[#f8f9fc] text-[#1e293b] antialiased">
        <LocationProvider>{children}</LocationProvider>
      </body>
    </html>
  );
}
