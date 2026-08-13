import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Customer } from "@/models/Customer";
import { ADMIN_COOKIE_NAME, isValidSessionToken } from "@/lib/adminAuth";

function csvEscape(value: unknown): string {
  const str = String(value ?? "");
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!isValidSessionToken(token)) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const customers = await Customer.find().sort({ createdAt: -1 }).lean();

    const headers = [
      "Voucher ID",
      "Full Name",
      "WhatsApp Number",
      "Address",
      "Delivery Status",
      "Delivery Error",
      "Registered At",
    ];

    const rows = customers.map((c) =>
      [
        c.voucherId,
        c.fullName,
        c.whatsappNumber,
        c.address,
        c.deliveryStatus,
        c.deliveryError || "",
        new Date(c.createdAt).toISOString(),
      ]
        .map(csvEscape)
        .join(",")
    );

    const csv = [headers.join(","), ...rows].join("\n");
    const filename = `egold-customers-${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("GET /api/admin/export error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to export data." },
      { status: 500 }
    );
  }
}
