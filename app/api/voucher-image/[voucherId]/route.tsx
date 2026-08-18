import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import QRCode from "qrcode";
import { connectToDatabase } from "@/lib/mongodb";
import { Customer } from "@/models/Customer";
import * as fs from "fs";
import * as path from "path";

export const runtime = "nodejs";

function getBaseUrl(req: NextRequest): string {
  const configured = process.env.NEXT_PUBLIC_BASE_URL;
  if (configured) return configured.replace(/\/+$/, "");
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host = req.headers.get("host");
  return `${proto}://${host}`;
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

    // Load Bhima logo image
    let bhimaImageDataUrl: string | null = null;
    try {
      const bhimaImagePath = path.join(process.cwd(), "public/images/annanagar.jpeg");
      const imageBuffer = fs.readFileSync(bhimaImagePath);
      bhimaImageDataUrl = `data:image/jpeg;base64,${imageBuffer.toString("base64")}`;
    } catch (err) {
      console.error("[voucher-image] Failed to load Bhima logo:", err);
    }

    // Generate a unique QR code linking to this voucher's scan/verification page.
    let qrDataUrl: string | null = null;
    try {
      const scanUrl = `${getBaseUrl(req)}/voucher/${encodeURIComponent(customer.voucherId)}`;
      qrDataUrl = await QRCode.toDataURL(scanUrl, {
        margin: 1,
        width: 220,
        color: { dark: "#181511", light: "#ffffff" },
      });
    } catch (err) {
      console.error("[voucher-image] Failed to generate QR code:", err);
    }

    const issuedDate = new Date(customer.createdAt).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    return new ImageResponse(
      (
        <div
          style={{
            width: "1200px",
            height: "630px",
            display: "flex",
            background: "#181511",
            fontFamily: "sans-serif",
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              flex: 1,
              margin: "36px",
              border: "2px solid #b8892b",
              borderRadius: "18px",
              background: "linear-gradient(135deg, #221d16 0%, #181511 60%)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "28px",
                left: "28px",
                right: "28px",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  width: "100%",
                  maxWidth: "860px",
                  background: "#0d0d09",
                  border: "2px solid #d7ae52",
                  padding: "18px 24px 12px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    color: "#f4d36d",
                    fontSize: "26px",
                    fontWeight: 900,
                    letterSpacing: "6px",
                    textTransform: "uppercase",
                    marginBottom: "8px",
                  }}
                >
                  Bhima Gold
                </div>
                <div
                  style={{
                    display: "flex",
                    color: "#f4d36d",
                    fontSize: "62px",
                    fontWeight: 900,
                    letterSpacing: "10px",
                    textTransform: "uppercase",
                    lineHeight: "1",
                  }}
                >
                  B H I M A
                </div>
                <div
                  style={{
                    display: "flex",
                    color: "#f4d36d",
                    fontSize: "18px",
                    letterSpacing: "5px",
                    textTransform: "uppercase",
                    marginTop: "12px",
                  }}
                >
                  Gold • Diamonds • Silver • Platinum
                </div>
              </div>
            </div>

            {/* Bhima logo */}
            {bhimaImageDataUrl && (
              <img
                src={bhimaImageDataUrl}
                width={120}
                height={120}
                style={{
                  position: "absolute",
                  top: "36px",
                  left: "50%",
                  transform: "translateX(-50%)",
                }}
                alt="Bhima"
              />
            )}

            {/* Unique redemption QR code */}
            {qrDataUrl && (
              <div
                style={{
                  position: "absolute",
                  bottom: "36px",
                  right: "36px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  background: "#ffffff",
                  borderRadius: "10px",
                  padding: "10px",
                }}
              >
                <img src={qrDataUrl} width={110} height={110} alt="Redemption QR code" />
                <div
                  style={{
                    display: "flex",
                    color: "#181511",
                    fontSize: "11px",
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                    marginTop: "4px",
                  }}
                >
                  Scan to verify
                </div>
              </div>
            )}

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                padding: "64px",
                width: "100%",
                marginTop: "160px",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div
                  style={{
                    display: "flex",
                    color: "#d9ad4f",
                    fontSize: "20px",
                    letterSpacing: "6px",
                    textTransform: "uppercase",
                    marginBottom: "18px",
                  }}
                >
                  E - V O U C H E R
                </div>
                <div
                  style={{
                    display: "flex",
                    color: "#f7f2e7",
                    fontSize: "52px",
                    fontWeight: 700,
                    lineHeight: "1.15",
                    maxWidth: "760px",
                  }}
                >
                  {customer.fullName}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: "16px",
                  }}
                >
                  <span style={{ display: "flex", color: "#8a651c", fontSize: "22px" }}>
                    Voucher ID
                  </span>
                  <span
                    style={{
                      display: "flex",
                      color: "#d9ad4f",
                      fontSize: "44px",
                      fontWeight: 700,
                      letterSpacing: "1px",
                    }}
                  >
                    {customer.voucherId}
                  </span>
                </div>
                <div style={{ display: "flex", color: "#8f8879", fontSize: "20px" }}>
                  Issued {issuedDate}
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (err) {
    console.error("[voucher-image] Unhandled error:", err);
    return new Response("Failed to generate voucher image", { status: 500 });
  }
}