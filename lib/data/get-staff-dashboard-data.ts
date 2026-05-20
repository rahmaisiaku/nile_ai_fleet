import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data/get-current-profile";

export type StaffDashboardData = {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  aiSuggestionsUsed: number;
  recentRequests: Array<{
    id: string;
    destination: string;
    createdAt: string;
    status: "Pending" | "Approved" | "Rejected" | "Allocated" | "In Trip" | "Completed";
    assignedVehicle: string | null;
    assignedDriver: string | null;
    driverEmail: string | null;
    driverPhone: string | null;
  }>;
};

type RequestRow = {
  id: string;
  destination: string;
  status: string;
  created_at: string;
};

type AllocationRow = {
  request_id: string;
  vehicle_id: string | null;
  driver_id: string | null;
};

type VehicleRow = {
  id: string;
  plate_number: string | null;
  make: string | null;
  model: string | null;
};

type DriverRow = {
  id: string;
  profile_id: string | null;
  phone: string | null;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
};

function mapStatus(
  status: string
): "Pending" | "Approved" | "Rejected" | "Allocated" | "In Trip" | "Completed" {
  switch (status) {
    case "pending":
      return "Pending";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    case "allocated":
      return "Allocated";
    case "in_trip":
      return "In Trip";
    case "completed":
      return "Completed";
    default:
      return "Pending";
  }
}

function formatVehicle(vehicle?: VehicleRow): string | null {
  if (!vehicle) return null;

  const label = `${vehicle.plate_number ?? ""} ${vehicle.make ?? ""} ${
    vehicle.model ?? ""
  }`.trim();

  return label || null;
}

export async function getStaffDashboardData(): Promise<StaffDashboardData> {
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  if (!profile || profile.role !== "staff") {
    return {
      totalRequests: 0,
      pendingRequests: 0,
      approvedRequests: 0,
      aiSuggestionsUsed: 0,
      recentRequests: [],
    };
  }

  const { data: requestsData, error } = await supabase
    .from("requests")
    .select("id, destination, status, created_at")
    .eq("staff_profile_id", profile.id)
    .order("created_at", { ascending: false });

  if (error || !requestsData) {
    return {
      totalRequests: 0,
      pendingRequests: 0,
      approvedRequests: 0,
      aiSuggestionsUsed: 0,
      recentRequests: [],
    };
  }

  const requests = requestsData as RequestRow[];
  const requestIds = requests.map((request) => request.id);

  let aiSuggestionsUsed = 0;

  if (requestIds.length > 0) {
    const { count } = await supabase
      .from("ai_logs")
      .select("id", { count: "exact", head: true })
      .in("request_id", requestIds);

    aiSuggestionsUsed = count ?? 0;
  }

  const allocationMap = new Map<string, AllocationRow>();
  const vehicleMap = new Map<string, VehicleRow>();
  const driverMap = new Map<string, DriverRow>();
  const profileMap = new Map<string, ProfileRow>();

  if (requestIds.length > 0) {
    const { data: allocationsData } = await supabase
      .from("allocations")
      .select("request_id, vehicle_id, driver_id")
      .in("request_id", requestIds);

    const allocations = (allocationsData ?? []) as AllocationRow[];

    for (const allocation of allocations) {
      allocationMap.set(allocation.request_id, allocation);
    }

    const vehicleIds = allocations
      .map((allocation) => allocation.vehicle_id)
      .filter((id): id is string => Boolean(id));

    const driverIds = allocations
      .map((allocation) => allocation.driver_id)
      .filter((id): id is string => Boolean(id));

    if (vehicleIds.length > 0) {
      const { data: vehiclesData } = await supabase
        .from("vehicles")
        .select("id, plate_number, make, model")
        .in("id", vehicleIds);

      const vehicles = (vehiclesData ?? []) as VehicleRow[];

      for (const vehicle of vehicles) {
        vehicleMap.set(vehicle.id, vehicle);
      }
    }

    if (driverIds.length > 0) {
      const { data: driversData } = await supabase
        .from("drivers")
        .select("id, profile_id, phone")
        .in("id", driverIds);

      const drivers = (driversData ?? []) as DriverRow[];

      for (const driver of drivers) {
        driverMap.set(driver.id, driver);
      }

      const driverProfileIds = drivers
          .map((driver) => driver.profile_id)
          .filter((id): id is string => Boolean(id));

      if (driverProfileIds.length > 0) {
        const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", driverProfileIds);

        const driverProfiles = (profilesData ?? []) as ProfileRow[];

        for (const driverProfile of driverProfiles) {
          profileMap.set(driverProfile.id, driverProfile);
        }
      }
    }
  }

  const totalRequests = requests.length;
  const pendingRequests = requests.filter(
    (request) => request.status === "pending"
  ).length;
  const approvedRequests = requests.filter(
    (request) => request.status === "approved"
  ).length;

  const recentRequests = requests.slice(0, 5).map((request) => {
    const allocation = allocationMap.get(request.id);
    const vehicle = allocation?.vehicle_id
      ? vehicleMap.get(allocation.vehicle_id)
      : undefined;

    const driver = allocation?.driver_id
      ? driverMap.get(allocation.driver_id)
      : undefined;

    const driverProfile = driver?.profile_id
      ? profileMap.get(driver.profile_id)
      : undefined;

    return {
      id: request.id,
      destination: request.destination,
      createdAt: new Date(request.created_at).toLocaleDateString(),
      status: mapStatus(request.status),
      assignedVehicle: formatVehicle(vehicle),
      assignedDriver: driverProfile?.full_name ?? null,
      driverEmail: driverProfile?.email ?? null,
      driverPhone: driver?.phone ?? null,
    };
  });

  return {
    totalRequests,
    pendingRequests,
    approvedRequests,
    aiSuggestionsUsed,
    recentRequests,
  };
}