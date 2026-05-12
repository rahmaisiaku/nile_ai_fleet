"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  endTripAction,
  startTripAction,
  type TripActionState,
} from "@/app/actions/trips";

type DriverTripActionFormProps = {
  tripId: string;
  hasStarted: boolean;
  hasEnded: boolean;
};

const initialState: TripActionState = {};

export function DriverTripActionForm({
  tripId,
  hasStarted,
  hasEnded,
}: DriverTripActionFormProps) {
  const router = useRouter();

  const [startState, startFormAction, startPending] = useActionState(
    startTripAction,
    initialState
  );

  const [endState, endFormAction, endPending] = useActionState(
    endTripAction,
    initialState
  );

  useEffect(() => {
    if (startState?.success) {
      toast.success(startState.success);
      router.refresh();
    }
    if (startState?.error) {
      toast.error(startState.error);
    }
  }, [startState, router]);

  useEffect(() => {
    if (endState?.success) {
      toast.success(endState.success);
      router.push("/driver/trips");
      router.refresh();
    }
    if (endState?.error) {
      toast.error(endState.error);
    }
  }, [endState, router]);

  return (
    <div className="space-y-5">
      <form action={startFormAction}>
        <input type="hidden" name="tripId" value={tripId} />

        <button
          type="submit"
          disabled={startPending || hasStarted || hasEnded}
          className="inline-flex h-11 items-center justify-center rounded-2xl bg-blue-700 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {startPending ? "Starting..." : "Start Trip"}
        </button>
      </form>

      <form action={endFormAction} className="space-y-4">
        <input type="hidden" name="tripId" value={tripId} />

        <div className="space-y-2">
          <label
            htmlFor="driverNote"
            className="text-sm font-medium text-slate-700"
          >
            Driver Note
          </label>
          <textarea
            id="driverNote"
            name="driverNote"
            rows={5}
            placeholder="Record any delay, issue, or useful completion note..."
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
          />
        </div>

        <button
          type="submit"
          disabled={endPending || !hasStarted || hasEnded}
          className="inline-flex h-11 items-center justify-center rounded-2xl bg-emerald-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {endPending ? "Ending..." : "End Trip"}
        </button>
      </form>
    </div>
  );
}