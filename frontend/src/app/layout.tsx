import './globals.css';
import Providers from '@/components/providers';
import { ToastProvider } from '@/components/ui/toast';

export const metadata = {
  title: 'Affiliate Graphics Management System',
  description: 'Manage and bulk match promotional graphics to affiliates with ease.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen bg-background text-white">
        <Providers>
          <ToastProvider>
            {children}
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
