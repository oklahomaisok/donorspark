import { SignIn } from '@clerk/nextjs';

export default async function ClaimSsoCallbackPage({
  params,
}: {
  params: Promise<{ tempToken: string }>;
}) {
  const { tempToken } = await params;
  const redirectUrl = `/claim/${tempToken}`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
      <SignIn
        forceRedirectUrl={redirectUrl}
        fallbackRedirectUrl={redirectUrl}
        signUpUrl={`/sign-up?redirect_url=${encodeURIComponent(redirectUrl)}`}
      />
    </div>
  );
}
