"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { SectionHeader } from "@/components/shared/section-header";
import { FormField } from "@/components/forms/form-field";
import { AIInsightsCard } from "@/components/ai/ai-insights-card";
import {
  createTransportRequest,
  type RequestFormState,
} from "@/app/actions/requests";
import { getRequestInsights } from "@/lib/ai/request-insights";

type UnitOption = {
  id: string;
  name: string;
};

type StaffRequestWorkspaceProps = {
  units: UnitOption[];
};

const initialState: RequestFormState = {};

export function StaffRequestWorkspace({
  units,
}: StaffRequestWorkspaceProps) {
  const [state, formAction, pending] = useActionState(
    createTransportRequest,
    initialState
  );

  // Local state is used only for live AI preview.
  const [destination, setDestination] = useState("");
  const [passengerCount, setPassengerCount] = useState(1);
  const [tripType, setTripType] = useState("");

  const insights = useMemo(() => {
    return getRequestInsights({
      destination,
      passengerCount,
    });
  }, [destination, passengerCount, tripType]);

  useEffect(() => {
    if (state?.success) {
      toast.success(state.success);
      setDestination("");
      setPassengerCount(1);
      setTripType("");
    }

    if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <div className="grid gap-6 xl:grid-cols-[1.45fr_0.85fr]">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <SectionHeader
          title="Transport Request Form"
          description="Provide complete and accurate trip information for review and allocation."
        />

        <form action={formAction} className="mt-6 space-y-6">
          <div className="grid gap-5 md:grid-cols-2">
            <FormField
              label="Destination"
              htmlFor="destination"
              hint="Enter the primary destination for the trip."
            >
              <input
                id="destination"
                name="destination"
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g. Central Abuja"
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </FormField>

            <FormField
              label="Purpose of Trip"
              htmlFor="purpose"
              hint="State the official reason for the request."
            >
              <input
                id="purpose"
                name="purpose"
                type="text"
                placeholder="e.g. Official meeting"
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </FormField>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <FormField label="Departure Date" htmlFor="departureDate">
              <input
                id="departureDate"
                name="departureDate"
                type="date"
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </FormField>

            <FormField label="Departure Time" htmlFor="departureTime">
              <input
                id="departureTime"
                name="departureTime"
                type="time"
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </FormField>

            <FormField label="Expected Return Date" htmlFor="returnDate">
              <input
                id="returnDate"
                name="returnDate"
                type="date"
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </FormField>

            <FormField
              label="Passenger Count"
              htmlFor="passengerCount"
              hint="This helps determine vehicle suitability."
            >
              <input
                id="passengerCount"
                name="passengerCount"
                type="number"
                min={1}
                value={passengerCount}
                onChange={(e) => setPassengerCount(Number(e.target.value) || 1)}
                placeholder="e.g. 4"
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </FormField>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <FormField label="Requesting Unit" htmlFor="unit">
              <select
                id="unit"
                name="unit"
                defaultValue=""
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                <option value="">Select unit</option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField
              label="Trip Type"
              htmlFor="tripType"
              hint="Used by the AI recommendation engine."
            >
              <select
                id="tripType"
                name="tripType"
                value={tripType}
                onChange={(e) => setTripType(e.target.value)}
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                <option value="">Select trip type</option>
                <option value="official">Official Duty</option>
                <option value="meeting">Meeting</option>
                <option value="protocol">Protocol</option>
                <option value="logistics">Logistics</option>
              </select>
            </FormField>
          </div>

          <FormField
            label="Additional Notes"
            htmlFor="notes"
            hint="Optional extra instructions for the transport team."
          >
            <textarea
              id="notes"
              name="notes"
              rows={5}
              placeholder="Provide any useful trip notes here..."
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            />
          </FormField>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={pending}
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-blue-700 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {pending ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </section>

      <div className="space-y-6">
        <AIInsightsCard
          estimatedDuration={insights.estimatedDuration}
          recommendedVehicle={insights.recommendedVehicle}
          riskLevel={insights.riskLevel}
          note={insights.note}
        />

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <SectionHeader
            title="Submission Guide"
            description="A few rules to improve approval speed and allocation accuracy."
          />

          <div className="mt-5 space-y-3">
            {[
              "Use the exact destination to improve ETA estimation.",
              "Passenger count should reflect the full expected occupancy.",
              "Assigned and pool vehicles are treated differently during allocation.",
              "Incomplete requests may be delayed or rejected.",
            ].map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3"
              >
                <div className="mt-1 h-2 w-2 rounded-full bg-blue-600" />
                <p className="text-sm leading-6 text-slate-600">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}