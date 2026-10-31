/**
 * FoodTrace Verification & Digital Signatures Engine
 */

export function generateBatchTrackingCode(sequence: number): string {
  const year = new Date().getFullYear();
  return `AS-${year}-${sequence.toString().padStart(4, "0")}`;
}

export function generateDigitalHandshakeSignature(
  donorId: string,
  inspectorId: string,
  tier: string
): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  return `SIG-AS-${donorId.slice(-3).toUpperCase()}-${tier.slice(0, 5).toUpperCase()}-${timestamp}`;
}

export function parseTrackingQRCode(qrData: string): { isValid: boolean; trackingCode: string } {
  const clean = qrData.trim().toUpperCase();
  const isValid = /^AS-\d{4}-\d{4}$/.test(clean);
  return {
    isValid,
    trackingCode: clean,
  };
}
