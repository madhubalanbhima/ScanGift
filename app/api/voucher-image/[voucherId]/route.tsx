import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import QRCode from "qrcode";
import { connectToDatabase } from "@/lib/mongodb";
import { Customer } from "@/models/Customer";

export const runtime = "nodejs";

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
    const backgroundUrl = `${baseUrl}/images/bg.png`;
    const badgeUrl = `${baseUrl}/images/101.png`;
    const figureUrl = `${baseUrl}/images/bhima-boy.png`;
    const modelUrl = `${baseUrl}/images/model.png`;
    const giftUrl = `${baseUrl}/images/gift.png`;
    const grandUrl = `${baseUrl}/images/grand.png`;
    const amountUrl = `${baseUrl}/images/5000.png`;
    const logoUrl = `${baseUrl}/images/logo.png`;

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

    return new ImageResponse(
      (
        <div
          style={{
            position: "relative",
            width: "1200px",
            height: "630px",
            overflow: "hidden",
            borderRadius: "20px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
            fontFamily: "Arial, sans-serif",
            background: "#f5f5f5",
          }}
        >
          <img
            src={backgroundUrl}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              zIndex: 1,
            }}
            alt="Bhima voucher background"
          />

          <div
            style={{
              position: "absolute",
              top: "20px",
              left: "30px",
              zIndex: 10,
            }}
          >
            <img src={badgeUrl} alt="10 Years" style={{ width: "180px", height: "auto" }} />
          </div>

          <div
            style={{
              position: "absolute",
              top: "20px",
              right: "0px",
              zIndex: 10,
            }}
          >
            <img src={figureUrl} alt="Bhima figure" style={{ width: "180px", height: "auto" }} />
          </div>

          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: "25%",
              height: "100%",
              zIndex: 5,
              display: "flex",
              alignItems: "center",
            }}
          >
            <img
              src={modelUrl}
              alt="Bhima model"
              style={{
                width: "130%",
                height: "90%",
                objectFit: "cover",
                position: "absolute",
                left: "30%",
                top: "10%",
              }}
            />
          </div>

          <div
            style={{
              position: "absolute",
              left: "25%",
              right: "20%",
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 8,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "20px",
            }}
          >
            <div
              style={{
                position: "absolute",
                bottom: "240px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <img src={giftUrl} alt="Gift" style={{ width: "260px", height: "auto" }} />
            </div>

            <div
              style={{
                width: "280px",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <img src={grandUrl} alt="Grand Opening" style={{ width: "200%", height: "auto" }} />
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              right: "30px",
              top: "78%",
              transform: "translateY(-50%)",
              zIndex: 9,
              width: "360px",
            }}
          >
            <img src={amountUrl} alt="₹5000" style={{ width: "100%", height: "auto" }} />
          </div>

          <div
            style={{
              position: "absolute",
              right: "130px",
              bottom: "40px",
              zIndex: 9,
              background: "#ffffff",
              borderRadius: "12px",
              padding: "10px",
              boxShadow: "0 5px 15px rgba(0,0,0,0.15)",
            }}
          >
            {qrDataUrl && (
              <img
                src={qrDataUrl}
                alt="Voucher QR code"
                style={{ width: "110px", height: "110px", display: "block" }}
              />
            )}
          </div>

          <div
            style={{
              position: "absolute",
              bottom: "20px",
              left: "25%",
              right: "20%",
              zIndex: 8,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <div style={{ width: "260px", display: "flex", justifyContent: "center" }}>
              <img src={logoUrl} alt="Bhima Logo" style={{ width: "100%", height: "auto" }} />
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