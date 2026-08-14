import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Customer } from "@/models/Customer";
import { ADMIN_COOKIE_NAME, isValidSessionToken } from "@/lib/adminAuth";

interface BulkSendResult {
  totalCustomers: number;
  successCount: number;
  failedCount: number;
  results: Array<{
    voucherId: string;
    whatsappNumber: string;
    success: boolean;
    error?: string;
  }>;
}

async function sendTemplateMessage(
  toNumber: string,
  voucherId: string,
  customerName: string
): Promise<{ success: boolean; error?: string }> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const apiVersion = process.env.WHATSAPP_API_VERSION || "v20.0";

  if (!token || !phoneNumberId) {
    return {
      success: false,
      error: "WhatsApp credentials not configured",
    };
  }

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
          type: "template",
          template: {
            name: "hello_world", // Use your approved template name
            language: {
              code: "en_US",
            },
            // If your template has parameters, add them here:
            // parameters: {
            //   body: {
            //     parameters: [customerName, voucherId],
            //   },
            // },
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data?.error?.message || `API error (${response.status})`,
      };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!isValidSessionToken(token)) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { templateName = "hello_world", limit } = body;

    await connectToDatabase();

    // Fetch customers (optionally limit for testing)
    let query = Customer.find();
    if (limit) {
      query = query.limit(parseInt(limit));
    }
    const customers = await query.lean();

    const results: BulkSendResult["results"] = [];
    let successCount = 0;
    let failedCount = 0;

    for (const customer of customers) {
      const result = await sendTemplateMessage(
        customer.whatsappNumber,
        customer.voucherId,
        customer.fullName
      );

      results.push({
        voucherId: customer.voucherId,
        whatsappNumber: customer.whatsappNumber,
        success: result.success,
        error: result.error,
      });

      if (result.success) {
        successCount++;
      } else {
        failedCount++;
      }
    }

    const bulkResult: BulkSendResult = {
      totalCustomers: customers.length,
      successCount,
      failedCount,
      results,
    };

    return NextResponse.json({ success: true, ...bulkResult });
  } catch (err) {
    console.error("POST /api/admin/send-bulk error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to send bulk messages" },
      { status: 500 }
    );
  }
}
