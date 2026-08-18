import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import QRCode from "qrcode";
import { connectToDatabase } from "@/lib/mongodb";
import { Customer } from "@/models/Customer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function getBaseUrl(req: NextRequest): string {
  const configured = process.env.NEXT_PUBLIC_BASE_URL;
  if (configured) return configured.replace(/\/+$/, "");
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host = req.headers.get("host");
  return `${proto}://${host}`;
}

function getBranchImageUrl(req: NextRequest): string {
  const configured = process.env.NEXT_PUBLIC_BRANCH_IMAGE_URL;
  if (configured) return configured.replace(/\/+$/, "");
  return `${getBaseUrl(req)}/images/annanagar.jpeg`;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { voucherId: string } }
) {
  try {
    const rawVoucherId = decodeURIComponent(params.voucherId).trim();
    const normalizedVoucherId = rawVoucherId.replace(/^#/, "");
    const candidateIds = Array.from(
      new Set([rawVoucherId, normalizedVoucherId, `#${normalizedVoucherId}`])
    );

    await connectToDatabase();
    const customer = await Customer.findOne({ voucherId: { $in: candidateIds } }).lean();

    if (!customer) {
      console.error("[voucher-image] Voucher not found:", rawVoucherId);
      return new Response("Voucher not found", { status: 404 });
    }

    const baseUrl = getBaseUrl(req);
    
    let qrDataUrl: string | null = null;
    try {
      const scanUrl = `${baseUrl}/voucher/${encodeURIComponent(
        customer.voucherId
      )}?customer=${encodeURIComponent(customer.whatsappNumber)}`;
      qrDataUrl = await QRCode.toDataURL(scanUrl, {
        margin: 1,
        width: 220,
        color: { dark: "#181511", light: "#ffffff" },
      });
    } catch (err) {
      console.error("[voucher-image] Failed to generate QR code:", err);
    }

    const imageResponse = new ImageResponse(
      (
        <div
          style={{
            position: "relative",
            width: "1200px",
            height: "630px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)",
            fontFamily: "Arial, sans-serif",
            color: "#ffffff",
          }}
        >
          {/* Top Section: Bhima Header */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginBottom: "30px",
              borderBottom: "2px solid #d4af37",
              paddingBottom: "20px",
              width: "90%",
            }}
          >
            <div
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                letterSpacing: "4px",
                color: "#d4af37",
              }}
            >
              BHIMA GOLD
            </div>
            <div
              style={{
                fontSize: "48px",
                fontWeight: "900",
                letterSpacing: "6px",
                color: "#f4d36d",
                marginTop: "10px",
              }}
            >
              B H I M A
            </div>
          </div>

          {/* Middle Section: Customer Info and QR */}
          <div
            style={{
              display: "flex",
              width: "90%",
              gap: "40px",
              alignItems: "center",
              justifyContent: "space-between",
              flex: 1,
            }}
          >
            {/* Left: Customer Details */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "20px",
              }}
            >
              <div>
                <div style={{ fontSize: "14px", color: "#d4af37", letterSpacing: "2px" }}>
                  E-VOUCHER
                </div>
                <div style={{ fontSize: "36px", fontWeight: "bold", color: "#f4d36d" }}>
                  {customer.fullName}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "14px", color: "#999" }}>Voucher ID</div>
                <div style={{ fontSize: "40px", fontWeight: "bold", color: "#d4af37" }}>
                  {customer.voucherId}
                </div>
              </div>
            </div>

            {/* Right: QR Code */}
            {qrDataUrl && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  background: "#ffffff",
                  padding: "15px",
                  borderRadius: "12px",
                  boxShadow: "0 5px 20px rgba(0,0,0,0.3)",
                }}
              >
                <img
                  src={qrDataUrl}
                  width="120"
                  height="120"
                  alt="Voucher QR code"
                  style={{ display: "block" }}
                />
                <div
                  style={{
                    fontSize: "12px",
                    color: "#181511",
                    marginTop: "8px",
                    fontWeight: "bold",
                  }}
                >
                  Scan to Verify
                </div>
              </div>
            )}
          </div>

          {/* Footer: Amount */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginTop: "30px",
              borderTop: "2px solid #d4af37",
              paddingTop: "20px",
              width: "90%",
            }}
          >
            <div style={{ fontSize: "32px", fontWeight: "bold", color: "#f4d36d" }}>
              ₹ 5000
            </div>
            <div style={{ fontSize: "14px", color: "#999", marginTop: "8px" }}>
              Gift Voucher
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );

    imageResponse.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    imageResponse.headers.set("Pragma", "no-cache");
    imageResponse.headers.set("Expires", "0");
    return imageResponse;
  } catch (err) {
    console.error("[voucher-image] Unhandled error:", err);
    return new Response("Failed to generate voucher image", { status: 500 });
  }
}