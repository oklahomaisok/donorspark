import { SignUp } from '@clerk/nextjs';

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string }>;
}) {
  const params = await searchParams;
  const redirectUrl = params.redirect_url || '/dashboard';

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
      <SignUp fallbackRedirectUrl={redirectUrl} />
    </div>
  );
}
