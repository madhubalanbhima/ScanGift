/** Formats a numeric sequence into the "1001" voucher ID format. */
export function formatVoucherId(sequence: number): string {
  return `${sequence}`;
}

/** Extracts the raw sequence number from a formatted voucher ID, or null if invalid. */
export function parseVoucherSequence(voucherId: string): number | null {
  const match = voucherId.match(/^(\d+)$/);
  if (!match) return null;
  return parseInt(match[1], 10);
}
