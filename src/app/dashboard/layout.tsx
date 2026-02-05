import { Nav } from '@/components/nav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Nav />
      <main className="w-full max-w-[1400px] mx-auto px-4 pt-24 pb-12">
        {children}
      </main>
    </>
  );
}
