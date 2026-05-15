const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

export interface PinImage {
  cloudinaryPublicId: string;
  cloudinarySecureUrl: string;
  caption: string;
  dateTaken: string;
}

export interface Pin {
  id: string;
  locationName: string;
  country: string;
  latitude: number;
  longitude: number;
  images: PinImage[];
}

export interface CreatePinPayload {
  locationName: string;
  country: string;
  latitude: number;
  longitude: number;
  cloudinaryFolder: string;
}

export async function getPins(): Promise<Pin[]> {
  const res = await fetch(`${BASE_URL}/api/travel/pins`);
  if (!res.ok) throw new Error(`Failed to fetch pins: ${res.status}`);
  return res.json();
}

export async function deletePin(id: string, token: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/travel/pins/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) throw new Error("unauthorized");
  if (!res.ok) throw new Error(`Failed to delete pin: ${res.status}`);
}

export async function createPin(
  payload: CreatePinPayload,
  token: string,
): Promise<Pin> {
  const res = await fetch(`${BASE_URL}/api/travel/pins`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (res.status === 401) throw new Error("unauthorized");
  if (!res.ok) throw new Error(`Failed to create pin: ${res.status}`);
  return res.json();
}
