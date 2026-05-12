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
import {
  COMMON_FCT_LANDMARKS,
  FCT_DESTINATION_AREAS,
  TRIP_CATEGORIES,
} from "@/lib/data/fct-trip-data";

type UnitOption = {
  id: string;
  name: string;
};

type StaffRequestWorkspaceProps = {
  units: UnitOption[];
};

const initialState: RequestFormState = {};

function filterSuggestions(items: readonly string[], value: string, limit = 8): string[] {
  const query = value.trim().toLowerCase();

  if (!query) {
    return [...items].slice(0, limit);
  }

  return items
    .filter((item) => item.toLowerCase().includes(query))
    .slice(0, limit);
}

function getHour(value: string): number | undefined {
  if (!value) return undefined;
  const hour = Number(value.split(":")[0]);
  return Number.isNaN(hour) ? undefined : hour;
}

function calculateCompleteness(input: {
  destinationArea: string;
  destinationLandmark: string;
  tripCategory: string;
  purposeDetails: string;
  departureDate: string;
  departureTime: string;
  returnDate: string;
  returnTime: string;
  passengerCount: number;
  unit: string;
  notes: string;
}) {
  const requiredChecks = [
    !!input.destinationArea.trim(),
    !!input.destinationLandmark.trim(),
    !!input.tripCategory.trim(),
    !!input.purposeDetails.trim(),
    !!input.departureDate.trim(),
    !!input.departureTime.trim(),
    !!input.returnDate.trim(),
    !!input.returnTime.trim(),
    input.passengerCount >= 1,
  ];

  const optionalChecks = [
    !!input.unit.trim(),
    !!input.notes.trim(),
  ];

  const requiredDone = requiredChecks.filter(Boolean).length;
  const optionalDone = optionalChecks.filter(Boolean).length;
  const totalDone = requiredDone + optionalDone;
  const totalFields = requiredChecks.length + optionalChecks.length;
  const percent = Math.round((totalDone / totalFields) * 100);

  let label = "Incomplete";
  if (percent >= 100) {
    label = "Complete";
  } else if (percent >= 80) {
    label = "Strong";
  } else if (percent >= 60) {
    label = "Fair";
  }

  return {
    percent,
    label,
    isSubmittable: requiredChecks.every(Boolean),
  };
}

