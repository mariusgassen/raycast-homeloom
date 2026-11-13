import { getPreferenceValues, OAuth } from "@raycast/api";
import { t } from "./i18n";

interface Prefs {
  issuer: string;
  clientId: string;
  clientSecret: string;
}

const client = new OAuth.PKCEClient({
  redirectMethod: OAuth.RedirectMethod.Web,
  providerName: "Homeloom",
  providerIcon: "extension-icon.png",
  description: t("signInHelp"),
});

interface Discovery {
  authorization_endpoint: string;
  token_endpoint: string;
}

/** The sign-in address, as Settings shows it, with one slash on the end. */
export function issuerBase(issuer: string): string {
  return issuer.trim().replace(/\/+$/, "") + "/";
}

async function discover(issuer: string): Promise<Discovery> {
  const res = await fetch(issuerBase(issuer) + ".well-known/openid-configuration", {
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(t("signInFailed"));
  return (await res.json()) as Discovery;
}

async function token(
  endpoint: string,
  params: Record<string, string>,
): Promise<OAuth.TokenResponse> {
  const { clientId, clientSecret } = getPreferenceValues<Prefs>();
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId.trim(),
      client_secret: clientSecret.trim(),
      ...params,
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(t("signInFailed"));
  return (await res.json()) as OAuth.TokenResponse;
}

/** An access token for the REST API: the stored one, a refreshed one, or a new sign-in. */
export async function accessToken(): Promise<string> {
  const prefs = getPreferenceValues<Prefs>();
  const stored = await client.getTokens();
  if (stored?.accessToken && !stored.isExpired()) return stored.accessToken;

  const { authorization_endpoint, token_endpoint } = await discover(prefs.issuer);
  if (stored?.refreshToken) {
    try {
      const fresh = await token(token_endpoint, {
        grant_type: "refresh_token",
        refresh_token: stored.refreshToken,
      });
      await client.setTokens({
        ...fresh,
        refresh_token: fresh.refresh_token ?? stored.refreshToken,
      });
      return fresh.access_token;
    } catch {
      // The refresh token is spent or revoked: sign in again.
    }
  }

  const request = await client.authorizationRequest({
    endpoint: authorization_endpoint,
    clientId: prefs.clientId.trim(),
    scope: "openid profile email offline_access",
  });
  const { authorizationCode } = await client.authorize(request);
  const tokens = await token(token_endpoint, {
    grant_type: "authorization_code",
    code: authorizationCode,
    code_verifier: request.codeVerifier,
    redirect_uri: request.redirectURI,
  });
  await client.setTokens(tokens);
  return tokens.access_token;
}

/** Forget the stored sign-in, so the next call asks again. */
export const signOut = () => client.removeTokens();
