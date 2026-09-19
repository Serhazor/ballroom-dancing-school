/** Resolve metadata URLs without making an optional setting a build dependency. */
export function getSiteUrl(): URL {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
  ];

  for (const candidate of candidates) {
    const value = candidate?.trim();
    if (!value) continue;

    try {
      // Vercel's system URLs are hostnames without a protocol.
      const url = new URL(value.includes("://") ? value : `https://${value}`);
      if (url.protocol === "https:" || url.protocol === "http:") return url;
    } catch {
      // A blank or invalid custom URL must not prevent the site from building.
    }
  }

  return new URL("http://localhost:3000");
}
