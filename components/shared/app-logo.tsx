import { Car } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

type AppLogoProps = {
  dark?: boolean;
  href?: string;
};

export function AppLogo({ dark = false, href = "/" }: AppLogoProps) {
  return (
    <Link href={href} className="flex items-center gap-3">
      <div
        className={clsx(
          "flex h-11 w-11 items-center justify-center rounded-2xl shadow-sm",
          dark ? "bg-blue-600 text-white" : "bg-blue-700 text-white"
        )}
      >
        <Car className="h-5 w-5" />
      </div>

      <div>
        <p
          className={clsx(
            "text-sm font-semibold tracking-tight",
            dark ? "text-white" : "text-slate-900"
          )}
        >
          Nile Fleet AI
        </p>
        <p
          className={clsx(
            "text-xs",
            dark ? "text-slate-400" : "text-slate-500"
          )}
        >
          Intelligent Transport Operations Platform
        </p>
      </div>
    </Link>
  );
}