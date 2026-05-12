export type VehicleRelation = {
  id: string;
  plate_no: string;
  make: string | null;
  model: string | null;
  type: string;
  category: string;
} | {
  id: string;
  plate_no: string;
  make: string | null;
  model: string | null;
  type: string;
  category: string;
}[] | null;

export type DriverRelation = {
  id: string;
  profile_id: string;
} | {
  id: string;
  profile_id: string;
}[] | null;

export function getVehicleInfo(vehicle: VehicleRelation): {
  id: string;
  label: string;
  type: string;
  category: string;
} {
  const resolved = Array.isArray(vehicle) ? vehicle[0] : vehicle;

  return {
    id: resolved?.id ?? "",
    label: resolved
      ? `${resolved.make ?? ""} ${resolved.model ?? ""} (${resolved.plate_no})`.trim()
      : "No vehicle assigned",
    type: resolved?.type ?? "unknown",
    category: resolved?.category ?? "unknown",
  };
}

export function getDriverId(driver: DriverRelation): string {
  const resolved = Array.isArray(driver) ? driver[0] : driver;
  return resolved?.id ?? "";
}