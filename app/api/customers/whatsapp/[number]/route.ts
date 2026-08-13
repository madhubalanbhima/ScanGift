import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Customer } from "@/models/Customer";
import { ADMIN_COOKIE_NAME, isValidSessionToken } from "@/lib/adminAuth";

export async function GET(
  req: NextRequest,
  { params }: { params: { number: string } }
) {
  const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!isValidSessionToken(token)) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const whatsappNumber = decodeURIComponent(params.number).trim();
    const customers = await Customer.find({ whatsappNumber }).sort({ createdAt: -1 }).lean();

    if (customers.length === 0) {
      return NextResponse.json(
        { success: false, message: "No customer found for this WhatsApp number." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, customers });
  } catch (err) {
    console.error("GET /api/customers/whatsapp/[number] error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to fetch customer." },
      { status: 500 }
    );
  }
}
