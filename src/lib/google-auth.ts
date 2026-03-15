import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

const isCustomDomain = () =>
  !window.location.hostname.includes("lovable.app") &&
  !window.location.hostname.includes("lovableproject.com");

/**
 * Sign in with Google, handling both Lovable preview and custom domains.
 * On custom domains the auth-bridge (/~oauth) doesn't exist, so we
 * bypass it by getting the OAuth URL directly and redirecting manually.
 */
export async function signInWithGoogle(redirectPath = "/auth-redirect") {
  if (isCustomDomain()) {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}${redirectPath}`,
        skipBrowserRedirect: true,
      },
    });

    if (error) return { error };

    if (data?.url) {
      window.location.href = data.url;
    }

    return { error: null };
  }

  // On Lovable preview domains, use the managed auth-bridge
  return lovable.auth.signInWithOAuth("google", {
    redirect_uri: `${window.location.origin}${redirectPath}`,
  });
}
