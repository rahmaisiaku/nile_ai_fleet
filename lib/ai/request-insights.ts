export type RiskLevel = "Low" | "Medium" | "High";
export type VehicleRecommendation =
  | "Executive Sedan"
  | "Standard SUV"
  | "Mini Bus";

export type VehicleCategory = "luxury" | "non_luxury";
export type DestinationZone = "core" | "midrange" | "outskirts" | "unknown";

export type RequestInsightInput = {
  destination: string;
  destinationArea?: string;
  destinationLandmark?: string;
  passengerCount: number;
  tripCategory?: string;
  purposeDetails?: string;
  departureDate?: string;
  departureHour?: number;
  expectedReturnDate?: string;
  expectedReturnHour?: number;
};

export type RequestInsightOutput = {
  estimatedDuration: string;
  estimatedDurationMinutes: number;
  recommendedVehicle: VehicleRecommendation;
  recommendedVehicleCategory: VehicleCategory;
  riskLevel: RiskLevel;
  note: string;
};

function normalizeText(value?: string): string {
  return (value || "").trim().toLowerCase();
}

function isPeakTrafficHour(hour?: number): boolean {
  if (hour === undefined || hour === null) return false;
  return (hour >= 7 && hour <= 10) || (hour >= 16 && hour <= 19);
}

function detectDestinationZone(area?: string, landmark?: string): DestinationZone {
  const normalizedArea = normalizeText(area);
  const normalizedLandmark = normalizeText(landmark);
  const combined = `${normalizedArea} ${normalizedLandmark}`.trim();

  const coreKeywords = [
    "central area",
    "maitama",
    "asokoro",
    "garki",
    "wuse",
    "wuse ii",
    "jabi",
    "utako",
    "area 1",
    "area 3",
    "area 10",
    "zone 1",
    "zone 2",
    "zone 3",
    "zone 4",
    "zone 5",
    "zone 6",
    "national assembly",
    "federal secretariat",
    "transcorp hilton",
    "international conference centre",
    "cbn headquarters",
    "supreme court",
    "state house",
    "aso rock",
  ];

  const midrangeKeywords = [
    "gwarinpa",
    "life camp",
    "katampe",
    "wuye",
    "gudu",
    "durumi",
    "lokogoma",
    "apo",
    "dawaki",
    "jahi",
    "mpape",
    "dakibiyu",
    "games village",
    "galadimawa",
    "guzape",
    "wumba",
    "kabusa",
    "gaduwa",
    "karsana",
  ];

  const outskirtsKeywords = [
    "airport road",
    "airport",
    "lugbe",
    "kubwa",
    "nyanya",
    "karu",
    "bwari",
    "gwagwalada",
    "kuje",
    "zuba",
    "dei-dei",
    "jikwoyi",
    "pyakassa",
    "kpeyegyi",
    "ketti",
  ];

  if (coreKeywords.some((item) => combined.includes(item))) return "core";
  if (midrangeKeywords.some((item) => combined.includes(item))) return "midrange";
  if (outskirtsKeywords.some((item) => combined.includes(item))) return "outskirts";

  return "unknown";
}

