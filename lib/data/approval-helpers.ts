export type UnitRelation = { name: string } | { name: string }[] | null;

export type RequestRelation = {
  request_code: string;
  destination: string;
} | {
  request_code: string;
  destination: string;
}[] | null;

/**
 * NOTYE: Supabase joined relations sometimes come back as either:
 * - a single object
 * - an array with one object
 * - null
 *
 * These helpers normalize that safely.
 */
export function getUnitName(unit: UnitRelation): string {
  if (Array.isArray(unit)) {
    return unit[0]?.name ?? "Not assigned";
  }

  return unit?.name ?? "Not assigned";
}

export function getRequestInfo(
  request: RequestRelation
): { request_code: string; destination: string } {
  if (Array.isArray(request)) {
    return {
      request_code: request[0]?.request_code ?? "N/A",
      destination: request[0]?.destination ?? "N/A",
    };
  }

  return {
    request_code: request?.request_code ?? "N/A",
    destination: request?.destination ?? "N/A",
  };
}