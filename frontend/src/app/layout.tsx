import type { Metadata } from 'next';
import { AuthProvider } from '@/contexts/AuthContext';
import { ErrorBoundary } from '@/components/base/ErrorBoundary';
import { ToastProvider } from '@/components/base/Toast';
import './globals.css';

export const metadata: Metadata = {
  title: 'Personal Drive',
  description: 'A personal file storage and management application',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          <ToastProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </ToastProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