function formatDuration(durationMinutes: number): string {
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function estimateRequestedWindowHours(
  departureDate?: string,
  departureHour?: number,
  expectedReturnDate?: string,
  expectedReturnHour?: number
): number | null {
  if (
    !departureDate ||
    departureHour === undefined ||
    !expectedReturnDate ||
    expectedReturnHour === undefined
  ) {
    return null;
  }

  const start = new Date(`${departureDate}T${String(departureHour).padStart(2, "0")}:00:00`);
  const end = new Date(`${expectedReturnDate}T${String(expectedReturnHour).padStart(2, "0")}:00:00`);

  const diffMs = end.getTime() - start.getTime();
  if (Number.isNaN(diffMs) || diffMs <= 0) return null;

  return diffMs / (1000 * 60 * 60);
}

export function getRequestInsights({
  destination,
  destinationArea,
  destinationLandmark,
  passengerCount,
  tripCategory,
  purposeDetails,
  departureDate,
  departureHour,
  expectedReturnDate,
  expectedReturnHour,
}: RequestInsightInput): RequestInsightOutput {
  const normalizedCategory = normalizeText(tripCategory);
  const normalizedDetails = normalizeText(purposeDetails);
  const normalizedLandmark = normalizeText(destinationLandmark);
  const zone = detectDestinationZone(destinationArea, destinationLandmark);

  let durationMinutes = 50;
  let riskScore = 0;

  switch (zone) {
    case "core":
      durationMinutes = 45;
      break;
    case "midrange":
      durationMinutes = 70;
      riskScore += 1;
      break;
    case "outskirts":
      durationMinutes = 100;
      riskScore += 2;
      break;
    default:
      durationMinutes = 60;
      riskScore += 1;
      break;
  }

  if (passengerCount >= 8) {
    durationMinutes += 20;
    riskScore += 2;
  } else if (passengerCount >= 5) {
    durationMinutes += 12;
    riskScore += 1;
  } else if (passengerCount >= 3) {
    durationMinutes += 6;
  }

  if (normalizedCategory.includes("airport")) {
    durationMinutes += 15;
    riskScore += 1;
  }

  if (
    normalizedCategory.includes("logistics") ||
    normalizedCategory.includes("delivery")
  ) {
    durationMinutes += 12;
    riskScore += 1;
  }

  if (
    normalizedCategory.includes("site visit") ||
    normalizedCategory.includes("field inspection")
  ) {
    durationMinutes += 15;
    riskScore += 1;
  }

  if (
    normalizedCategory.includes("protocol") ||
    normalizedCategory.includes("emergency")
  ) {
    durationMinutes += 10;
    riskScore += 2;
  }

  if (
    normalizedDetails.includes("airport") ||
    normalizedDetails.includes("pickup") ||
    normalizedDetails.includes("drop-off") ||
    normalizedDetails.includes("drop off")
  ) {
    durationMinutes += 10;
    riskScore += 1;
  }

  if (
    normalizedDetails.includes("inspection") ||
    normalizedDetails.includes("site") ||
    normalizedDetails.includes("field")
  ) {
    durationMinutes += 10;
    riskScore += 1;
  }

  if (
    normalizedDetails.includes("document") ||
    normalizedDetails.includes("equipment") ||
    normalizedDetails.includes("delivery")
  ) {
    durationMinutes += 8;
    riskScore += 1;
  }

  if (isPeakTrafficHour(departureHour)) {
    durationMinutes += 20;
    riskScore += 1;
  }

  if (normalizedLandmark.includes("airport")) {
    durationMinutes += 10;
    riskScore += 1;
  }

  if (
    normalizedLandmark.includes("national assembly") ||
    normalizedLandmark.includes("federal secretariat") ||
    normalizedLandmark.includes("ministry")
  ) {
    durationMinutes += 5;
  }

  const requestedWindowHours = estimateRequestedWindowHours(
    departureDate,
    departureHour,
    expectedReturnDate,
    expectedReturnHour
  );

  if (requestedWindowHours !== null) {
    if (requestedWindowHours >= 10) {
      riskScore += 2;
    } else if (requestedWindowHours >= 6) {
      riskScore += 1;
    }
  }

  let recommendedVehicle: VehicleRecommendation = "Executive Sedan";
  let recommendedVehicleCategory: VehicleCategory = "luxury";

  if (passengerCount >= 7) {
    recommendedVehicle = "Mini Bus";
    recommendedVehicleCategory = "non_luxury";
  } else if (
    passengerCount >= 4 ||
    zone === "outskirts" ||
    normalizedCategory.includes("logistics")
  ) {
    recommendedVehicle = "Standard SUV";
    recommendedVehicleCategory = "non_luxury";
  }

  let riskLevel: RiskLevel = "Low";
  if (riskScore >= 5) {
    riskLevel = "High";
  } else if (riskScore >= 3) {
    riskLevel = "Medium";
  }

  const zoneLabel =
    zone === "core"
      ? "core Abuja route"
      : zone === "midrange"
      ? "mid-range Abuja route"
      : zone === "outskirts"
      ? "outer FCT route"
      : "unclassified route";

  const windowNote =
    requestedWindowHours !== null
      ? ` Requested trip window is about ${requestedWindowHours.toFixed(1)} hour(s).`
      : "";

  const note = `Recommendation is based on ${zoneLabel}, passenger load, trip category, purpose details, departure timing, and destination context for "${destination || "the selected route"}".${windowNote}`;

  return {
    estimatedDuration: formatDuration(durationMinutes),
    estimatedDurationMinutes: durationMinutes,
    recommendedVehicle,
    recommendedVehicleCategory,
    riskLevel,
    note,
  };
}