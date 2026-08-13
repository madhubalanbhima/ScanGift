import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE_NAME, isValidSessionToken } from "@/lib/adminAuth";
import { connectToDatabase } from "@/lib/mongodb";
import { Customer } from "@/models/Customer";
import AdminTable from "./AdminTable";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const token = cookies().get(ADMIN_COOKIE_NAME)?.value;
  if (!isValidSessionToken(token)) {
    redirect("/admin/login");
  }

  await connectToDatabase();
  const customersDoc = await Customer.find().sort({ createdAt: -1 }).lean();
  const customers = customersDoc.map((c) => ({
    id: String(c._id),
    fullName: c.fullName,
    whatsappNumber: c.whatsappNumber,
    address: c.address,
    voucherId: c.voucherId,
    deliveryStatus: c.deliveryStatus,
    createdAt: new Date(c.createdAt).toISOString(),
  }));

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="inline-block px-3 py-1 rounded-full border border-gold/40 text-gold-dark text-xs tracking-[0.25em] uppercase mb-3">
              Admin
            </div>
            <h1 className="font-display text-3xl text-ink">Customer registrations</h1>
            <p className="text-charcoal/60 mt-1">
              {customers.length} voucher{customers.length === 1 ? "" : "s"} issued
            </p>
          </div>
        </div>

        <AdminTable customers={customers} />
      </div>
    </main>
  );
}
