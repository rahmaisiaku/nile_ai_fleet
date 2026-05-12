"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import {
  allocateTransportRequest,
  type AllocationFormState,
} from "@/app/actions/allocations";

type VehicleOption = {
  id: string;
  label: string;
};

type DriverOption = {
  id: string;
  label: string;
};

type AllocationFormProps = {
  requestId: string;
  vehicles: VehicleOption[];
  drivers: DriverOption[];
};

const initialState: AllocationFormState = {};

export function AllocationForm({
  requestId,
  vehicles,
  drivers,
}: AllocationFormProps) {
  const [state, formAction, pending] = useActionState(
    allocateTransportRequest,
    initialState
  );

  useEffect(() => {
    if (state?.success) {
      toast.success(state.success);
    }

    if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form action={formAction} className="grid min-w-[260px] gap-3">
      <input type="hidden" name="requestId" value={requestId} />

      <select
        name="vehicleId"
        defaultValue=""
        className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
      >
        <option value="">Select vehicle</option>
        {vehicles.map((vehicle) => (
          <option key={vehicle.id} value={vehicle.id}>
            {vehicle.label}
          </option>
        ))}
      </select>

      <select
        name="driverId"
        defaultValue=""
        className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
      >
        <option value="">Select driver</option>
        {drivers.map((driver) => (
          <option key={driver.id} value={driver.id}>
            {driver.label}
          </option>
        ))}
      </select>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-11 items-center justify-center rounded-2xl bg-blue-700 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? "Allocating..." : "Confirm Allocation"}
      </button>
    </form>
  );
}