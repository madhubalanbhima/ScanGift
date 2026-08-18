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

    let branchImageDataUrl: string | null = null;
    try {
      const branchImagePath = path.join(process.cwd(), "public/images/annanagar.jpeg");
      const imageBuffer = fs.readFileSync(branchImagePath);
      branchImageDataUrl = `data:image/jpeg;base64,${imageBuffer.toString("base64")}`;
    } catch (err) {
      console.error("[voucher-image] Failed to load branch image:", err);
    }

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
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              margin: "36px",
              border: "2px solid #b8892b",
              borderRadius: "18px",
              background: "linear-gradient(135deg, #221d16 0%, #181511 60%)",
              overflow: "hidden",
            }}
          >
            {/* Letterhead banner */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "32px 48px 0 48px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  width: "100%",
                  background: "#0d0d09",
                  border: "2px solid #d7ae52",
                  borderRadius: "6px",
                  padding: "16px 24px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    color: "#f4d36d",
                    fontSize: "20px",
                    fontWeight: 900,
                    letterSpacing: "6px",
                    textTransform: "uppercase",
                    marginBottom: "6px",
                  }}
                >
                  Bhima Gold
                </div>
                <div
                  style={{
                    display: "flex",
                    color: "#f4d36d",
                    fontSize: "46px",
                    fontWeight: 900,
                    letterSpacing: "8px",
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
                    fontSize: "15px",
                    letterSpacing: "4px",
                    textTransform: "uppercase",
                    marginTop: "8px",
                  }}
                >
                  Gold • Diamonds • Silver • Platinum
                </div>
              </div>
            </div>

            {/* Body: voucher details (left) + branch photo + QR (right) */}
            <div
              style={{
                display: "flex",
                flex: 1,
                padding: "36px 48px 40px 48px",
                gap: "40px",
              }}
            >
              {/* Left column */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  flex: 1.3,
                }}
              >
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <div
                    style={{
                      display: "flex",
                      color: "#d9ad4f",
                      fontSize: "18px",
                      letterSpacing: "6px",
                      textTransform: "uppercase",
                      marginBottom: "16px",
                    }}
                  >
                    E - V O U C H E R
                  </div>
                  <div
                    style={{
                      display: "flex",
                      color: "#f7f2e7",
                      fontSize: "48px",
                      fontWeight: 700,
                      lineHeight: "1.15",
                      maxWidth: "480px",
                    }}
                  >
                    {customer.fullName}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "14px" }}>
                    <span style={{ display: "flex", color: "#8a651c", fontSize: "20px" }}>
                      Voucher ID
                    </span>
                    <span
                      style={{
                        display: "flex",
                        color: "#d9ad4f",
                        fontSize: "40px",
                        fontWeight: 700,
                        letterSpacing: "1px",
                      }}
                    >
                      {customer.voucherId}
                    </span>
                  </div>
                  <div style={{ display: "flex", color: "#8f8879", fontSize: "18px" }}>
                    Issued {issuedDate}
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div
                style={{
                  display: "flex",
                  width: "2px",
                  background: "#3a3226",
                }}
              />

              {/* Right column: branch photo + QR */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "20px",
                  width: "280px",
                }}
              >
                {branchImageDataUrl && (
                  <img
                    src={branchImageDataUrl}
                    width={260}
                    height={150}
                    style={{
                      borderRadius: "10px",
                      border: "2px solid #8a651c",
                      objectFit: "cover",
                    }}
                    alt="Bhima showroom"
                  />
                )}

                {qrDataUrl && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      background: "#ffffff",
                      borderRadius: "10px",
                      padding: "10px",
                    }}
                  >
                    <img
                      src={qrDataUrl}
                      width={110}
                      height={110}
                      alt="Redemption QR code"
                    />
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