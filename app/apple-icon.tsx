import { ImageResponse } from "next/og";

/** Home-screen icon for iOS, which ignores SVG favicons. */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#2E3C88",
        }}
      >
        <svg width="112" height="112" viewBox="0 0 32 32">
          <path
            d="M9 9.5h10.5A2.5 2.5 0 0 1 22 12v.5H9z"
            fill="#FFFFFF"
            opacity="0.5"
          />
          <rect x="6" y="12" width="20" height="13" rx="3.5" fill="#FFFFFF" />
          <circle cx="20.75" cy="18.5" r="2.1" fill="#2E3C88" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
