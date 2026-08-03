import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  cacheComponents: true,
  turbopack: {
    // There is a stray package-lock.json in the parent directory, so Next
    // otherwise infers the workspace root as ~/Projects/Other and resolves
    // output tracing from there. Pin it to this project.
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
