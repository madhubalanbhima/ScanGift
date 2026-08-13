import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Customer } from "@/models/Customer";
import { getNextSequence } from "@/models/Counter";
import { formatVoucherId } from "@/lib/voucher";
import { validateRegistration, hasErrors } from "@/lib/validators";
import { sendVoucherOnWhatsApp } from "@/lib/whatsapp";
import { ADMIN_COOKIE_NAME, isValidSessionToken } from "@/lib/adminAuth";

function getBaseUrl(req: NextRequest): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host = req.headers.get("host");
  return `${proto}://${host}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const errors = validateRegistration(body);

    if (hasErrors(errors)) {
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    const fullName = String(body.fullName).trim();
    const whatsappNumber = String(body.whatsappNumber).trim();
    const address = String(body.address).trim();

    await connectToDatabase();

    const sequence = await getNextSequence("voucher");
    const voucherId = formatVoucherId(sequence);

    const customer = await Customer.create({
      fullName,
      whatsappNumber,
      address,
      voucherId,
      voucherSequence: sequence,
      deliveryStatus: "pending",
    });

    const voucherImageUrl = `${getBaseUrl(req)}/api/voucher-image/${encodeURIComponent(
      voucherId
    )}`;

    const sendResult = await sendVoucherOnWhatsApp({
      toNumber: whatsappNumber,
      customerName: fullName,
      voucherId,
      voucherImageUrl,
    });

    customer.deliveryStatus = sendResult.success ? "sent" : "failed";
    if (!sendResult.success) customer.deliveryError = sendResult.error;
    await customer.save();

    return NextResponse.json(
      {
        success: true,
        voucherId,
        deliveryStatus: customer.deliveryStatus,
        deliveryError: customer.deliveryError,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/customers error:", err);
    return NextResponse.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!isValidSessionToken(token)) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const customers = await Customer.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, customers });
  } catch (err) {
    console.error("GET /api/customers error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to fetch customers." },
      { status: 500 }
    );
  }
}
