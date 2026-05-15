import { useState, useEffect } from "react";
import { getPins, type Pin } from "../services/travelPinService";

export function useTravelPins() {
  const [pins, setPins] = useState<Pin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getPins()
      .then(setPins)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const addPin = (pin: Pin) => setPins((prev) => [...prev, pin]);

  return { pins, loading, error, addPin };
}
