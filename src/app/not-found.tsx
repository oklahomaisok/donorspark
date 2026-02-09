// Force dynamic rendering to ensure Clerk env vars are available
export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="text-center px-4">
        <h1 className="text-6xl font-bold text-neutral-300 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-neutral-800 mb-2">Page Not Found</h2>
        <p className="text-neutral-500 mb-6">The page you&apos;re looking for doesn&apos;t exist.</p>
        <a
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#C15A36] text-white rounded-full font-semibold hover:bg-[#a84d2e] transition-colors"
        >
          Go Home
        </a>
      </div>
    </div>
  );
}
