/** Auth.js standard names plus legacy GOOGLE_* / DISCORD_* aliases. */
export function getGoogleOAuthConfig() {
  const clientId = process.env.AUTH_GOOGLE_ID ?? process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.AUTH_GOOGLE_SECRET ?? process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

export function getDiscordOAuthConfig() {
  const clientId = process.env.AUTH_DISCORD_ID ?? process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.AUTH_DISCORD_SECRET ?? process.env.DISCORD_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

export function isGoogleOAuthConfigured() {
  return getGoogleOAuthConfig() !== null;
}

export function isDiscordOAuthConfigured() {
  return getDiscordOAuthConfig() !== null;
}
