/** Shared Tailwind class strings so buttons and fields look the same everywhere. */
const base =
  "inline-flex items-center justify-center rounded-full text-sm font-medium tracking-wide transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:opacity-60 disabled:pointer-events-none";

export const btn = `${base} bg-burgundy px-6 py-3 text-ivory hover:bg-burgundy-deep`;
export const btnGold = `${base} bg-gold-soft px-6 py-3 text-burgundy-deep hover:bg-champagne`;
export const btnOutline = `${base} border border-burgundy px-6 py-3 text-burgundy hover:bg-burgundy hover:text-ivory`;
export const btnSmall = `${base} bg-burgundy px-3.5 py-1.5 text-xs text-ivory hover:bg-burgundy-deep`;
export const btnSmallOutline = `${base} border border-burgundy/40 px-3.5 py-1.5 text-xs text-burgundy hover:bg-burgundy hover:text-ivory`;
export const btnSmallDanger = `${base} border border-red-800/40 px-3.5 py-1.5 text-xs text-red-800 hover:bg-red-800 hover:text-white`;
export const input =
  "w-full rounded-lg border border-ink/20 bg-white px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-muted/70 focus:border-burgundy focus:ring-2 focus:ring-burgundy/20";
export const label = "mb-1.5 block text-sm font-medium text-ink";
export const card = "rounded-2xl border border-ink/10 bg-white p-6 shadow-sm";
export const eyebrow = "text-xs font-medium uppercase tracking-[0.22em] text-gold";
export const container = "mx-auto w-full max-w-6xl px-5 sm:px-8";
