import type { ReactNode } from "react";

/**
 * This route group layout exists so all dashboard pages
 * can live under one shared app segment cleanly.
 */
export default function DashboardGroupLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}