export function StaffRequestWorkspace({
  units,
}: StaffRequestWorkspaceProps) {
  const [state, formAction, pending] = useActionState(
    createTransportRequest,
    initialState
  );

  const [destinationArea, setDestinationArea] = useState("");
  const [destinationLandmark, setDestinationLandmark] = useState("");
  const [tripCategory, setTripCategory] = useState("");
  const [purposeDetails, setPurposeDetails] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [returnTime, setReturnTime] = useState("");
  const [passengerCount, setPassengerCount] = useState(1);
  const [unit, setUnit] = useState("");
  const [notes, setNotes] = useState("");

  const [showAreaSuggestions, setShowAreaSuggestions] = useState(false);
  const [showLandmarkSuggestions, setShowLandmarkSuggestions] = useState(false);

  const areaSuggestions = useMemo(() => {
    return filterSuggestions(FCT_DESTINATION_AREAS, destinationArea);
  }, [destinationArea]);

  const landmarkSuggestions = useMemo(() => {
    return filterSuggestions(COMMON_FCT_LANDMARKS, destinationLandmark);
  }, [destinationLandmark]);

  const departureHour = useMemo(() => getHour(departureTime), [departureTime]);
  const returnHour = useMemo(() => getHour(returnTime), [returnTime]);

  const fullDestination = useMemo(() => {
    return [destinationArea, destinationLandmark].filter(Boolean).join(", ");
  }, [destinationArea, destinationLandmark]);

  const completeness = useMemo(() => {
    return calculateCompleteness({
      destinationArea,
      destinationLandmark,
      tripCategory,
      purposeDetails,
      departureDate,
      departureTime,
      returnDate,
      returnTime,
      passengerCount,
      unit,
      notes,
    });
  }, [
    destinationArea,
    destinationLandmark,
    tripCategory,
    purposeDetails,
    departureDate,
    departureTime,
    returnDate,
    returnTime,
    passengerCount,
    unit,
    notes,
  ]);

  const insights = useMemo(() => {
    return getRequestInsights({
      destination: fullDestination,
      destinationArea,
      destinationLandmark,
      passengerCount,
      tripCategory,
      purposeDetails,
      departureDate,
      departureHour,
      expectedReturnDate: returnDate,
      expectedReturnHour: returnHour,
    });
  }, [
    fullDestination,
    destinationArea,
    destinationLandmark,
    passengerCount,
    tripCategory,
    purposeDetails,
    departureDate,
    departureHour,
    returnDate,
    returnHour,
  ]);

  useEffect(() => {
    if (state?.success) {
      toast.success(state.success);

      setDestinationArea("");
      setDestinationLandmark("");
      setTripCategory("");
      setPurposeDetails("");
      setDepartureDate("");
      setDepartureTime("");
      setReturnDate("");
      setReturnTime("");
      setPassengerCount(1);
      setUnit("");
      setNotes("");
      setShowAreaSuggestions(false);
      setShowLandmarkSuggestions(false);
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
          description="Provide clear and structured trip information for review, approval, and intelligent vehicle recommendation."
        />

        <form action={formAction} className="mt-6 space-y-6">
          <div className="grid gap-5 md:grid-cols-2">
            <FormField
              label="Destination Area"
              htmlFor="destinationArea"
              hint="Start typing an Abuja/FCT area."
            >
              <div className="relative">
                <input
                  id="destinationArea"
                  name="destinationArea"
                  type="text"
                  value={destinationArea}
                  onChange={(e) => {
                    setDestinationArea(e.target.value);
                    setShowAreaSuggestions(true);
                  }}
                  onFocus={() => setShowAreaSuggestions(true)}
                  onBlur={() => {
                    window.setTimeout(() => setShowAreaSuggestions(false), 150);
                  }}
                  placeholder="e.g. Wuse, Maitama, Garki"
                  autoComplete="off"
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />

                {showAreaSuggestions && areaSuggestions.length > 0 && (
                  <div className="absolute z-20 mt-2 max-h-64 w-full overflow-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                    {areaSuggestions.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setDestinationArea(item);
                          setShowAreaSuggestions(false);
                        }}
                        className="flex w-full items-center rounded-xl px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </FormField>

            <FormField
              label="Destination Landmark / Office"
              htmlFor="destinationLandmark"
              hint="Enter the specific office, building, or known place."
            >
              <div className="relative">
                <input
                  id="destinationLandmark"
                  name="destinationLandmark"
                  type="text"
                  value={destinationLandmark}
                  onChange={(e) => {
                    setDestinationLandmark(e.target.value);
                    setShowLandmarkSuggestions(true);
                  }}
                  onFocus={() => setShowLandmarkSuggestions(true)}
                  onBlur={() => {
                    window.setTimeout(() => setShowLandmarkSuggestions(false), 150);
                  }}
                  placeholder="e.g. Federal Secretariat, NUC Office"
                  autoComplete="off"
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />

                {showLandmarkSuggestions && landmarkSuggestions.length > 0 && (
                  <div className="absolute z-20 mt-2 max-h-64 w-full overflow-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                    {landmarkSuggestions.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setDestinationLandmark(item);
                          setShowLandmarkSuggestions(false);
                        }}
                        className="flex w-full items-center rounded-xl px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </FormField>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <FormField
              label="Trip Category"
              htmlFor="tripCategory"
              hint="Choose the main reason class for the movement."
            >
              <select
                id="tripCategory"
                name="tripCategory"
                value={tripCategory}
                onChange={(e) => setTripCategory(e.target.value)}
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                <option value="">Select trip category</option>
                {TRIP_CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField
              label="Passenger Count"
              htmlFor="passengerCount"
              hint="Used for vehicle sizing and operational risk."
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

          <FormField
            label="Purpose Details"
            htmlFor="purposeDetails"
            hint="State the exact reason for the trip."
          >
            <input
              id="purposeDetails"
              name="purposeDetails"
              type="text"
              value={purposeDetails}
              onChange={(e) => setPurposeDetails(e.target.value)}
              placeholder="e.g. Meeting with NUC officials on accreditation"
              className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            />
          </FormField>

          <div className="grid gap-5 md:grid-cols-2">
            <FormField label="Departure Date" htmlFor="departureDate">
              <input
                id="departureDate"
                name="departureDate"
                type="date"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </FormField>

            <FormField
              label="Departure Time"
              htmlFor="departureTime"
              hint="Traffic periods affect duration and risk."
            >
              <input
                id="departureTime"
                name="departureTime"
                type="time"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </FormField>

            <FormField label="Expected Return Date" htmlFor="returnDate">
              <input
                id="returnDate"
                name="returnDate"
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </FormField>

            <FormField
              label="Expected Return Time"
              htmlFor="returnTime"
              hint="Needed for lateness and allocation monitoring."
            >
              <input
                id="returnTime"
                name="returnTime"
                type="time"
                value={returnTime}
                onChange={(e) => setReturnTime(e.target.value)}
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </FormField>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <FormField label="Requesting Unit" htmlFor="unit">
              <select
                id="unit"
                name="unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                <option value="">Select unit</option>
                {units.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField
              label="Data Completeness"
              htmlFor="dataCompleteness"
              hint="Shows how much useful request data has been provided."
            >
              <input
                id="dataCompleteness"
                type="text"
                value={`${completeness.percent}% • ${completeness.label}`}
                readOnly
                className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none"
              />
            </FormField>
          </div>

          <FormField
            label="Additional Notes"
            htmlFor="notes"
            hint="Optional instructions for transport officers."
          >
            <textarea
              id="notes"
              name="notes"
              rows={5}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Provide any useful trip notes here..."
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            />
          </FormField>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={pending || !completeness.isSubmittable}
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
            description="These rules improve recommendation accuracy and approval quality."
          />

          <div className="mt-5 space-y-3">
            {[
              "Use a valid Abuja/FCT area and a clear destination landmark or office.",
              "Expected return date and time are required for availability checks and lateness monitoring.",
              "Trip category and purpose details directly affect recommendation quality.",
              "Passenger count helps the system recommend the right vehicle class.",
              "The form cannot be submitted until all required fields are complete.",
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