import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Customer } from "@/models/Customer";
import * as fs from "fs";
import * as path from "path";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: { voucherId: string } }
) {
  const rawVoucherId = decodeURIComponent(params.voucherId).trim();
  const normalizedVoucherId = rawVoucherId.replace(/^#/, "");
  const candidateIds = Array.from(
    new Set([rawVoucherId, normalizedVoucherId, `#${normalizedVoucherId}`])
  );

  await connectToDatabase();
  const customer = await Customer.findOne({ voucherId: { $in: candidateIds } }).lean();

  if (!customer) {
    return new Response("Voucher not found", { status: 404 });
  }

  // Load Bhima logo image
  const bhimaImagePath = path.join(process.cwd(), "public/images/ANNA-NAGAR.jpeg");
  const imageBuffer = fs.readFileSync(bhimaImagePath);
  const imageBase64 = imageBuffer.toString("base64");
  const bhimaImageDataUrl = `data:image/jpeg;base64,${imageBase64}`;

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
              inset: "28px 28px auto 28px",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: "860px",
                background: "#0d0d09",
                border: "2px solid #d7ae52",
                padding: "18px 24px 12px",
                textAlign: "center",
                boxShadow: "0 0 0 3px rgba(215,174,82,0.18)",
              }}
            >
              <div
                style={{
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
                  color: "#f4d36d",
                  fontSize: "62px",
                  fontWeight: 900,
                  letterSpacing: "10px",
                  textTransform: "uppercase",
                  lineHeight: 1.0,
                }}
              >
                B H I M A
              </div>
              <div
                style={{
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
          <img
            src={bhimaImageDataUrl}
            style={{
              position: "absolute",
              top: "36px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "120px",
              height: "120px",
            }}
            alt="Bhima"
          />

          {/* corner ornament */}
          <div
            style={{
              position: "absolute",
              top: "28px",
              right: "36px",
              display: "flex",
              width: "96px",
              height: "96px",
              borderRadius: "999px",
              border: "3px solid #d9ad4f",
              alignItems: "center",
              justifyContent: "center",
              color: "#d9ad4f",
              fontSize: "22px",
              fontWeight: 700,
              letterSpacing: "2px",
              transform: "rotate(8deg)",
            }}
          >
            eGOLD
          </div>

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
                  color: "#f7f2e7",
                  fontSize: "52px",
                  fontWeight: 700,
                  lineHeight: 1.15,
                  maxWidth: "760px",
                  display: "flex",
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
                <span style={{ color: "#8a651c", fontSize: "22px" }}>Voucher ID</span>
                <span
                  style={{
                    color: "#d9ad4f",
                    fontSize: "44px",
                    fontWeight: 700,
                    letterSpacing: "1px",
                  }}
                >
                  {customer.voucherId}
                </span>
              </div>
              <div style={{ color: "#8f8879", fontSize: "20px", display: "flex" }}>
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
}
