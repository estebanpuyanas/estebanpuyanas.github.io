import { useState, useEffect } from "react";
import { getCloudinaryFolders } from "../services/travelPinService";

export function useCloudinaryFolders(token: string) {
  const [folders, setFolders] = useState<string[]>([]);

  useEffect(() => {
    if (!token) return;
    getCloudinaryFolders(token)
      .then(setFolders)
      .catch(() => {});
  }, [token]);

  return { folders };
}
