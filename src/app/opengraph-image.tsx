import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "SatuPintu - Satu Nomor untuk Semua Keluhan Kota";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px",
          position: "relative",
        }}
      >
        {/* Grid pattern overlay */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage:
              "linear-gradient(to right, rgba(79, 79, 79, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(79, 79, 79, 0.1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Glow effect */}
        <div
          style={{
            position: "absolute",
            top: "-20%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "600px",
            height: "600px",
            background: "radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)",
            borderRadius: "50%",
          }}
        />

        {/* Logo placeholder - S */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "120px",
            height: "120px",
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            borderRadius: "24px",
            marginBottom: "40px",
            fontSize: "64px",
            fontWeight: "bold",
            color: "white",
          }}
        >
          S
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: "72px",
            fontWeight: "bold",
            color: "white",
            textAlign: "center",
            marginBottom: "16px",
            lineHeight: 1.1,
          }}
        >
          SatuPintu
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: "32px",
            color: "rgba(255, 255, 255, 0.7)",
            textAlign: "center",
            marginBottom: "40px",
          }}
        >
          Satu Nomor untuk Semua Keluhan Kota
        </div>

        {/* Features badges */}
        <div
          style={{
            display: "flex",
            gap: "16px",
          }}
        >
          {["AI-Powered", "24/7 Aktif", "Real-time Tracking"].map((feature) => (
            <div
              key={feature}
              style={{
                padding: "12px 24px",
                background: "rgba(255, 255, 255, 0.1)",
                borderRadius: "9999px",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                color: "rgba(255, 255, 255, 0.9)",
                fontSize: "18px",
              }}
            >
              {feature}
            </div>
          ))}
        </div>

        {/* Bottom branding */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "rgba(255, 255, 255, 0.5)",
            fontSize: "18px",
          }}
        >
          <span>satu-pintu.vercel.app</span>
          <span style={{ margin: "0 8px" }}>•</span>
          <span>SIAGA Teams</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
