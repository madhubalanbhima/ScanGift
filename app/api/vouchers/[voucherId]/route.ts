import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Customer } from "@/models/Customer";
import { ADMIN_COOKIE_NAME, isValidSessionToken } from "@/lib/adminAuth";

export async function GET(
  req: NextRequest,
  { params }: { params: { voucherId: string } }
) {
  const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!isValidSessionToken(token)) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const rawVoucherId = decodeURIComponent(params.voucherId).trim();
    const normalizedVoucherId = rawVoucherId.replace(/^#/, "");
    const candidateIds = Array.from(
      new Set([rawVoucherId, normalizedVoucherId, `#${normalizedVoucherId}`])
    );

    const customer = await Customer.findOne({ voucherId: { $in: candidateIds } }).lean();

    if (!customer) {
      return NextResponse.json(
        { success: false, message: "No customer found for this voucher ID." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, customer });
  } catch (err) {
    console.error("GET /api/vouchers/[voucherId] error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to fetch voucher." },
      { status: 500 }
    );
  }
}
