const BASE = "https://nominatim.openstreetmap.org";
const HEADERS = { "User-Agent": "estebanpuyanas.github.io" };

async function nominatimFetch(
  path: string,
  params: Record<string, string>,
): Promise<unknown> {
  try {
    const url = new URL(`${BASE}/${path}`);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const res = await fetch(url.toString(), { headers: HEADERS });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<{ locationName: string; country: string } | null> {
  const data = await nominatimFetch("reverse", {
    format: "json",
    lat: String(lat),
    lon: String(lng),
    zoom: "10",
  });
  if (!data || typeof data !== "object") return null;
  const addr = (data as { address?: Record<string, string> }).address ?? {};
  return {
    locationName:
      addr.city ??
      addr.town ??
      addr.village ??
      addr.municipality ??
      addr.county ??
      "",
    country: addr.country ?? "",
  };
}

export interface GeoResult {
  displayName: string;
  lat: number;
  lng: number;
}

export async function forwardGeocode(query: string): Promise<GeoResult[]> {
  const data = await nominatimFetch("search", {
    format: "json",
    q: query,
    limit: "5",
    addressdetails: "1",
  });
  if (!Array.isArray(data)) return [];
  return data.map((r: { display_name: string; lat: string; lon: string }) => ({
    displayName: r.display_name,
    lat: parseFloat(r.lat),
    lng: parseFloat(r.lon),
  }));
}
