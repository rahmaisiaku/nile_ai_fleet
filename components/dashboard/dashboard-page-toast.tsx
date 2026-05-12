"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { toast } from "sonner";

export function DashboardPageToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const hasShown = useRef(false);

  useEffect(() => {
    if (searchParams.get("login") === "success" && !hasShown.current) {
      hasShown.current = true;
      toast.success("Welcome back.");
      router.replace(pathname);
    }
  }, [searchParams, router, pathname]);

  return null;
}
