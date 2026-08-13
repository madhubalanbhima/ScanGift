/** Formats a numeric sequence into the "#egold-00001" voucher ID format. */
export function formatVoucherId(sequence: number): string {
  return `#egold-${String(sequence).padStart(5, "0")}`;
}

/** Extracts the raw sequence number from a formatted voucher ID, or null if invalid. */
export function parseVoucherSequence(voucherId: string): number | null {
  const match = voucherId.match(/^#egold-(\d{5,})$/);
  if (!match) return null;
  return parseInt(match[1], 10);
}
