import { useNavigate } from "react-router-dom";
import { getFunnyError } from "../../hooks/useAdminAuth";
import "./index.css";

interface AdminGateProps {
  section: string;
  tokenInput: string;
  setTokenInput: (v: string) => void;
  authError: boolean;
  failedAttempts: number;
  lastTokenSnippet: string;
  onLogin: () => void;
}

export default function AdminGate({
  section,
  tokenInput,
  setTokenInput,
  authError,
  failedAttempts,
  lastTokenSnippet,
  onLogin,
}: AdminGateProps) {
  const navigate = useNavigate();

  return (
    <div className="admin-gate">
      <div className="admin-gate-box">
        <p className="admin-gate-label">// admin — {section}</p>
        <p className="admin-gate-hint">
          are you sure you should be here?
          <br />
          enter your admin token to continue:
        </p>
        {authError && (
          <p className="admin-gate-error">
            token rejected — {getFunnyError(failedAttempts, lastTokenSnippet)}
          </p>
        )}
        <form
          className="admin-gate-form"
          onSubmit={(e) => {
            e.preventDefault();
            onLogin();
          }}
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
          <p className="admin-gate-hint">
            psst... if your token got rejected, maybe just...
          </p>
          <button
            type="button"
            className="admin-btn admin-btn--ghost"
            onClick={() => navigate("/admin")}
          >
            ← go back
          </button>
        </form>
      </div>
    </div>
  );
}
