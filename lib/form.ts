export type FormState = { error?: string; ok?: string };

export const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

/** Only allow same-site relative redirects. */
export function safeNext(v: string | null | undefined, fallback = "/account") {
  if (v && v.startsWith("/") && !v.startsWith("//")) return v;
  return fallback;
}
