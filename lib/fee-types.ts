/* The fee, as it stands for one trainee — shared by the server (lib/referrals.ts works it out) and the screens that
 * show it. Pure: no database here, so client components can import it. */
export const PAY_METHODS = [
  ["cash", "Cash"],
  ["bank", "Bank transfer"],
  ["jazzcash", "JazzCash"],
  ["easypaisa", "Easypaisa"],
  ["card", "Card"],
  ["other", "Other"],
] as const;
export type PayMethod = (typeof PAY_METHODS)[number][0];
export const methodLabel = (m: string) => PAY_METHODS.find(([id]) => id === m)?.[1] ?? "Other";

export type FeePayment = { id: string; amount: number; at: string; method: string; note: string; by: string };

export type FeeStatus = {
  full: number; // the program before the 50% off
  fee: number; // the fee (50% off)
  discount: number; // off the fee for friends who joined
  total: number; // what's owed after that
  paid: number; // received so far
  balance: number; // still to pay (0 once settled)
  over: number; // received beyond what's owed (to refund or credit)
  waived: number; // left unpaid when an admin settled it by hand
  settled: boolean; // paid in full (the program is open)
  implied: boolean; // settled before payments were recorded — counted as paid in full
  payments: FeePayment[]; // oldest first
};

export const money = (n: number) => `PKR ${n.toLocaleString("en-US")}`;
