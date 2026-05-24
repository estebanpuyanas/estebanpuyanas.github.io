const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

export interface PinImage {
  cloudinaryPublicId: string;
  cloudinarySecureUrl: string;
  caption: string;
  uploadedAt: string;
}

export interface Pin {
  id: string;
  locationName: string;
  country: string;
  latitude: number;
  longitude: number;
  cloudinaryFolder?: string;
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

export async function getPinImages(id: string): Promise<PinImage[]> {
  const res = await fetch(`${BASE_URL}/api/travel/pins/${id}/images`);
  if (!res.ok) throw new Error(`Failed to fetch images: ${res.status}`);
  return res.json();
}

export async function uploadPinImage(
  pinId: string,
  file: File,
  token: string,
): Promise<PinImage> {
  const form = new FormData();
  form.append("image", file);
  const res = await fetch(`${BASE_URL}/api/admin/travel/pins/${pinId}/images`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (res.status === 401) throw new Error("unauthorized");
  if (!res.ok) throw new Error(`Failed to upload image: ${res.status}`);
  return res.json();
}

export async function updateImageCaption(
  pinId: string,
  publicId: string,
  caption: string,
  token: string,
): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/admin/travel/pins/${pinId}/images`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ publicId, caption }),
  });
  if (res.status === 401) throw new Error("unauthorized");
  if (!res.ok) throw new Error(`Failed to update caption: ${res.status}`);
}

export async function deletePinImage(
  pinId: string,
  publicId: string,
  token: string,
): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/admin/travel/pins/${pinId}/images`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ publicId }),
  });
  if (res.status === 401) throw new Error("unauthorized");
  if (!res.ok) throw new Error(`Failed to delete image: ${res.status}`);
}

export async function syncPinImages(
  pinId: string,
  token: string,
): Promise<number> {
  const res = await fetch(
    `${BASE_URL}/api/admin/travel/pins/${pinId}/images/sync`,
    { method: "POST", headers: { Authorization: `Bearer ${token}` } },
  );
  if (res.status === 401) throw new Error("unauthorized");
  if (!res.ok) throw new Error(`Failed to sync: ${res.status}`);
  const data = await res.json();
  return data.pruned as number;
}

export async function getCloudinaryFolders(token: string): Promise<string[]> {
  const res = await fetch(`${BASE_URL}/api/admin/cloudinary/folders`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) throw new Error("unauthorized");
  if (!res.ok) throw new Error(`Failed to fetch folders: ${res.status}`);
  return res.json();
}

export async function updatePinFolder(
  pinId: string,
  cloudinaryFolder: string,
  token: string,
): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/admin/travel/pins/${pinId}/folder`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ cloudinaryFolder }),
  });
  if (res.status === 401) throw new Error("unauthorized");
  if (!res.ok) throw new Error(`Failed to update folder: ${res.status}`);
}

export async function updateImageOrder(
  pinId: string,
  publicIds: string[],
  token: string,
): Promise<void> {
  const res = await fetch(
    `${BASE_URL}/api/admin/travel/pins/${pinId}/images/order`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ publicIds }),
    },
  );
  if (res.status === 401) throw new Error("unauthorized");
  if (!res.ok) throw new Error(`Failed to update image order: ${res.status}`);
}

export async function updatePinLocationName(
  pinId: string,
  locationName: string,
  token: string,
): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/admin/travel/pins/${pinId}/name`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ locationName }),
  });
  if (res.status === 401) throw new Error("unauthorized");
  if (!res.ok) throw new Error(`Failed to update location name: ${res.status}`);
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
