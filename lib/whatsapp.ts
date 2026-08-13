/**
 * Sends the e-voucher image + voucher ID to the customer's WhatsApp number
 * using the Meta WhatsApp Cloud API.
 *
 * Required env vars:
 *  - WHATSAPP_TOKEN            Permanent/system-user access token
 *  - WHATSAPP_PHONE_NUMBER_ID  The "Phone number ID" from Meta App > WhatsApp > API Setup
 *  - WHATSAPP_API_VERSION      Optional, defaults to v20.0
 *
 * The number is sent in whatever format you store it in (digits only). If your
 * WhatsApp Business Account requires the country code, make sure the form collects
 * it (e.g. 91XXXXXXXXXX) — adjust WHATSAPP_REGEX in lib/validators.ts if you want
 * to enforce a specific length/prefix.
 */

interface SendResult {
  success: boolean;
  error?: string;
}

export async function sendVoucherOnWhatsApp(params: {
  toNumber: string;
  customerName: string;
  voucherId: string;
  voucherImageUrl: string;
}): Promise<SendResult> {
  const { toNumber, customerName, voucherId, voucherImageUrl } = params;

  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const apiVersion = process.env.WHATSAPP_API_VERSION || "v20.0";

  if (!token || !phoneNumberId) {
    return {
      success: false,
      error:
        "WhatsApp credentials are not configured (WHATSAPP_TOKEN / WHATSAPP_PHONE_NUMBER_ID).",
    };
  }

  const caption = `Hello ${customerName}, here is your eGold e-voucher.\nVoucher ID: ${voucherId}`;

  try {
    const response = await fetch(
      `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: toNumber,
          type: "image",
          image: {
            link: voucherImageUrl,
            caption,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data?.error?.message || `WhatsApp API error (${response.status})`,
      };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown WhatsApp send error",
    };
  }
}
