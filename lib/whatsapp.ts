/**
 * Sends the e-voucher image + voucher ID to the customer's WhatsApp number via the
 * Veup WhatsApp template API.
 *
 * Required env vars:
 *  - VEUP_PROCESS_KEY
 *  - VEUP_API_KEY
 *  - VEUP_CAMPAIGN_NAME
 *  - VEUP_WABA_TEMPLATE_NAME
 *  - VEUP_WABA_SERVICE_NAME
 */

export interface SendResult {
  success: boolean;
  error?: string;
}

async function getVeupAccessToken(): Promise<string> {
  const processKey = process.env.VEUP_PROCESS_KEY;

  if (!processKey) {
    throw new Error("VEUP_PROCESS_KEY is not configured.");
  }

  const response = await fetch("https://c-api.veup.io/auth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ process_key: processKey }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data?.message || data?.error || `Veup auth failed (${response.status})`
    );
  }

  const accessToken =
    data?.access_token ||
    data?.token ||
    data?.data?.access_token ||
    data?.data?.token;

  if (!accessToken) {
    throw new Error("Veup auth response did not include an access token.");
  }

  return String(accessToken);
}

export async function sendVoucherOnWhatsApp(params: {
  toNumber: string;
  customerName: string;
  voucherId: string;
  voucherImageUrl: string;
}): Promise<SendResult> {
  const { toNumber, voucherId, voucherImageUrl } = params;

  const apiKey = process.env.VEUP_API_KEY;
  const campaignName = process.env.VEUP_CAMPAIGN_NAME || "voucher_campaign";
  const templateName = process.env.VEUP_WABA_TEMPLATE_NAME;
  const serviceName = process.env.VEUP_WABA_SERVICE_NAME;

  if (!apiKey || !templateName || !serviceName) {
    return {
      success: false,
      error:
        "Veup WhatsApp settings are not configured (VEUP_API_KEY / VEUP_WABA_TEMPLATE_NAME / VEUP_WABA_SERVICE_NAME).",
    };
  }

  try {
    const accessToken = await getVeupAccessToken();
    const payload = {
      campaign_name: campaignName,
      to: {
        number: toNumber,
      },
      delivery: {
        type: "single",
        channels: ["waba"],
      },
      campaign_data: {
        waba: {
          template_name: templateName,
          service_name: serviceName,
          media_url: voucherImageUrl,
          params: [voucherId],
        },
      },
    };

    const response = await fetch("https://c-api.veup.io/v1/message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "X-API-Key": apiKey,
      },
      body: JSON.stringify({
        ...payload,
        api_key: apiKey,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data?.status === "error" || data?.success === false) {
      return {
        success: false,
        error:
          data?.message ||
          data?.error ||
          data?.detail ||
          `Veup API error (${response.status})`,
      };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown Veup WhatsApp send error",
    };
  }
}
