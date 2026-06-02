import { useReducer, useEffect, useCallback } from "react";
import { getPinImages, type PinImage } from "../services/travelPinService";

interface State {
  images: PinImage[];
  loading: boolean;
  error: boolean;
  current: number;
}

type Action =
  | { type: "start" }
  | { type: "success"; images: PinImage[] }
  | { type: "error" }
  | { type: "prev" }
  | { type: "next" }
  | { type: "set_current"; index: number };

const init: State = { images: [], loading: true, error: false, current: 0 };

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "start":
      return init;
    case "success":
      return { ...s, images: a.images, loading: false };
    case "error":
      return { ...s, loading: false, error: true };
    case "prev":
      return {
        ...s,
        current: (s.current - 1 + s.images.length) % s.images.length,
      };
    case "next":
      return { ...s, current: (s.current + 1) % s.images.length };
    case "set_current":
      return { ...s, current: a.index };
  }
}

export function usePinImages(pinId: string) {
  const [state, dispatch] = useReducer(reducer, init);

  useEffect(() => {
    dispatch({ type: "start" });
    getPinImages(pinId)
      .then((images) => dispatch({ type: "success", images }))
      .catch(() => dispatch({ type: "error" }));
  }, [pinId]);

  const prev = useCallback(() => dispatch({ type: "prev" }), []);
  const next = useCallback(() => dispatch({ type: "next" }), []);

  return {
    images: state.images,
    loading: state.loading,
    error: state.error,
    current: state.current,
    setCurrent: (index: number) => dispatch({ type: "set_current", index }),
    prev,
    next,
  };
}
