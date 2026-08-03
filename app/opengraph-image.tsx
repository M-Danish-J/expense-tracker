import { ImageResponse } from "next/og";

/**
 * The social share card, generated at build time rather than shipped as a
 * binary — so it can never drift from the brand the way the starter's image
 * did. Next reuses this for `twitter:image` when no twitter-image exists.
 *
 * ImageResponse supports only a subset of CSS (flexbox, no grid), and any
 * element with more than one child needs an explicit `display: flex`.
 */
export const alt =
  "Expensio — take control of your money, one expense at a time";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: "linear-gradient(160deg, #19297C 0%, #2E3C88 55%, #435094 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 72,
              height: 72,
              borderRadius: 18,
              background: "#FFFFFF",
            }}
          >
            <svg width="40" height="40" viewBox="0 0 32 32">
              <path
                d="M9 9.5h10.5A2.5 2.5 0 0 1 22 12v.5H9z"
                fill="#2E3C88"
                opacity="0.5"
              />
              <rect x="6" y="12" width="20" height="13" rx="3.5" fill="#2E3C88" />
              <circle cx="20.75" cy="18.5" r="2.1" fill="#FFFFFF" />
            </svg>
          </div>
          <div style={{ fontSize: 44, fontWeight: 700, color: "#FFFFFF" }}>
            Expensio
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div
            style={{
              fontSize: 68,
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: -1.5,
              color: "#FFFFFF",
              maxWidth: 880,
            }}
          >
            Take control of your money, one expense at a time.
          </div>
          <div
            style={{
              fontSize: 30,
              lineHeight: 1.4,
              color: "rgba(255,255,255,0.72)",
              maxWidth: 820,
            }}
          >
            Track expenses, manage accounts, and see your full financial picture
            — in one simple place.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
          {[
            "Expenses & income",
            "Transfers done right",
            "Private by default",
          ].map((label) => (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                fontSize: 24,
                color: "rgba(255,255,255,0.6)",
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.6)",
                }}
              />
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
