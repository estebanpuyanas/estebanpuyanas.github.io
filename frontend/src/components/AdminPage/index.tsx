import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TravelsMap from "../TravelsMap";
import { createPin, type Pin } from "../../services/travelPinService";
import { useTravelPins } from "../../hooks/useTravelPins";
import { useTheme } from "../../hooks/useTheme";
import "./index.css";

const TOKEN_KEY = "ep-admin-token";

function getStoredToken(): string {
  try { return localStorage.getItem(TOKEN_KEY) ?? ""; } catch { return ""; }
}

function storeToken(t: string) {
  try { localStorage.setItem(TOKEN_KEY, t); } catch {}
}

function clearToken() {
  try { localStorage.removeItem(TOKEN_KEY); } catch {}
}

export default function AdminPage() {
  const navigate = useNavigate();
  const [token, setToken] = useState(getStoredToken);
  const [tokenInput, setTokenInput] = useState("");
  const [authError, setAuthError] = useState(false);

  useTheme();

  const { pins, addPin } = useTravelPins();

  const [pendingPin, setPendingPin] = useState<{ lat: number; lng: number } | null>(null);
  const [form, setForm] = useState({
    locationName: "",
    country: "",
    cloudinaryFolder: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  const markers = pins.map((p) => ({
    id: p.id,
    label: p.locationName,
    lat: p.latitude,
    lng: p.longitude,
    photos: p.images.map((i) => i.cloudinarySecureUrl),
  }));

  const handleLogin = () => {
    if (!tokenInput.trim()) return;
    storeToken(tokenInput.trim());
    setToken(tokenInput.trim());
    setTokenInput("");
    setAuthError(false);
  };

  const handleLogout = () => {
    clearToken();
    setToken("");
    navigate("/");
  };

  const handleMapClick = (lat: number, lng: number) => {
    setPendingPin({ lat, lng });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingPin) { setSubmitError("Click the map to place the pin first."); return; }
    if (!form.locationName || !form.country || !form.cloudinaryFolder) {
      setSubmitError("All fields are required.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    setSubmitSuccess("");

    try {
      const pin: Pin = await createPin(
        {
          locationName: form.locationName,
          country: form.country,
          latitude: pendingPin.lat,
          longitude: pendingPin.lng,
          cloudinaryFolder: form.cloudinaryFolder,
        },
        token,
      );
      addPin(pin);
      setForm({ locationName: "", country: "", cloudinaryFolder: "" });
      setPendingPin(null);
      setSubmitSuccess(`"${pin.locationName}" added.`);
    } catch (err) {
      if (err instanceof Error && err.message === "unauthorized") {
        setAuthError(true);
        clearToken();
        setToken("");
      } else {
        setSubmitError("Failed to save pin. Try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="admin-gate">
        <div className="admin-gate-box">
          <p className="admin-gate-label">// admin</p>
          <p className="admin-gate-hint">enter your admin token to continue</p>
          {authError && (
            <p className="admin-gate-error">token rejected — try again</p>
          )}
          <form
            className="admin-gate-form"
            onSubmit={(e) => { e.preventDefault(); handleLogin(); }}
          >
            <input
              className="admin-input"
              type="password"
              placeholder="admin token"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              autoFocus
            />
            <button className="admin-btn admin-btn--primary" type="submit">
              unlock
            </button>
            <button
              type="button"
              className="admin-btn admin-btn--ghost"
              onClick={() => navigate(-1)}
            >
              ← go back
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <div className="admin-header">
        <span className="admin-header-label">// admin — travel pins</span>
        <button className="admin-btn admin-btn--ghost" onClick={handleLogout}>
          log out
        </button>
      </div>

      <div className="admin-body">
        <div className="admin-map-wrap">
          <p className="admin-hint">click the map to place a pin</p>
          <TravelsMap
            markers={markers}
            onMapClick={handleMapClick}
            pendingPin={pendingPin}
          />
        </div>

        <form className="admin-form" onSubmit={handleSubmit}>
          <p className="admin-form-label">new pin</p>

          <div className="admin-coords">
            <span className="admin-coord-val">
              {pendingPin
                ? `${pendingPin.lat.toFixed(4)}, ${pendingPin.lng.toFixed(4)}`
                : "no location selected"}
            </span>
            {pendingPin && (
              <button
                type="button"
                className="admin-btn admin-btn--ghost"
                onClick={() => setPendingPin(null)}
              >
                clear
              </button>
            )}
          </div>

          <label className="admin-label">
            location name
            <input
              className="admin-input"
              type="text"
              placeholder="e.g. Tokyo"
              value={form.locationName}
              onChange={(e) => setForm((f) => ({ ...f, locationName: e.target.value }))}
            />
          </label>

          <label className="admin-label">
            country
            <input
              className="admin-input"
              type="text"
              placeholder="e.g. Japan"
              value={form.country}
              onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
            />
          </label>

          <label className="admin-label">
            cloudinary folder
            <input
              className="admin-input"
              type="text"
              placeholder="e.g. travels/tokyo"
              value={form.cloudinaryFolder}
              onChange={(e) =>
                setForm((f) => ({ ...f, cloudinaryFolder: e.target.value }))
              }
            />
          </label>

          {submitError && <p className="admin-error">{submitError}</p>}
          {submitSuccess && <p className="admin-success">{submitSuccess}</p>}

          <button
            className="admin-btn admin-btn--primary"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "saving..." : "save pin"}
          </button>
        </form>
      </div>
    </div>
  );
}
