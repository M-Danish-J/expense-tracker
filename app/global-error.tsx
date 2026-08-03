"use client";

import { useEffect } from "react";

/**
 * Last-resort boundary: replaces the root layout, so it ships its own <html>
 * and cannot rely on the app's fonts or styles being present.
 */
export default function GlobalError({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}) {
  useEffect(() => {
    console.error("[expensio] fatal error", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
          padding: "24px",
          textAlign: "center",
          background: "#FAFAFA",
          color: "#18181B",
          fontFamily:
            "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif",
        }}
      >
        <h1 style={{ fontSize: "24px", fontWeight: 600, margin: 0 }}>
          Something went wrong
        </h1>
        <p style={{ color: "#71717A", margin: 0, maxWidth: "46ch" }}>
          Expensio hit an unexpected error. Your data is safe.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            marginTop: "12px",
            padding: "10px 20px",
            borderRadius: "10px",
            border: "none",
            background: "#2e3c88",
            color: "#FFFFFF",
            fontSize: "14px",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
