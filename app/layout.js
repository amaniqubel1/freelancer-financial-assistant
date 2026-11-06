import './globals.css';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/lib/auth';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata = {
  title: 'FreelanceFlow | Financial Assistant for Freelancers',
  description: 'Invoices, expenses, taxes and cash flow for independent professionals.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
