import { useEffect, useState } from "react";
import { getCarrier, listCarriers } from "./api";
import { RegisterForm } from "./RegisterForm";
import { CarrierHome } from "./CarrierHome";
import { TopBar } from "./Shell";
import { STATUS_COLOR } from "./labels";
import type { CarrierProfile, CarrierSummary } from "./types";

export function CarrierApp() {
  const [profile, setProfile] = useState<CarrierProfile | null>(null);
  const [existing, setExisting] = useState<CarrierSummary[]>([]);
  const [picked, setPicked] = useState<string>("");
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listCarriers()
      .then((list) => {
        setExisting(list);
        if (list.length) setPicked(list[0].id);
      })
      .catch((e) => setError(String(e)));
  }, []);

  const loginExisting = async () => {
    if (!picked) return;
    setLoadingExisting(true);
    setError(null);
    try {
      setProfile(await getCarrier(picked));
    } catch (e) {
      setError(String(e));
    } finally {
      setLoadingExisting(false);
    }
  };

  if (profile) {
    return <CarrierHome profile={profile} onLogout={() => setProfile(null)} />;
  }

  return (
    <div className="cp-app">
      <TopBar />
      <div className="cp-container narrow cp-stack">
        <div>
          <h1 className="cp-h1">Get your company verified</h1>
          <p className="cp-sub">
            Register your logistics company to run a credibility &amp; risk check,
            or log in as an existing carrier.
          </p>
        </div>

        {error && (
          <div className="cp-alert">{error} — is the carrier API running on :8001?</div>
        )}

        <div className="cp-card cp-card-pad-lg">
          <h2 className="cp-card-h2">Register a new company</h2>
          <RegisterForm onRegistered={setProfile} />
        </div>

        <div className="cp-card">
          <h2 className="cp-card-h2">Log in as an existing company</h2>
          <div className="cp-inline-row">
            <select className="cp-input" value={picked}
              onChange={(e) => setPicked(e.target.value)}
              style={{ minWidth: 320, flex: 1 }}>
              {existing.map((c) => (
                <option key={c.id} value={c.id}>{c.id} — {c.name} ({c.status})</option>
              ))}
            </select>
            <button className="cp-btn cp-btn-primary" onClick={loginExisting}
              disabled={!picked || loadingExisting}>
              {loadingExisting ? "Loading…" : "Log in"}
            </button>
          </div>
          <p className="cp-hint">
            Tip: pick C023 to see a high-score carrier still excluded by a sanctions hit
            <span style={{ width: 8, height: 8, borderRadius: "50%",
              background: STATUS_COLOR["Do not use"], display: "inline-block" }} />
          </p>
        </div>
      </div>
    </div>
  );
}
