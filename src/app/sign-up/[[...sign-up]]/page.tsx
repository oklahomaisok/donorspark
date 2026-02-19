import { SignUp } from '@clerk/nextjs';

function getSafeRedirectUrl(value?: string): string {
  if (!value) return '/dashboard';

  // Only allow same-origin relative redirects.
  return value.startsWith('/') ? value : '/dashboard';
}

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string }>;
}) {
  const params = await searchParams;
  const redirectUrl = getSafeRedirectUrl(params.redirect_url);

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
      <SignUp
        fallbackRedirectUrl={redirectUrl}
        forceRedirectUrl={redirectUrl}
      />
    </div>
  );
}
