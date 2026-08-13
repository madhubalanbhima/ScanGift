import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ADMIN_COOKIE_NAME, isValidSessionToken } from "@/lib/adminAuth";
import { Customer } from "@/models/Customer";
import { Counter, resetCounter } from "@/models/Counter";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!isValidSessionToken(token)) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectToDatabase();

    await Customer.deleteMany({});
    await Counter.deleteMany({ _id: "voucher" });
    await resetCounter("voucher", 1000);

    return NextResponse.json({
      success: true,
      message: "Customer data cleared and voucher counter reset to 1001.",
      nextVoucher: 1001,
    });
  } catch (err) {
    console.error("POST /api/admin/reset error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to reset data." },
      { status: 500 }
    );
  }
}
