import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { SessionProvider } from 'next-auth/react';
import { Sidebar } from '@/components/dashboard/sidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <SessionProvider session={session}>
      <div className="min-h-screen bg-background">
        <Sidebar />
        {/* Main content area — offset by sidebar width */}
        <main className="lg:pl-[280px] transition-all duration-300">
          <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </SessionProvider>
  );
}
