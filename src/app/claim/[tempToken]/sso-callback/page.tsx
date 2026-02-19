import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';

export default async function ClaimSsoCallbackPage({
  params,
}: {
  params: Promise<{ tempToken: string }>;
}) {
  const { tempToken } = await params;
  const redirectUrl = `/claim/${tempToken}`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
      <AuthenticateWithRedirectCallback
        signInForceRedirectUrl={redirectUrl}
        signInFallbackRedirectUrl={redirectUrl}
        signUpForceRedirectUrl={redirectUrl}
        signUpFallbackRedirectUrl={redirectUrl}
        signInUrl="/sign-in"
        signUpUrl="/sign-up"
      />
    </div>
  );
}
