// @ts-nocheck
import React, { useMemo, useState } from "react";

type PricingTab = "annual" | "3m" | "monthly" | "buy";

type Pack = {
  key: "bronze" | "silver" | "gold" | "platinum";
  name: string;
  priceUsd: number;
  credits: number;
  tagline?: string;
};

type Props = {
  onBack: () => void;

  // Current plan display
  currentPlanName?: string; // e.g. "Trial", "Starter", "Pro"
  includedCreditsTotal?: number; // total included credits in plan
  includedCreditsUsed?: number; // used included credits

  // Purchase action: parent should open FastSpring modal + update balance
  onUpgrade: (payload: {
    source: "pack" | "slider";
    creditsToAdd: number;
    totalUsd: number;
    discountPct: number;
    pricePerCredit: number;
    packKey?: Pack["key"];
  }) => void;
};

export default function PricingPage({
  onBack,
  currentPlanName = "Free Trial",
  includedCreditsTotal = 100,
  includedCreditsUsed = 8,
  onUpgrade,
}: Props) {
  const [tab, setTab] = useState<PricingTab>("annual");

  // Buy e-credits
  const packs: Pack[] = [
    { key: "bronze", name: "Bronze", priceUsd: 50, credits: 6500 },
    { key: "silver", name: "Silver", priceUsd: 150, credits: 24000 },
    { key: "gold", name: "Gold", priceUsd: 500, credits: 140000 },
    { key: "platinum", name: "Platinum", priceUsd: 1000, credits: 585000 },
  ];

  const remaining = Math.max(0, includedCreditsTotal - includedCreditsUsed);
  const remainingPct = includedCreditsTotal > 0 ? (remaining / includedCreditsTotal) * 100 : 0;

  // Slider logic
  const pricePerCredit = 0.07;
  const [qty, setQty] = useState(5000);

  const pricing = useMemo(() => {
    const discountSteps = Math.floor(qty / 1000); // every 1000 credits
    const discountPct = Math.min(discountSteps * 0.1, 0.5); // cap 50%
    const subtotal = qty * pricePerCredit;
    const totalUsd = subtotal * (1 - discountPct);
    return { discountPct, subtotal, totalUsd };
  }, [qty]);

  return (
    <div className="pp-wrap">
      <style>{pricingStyles}</style>

      <div className="pp-top">
        <button className="pp-back" onClick={onBack}>
          ← Back
        </button>
        <div className="pp-titleBlock">
          <h1 className="pp-title">Forget multiple tools. This is the one to rule them all.</h1>
          <div className="pp-sub">Pricing (prototype)</div>
        </div>
      </div>

      <div className="pp-tabs">
        <button className={tab === "annual" ? "pp-tab pp-tabActive" : "pp-tab"} onClick={() => setTab("annual")}>
          Annual <span className="pp-tabBadge">-25%</span>
        </button>
        <button className={tab === "3m" ? "pp-tab pp-tabActive" : "pp-tab"} onClick={() => setTab("3m")}>
          3 months <span className="pp-tabBadge">-5%</span>
        </button>
        <button className={tab === "monthly" ? "pp-tab pp-tabActive" : "pp-tab"} onClick={() => setTab("monthly")}>
          Monthly
        </button>
        <button className={tab === "buy" ? "pp-tab pp-tabActive" : "pp-tab"} onClick={() => setTab("buy")}>
          Buy e-credits
        </button>
      </div>

      {tab !== "buy" ? (
        <div className="pp-placeholder">
          <div className="pp-card">
            <div className="pp-cardTitle">Plans (demo)</div>
            <div className="pp-muted">
              Тут пізніше зробимо ваші планові картки 1:1 (як на скріні). Для задачі е-credits — відкрий tab{" "}
              <b>Buy e-credits</b>.
            </div>
          </div>
        </div>
      ) : (
        <div className="pp-buy">
          {/* Current plan */}
          <div className="pp-card">
            <div className="pp-row pp-rowSpace">
              <div>
                <div className="pp-cardTitle">Current plan</div>
                <div className="pp-muted">{currentPlanName}</div>
              </div>
              <div className="pp-chip">Included e-credits</div>
            </div>

            <div className="pp-row pp-rowSpace pp-mt12">
              <div className="pp-muted">Credits remaining</div>
              <div className="pp-strong">
                {remaining} / {includedCreditsTotal}
                <span className="pp-muted"> (used {includedCreditsUsed})</span>
              </div>
            </div>

            <div className="pp-progress">
              <div className="pp-progressBar" style={{ width: `${Math.max(0, Math.min(100, remainingPct))}%` }} />
            </div>

            {/* Packs */}
            <div className="pp-sectionTitle">Buy e-credits packs</div>
            <div className="pp-packGrid">
              {packs.map((p) => (
                <div key={p.key} className="pp-pack">
                  <div className="pp-packName">{p.name}</div>
                  <div className="pp-packCredits">{p.credits.toLocaleString()} e-credits</div>
                  <div className="pp-packPrice">${p.priceUsd}</div>
                  <button
                    className="pp-btn pp-btnPrimary"
                    onClick={() =>
                      onUpgrade({
                        source: "pack",
                        creditsToAdd: p.credits,
                        totalUsd: p.priceUsd,
                        discountPct: 0,
                        pricePerCredit,
                        packKey: p.key,
                      })
                    }
                  >
                    Upgrade
                  </button>
                </div>
              ))}
            </div>

            {/* Slider */}
            <div className="pp-sectionTitle">Pay per credit</div>
            <div className="pp-sliderCard">
              <div className="pp-row pp-rowSpace">
                <div>
                  <div className="pp-muted">Credits to buy</div>
                  <div className="pp-strong">{qty.toLocaleString()} e-credits</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="pp-muted">Price / credit</div>
                  <div className="pp-strong">${pricePerCredit.toFixed(2)}</div>
                </div>
              </div>

              <input
                className="pp-range"
                type="range"
                min={0}
                max={50000}
                step={500}
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
              />

              <div className="pp-breakdown">
                <div className="pp-muted">Subtotal</div>
                <div className="pp-strong">${pricing.subtotal.toFixed(2)}</div>

                <div className="pp-muted">Discount</div>
                <div className="pp-strong">{Math.round(pricing.discountPct * 100)}%</div>

                <div className="pp-muted">Total</div>
                <div className="pp-strong">${pricing.totalUsd.toFixed(2)}</div>
              </div>

              <div className="pp-muted pp-mt8">
                Rule (demo): each 1,000 credits gives 10% off (cap 50%).
              </div>

              <div className="pp-actions">
                <button className="pp-btn" onClick={onBack}>
                  Back to Prospects
                </button>
                <button
                  className="pp-btn pp-btnPrimary"
                  disabled={qty <= 0}
                  onClick={() =>
                    onUpgrade({
                      source: "slider",
                      creditsToAdd: qty,
                      totalUsd: pricing.totalUsd,
                      discountPct: pricing.discountPct,
                      pricePerCredit,
                    })
                  }
                >
                  Upgrade
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const pricingStyles = `
.pp-wrap{
  padding: 22px;
  max-width: 1100px;
  margin: 0 auto;
}
.pp-top{
  display:flex;
  align-items:flex-start;
  gap:14px;
}
.pp-back{
  border:1px solid rgba(229,231,235,1);
  background:#fff;
  border-radius:12px;
  padding:10px 12px;
  cursor:pointer;
  font-weight:800;
}
.pp-titleBlock{ flex:1; }
.pp-title{
  margin:0;
  font-size:26px;
  font-weight:950;
  line-height:1.15;
}
.pp-sub{
  margin-top:6px;
  color:#6b7280;
  font-weight:700;
}
.pp-tabs{
  margin-top:16px;
  display:flex;
  gap:10px;
  flex-wrap:wrap;
}
.pp-tab{
  border:1px solid rgba(229,231,235,1);
  background:#fff;
  border-radius:999px;
  padding:10px 14px;
  cursor:pointer;
  font-weight:900;
  font-size:13px;
}
.pp-tabActive{
  background:#e8f5c8;
  border-color:#cfeaa0;
}
.pp-tabBadge{
  margin-left:8px;
  background:#111827;
  color:#fff;
  border-radius:999px;
  padding:3px 8px;
  font-size:11px;
  font-weight:900;
}
.pp-card{
  margin-top:18px;
  background:#fff;
  border:1px solid rgba(229,231,235,1);
  border-radius:18px;
  padding:16px;
}
.pp-cardTitle{
  font-weight:950;
  font-size:16px;
}
.pp-muted{ color:#6b7280; }
.pp-strong{ font-weight:950; }
.pp-chip{
  border:1px solid rgba(229,231,235,1);
  background:#f9fafb;
  border-radius:999px;
  padding:6px 10px;
  font-weight:900;
  font-size:12px;
  color:#374151;
}
.pp-row{ display:flex; align-items:center; gap:12px; }
.pp-rowSpace{ justify-content:space-between; }
.pp-mt12{ margin-top:12px; }
.pp-mt8{ margin-top:8px; }

.pp-progress{
  margin-top:10px;
  height:10px;
  border-radius:999px;
  background:#eef2ff;
  overflow:hidden;
  border:1px solid rgba(99,102,241,.20);
}
.pp-progressBar{
  height:100%;
  background: linear-gradient(90deg,#2563eb,#7c3aed);
}
.pp-sectionTitle{
  margin-top:18px;
  font-weight:950;
}
.pp-packGrid{
  margin-top:12px;
  display:grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap:12px;
}
@media (max-width: 980px){
  .pp-packGrid{ grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
.pp-pack{
  border:1px solid rgba(229,231,235,1);
  border-radius:16px;
  padding:14px;
  display:flex;
  flex-direction:column;
  gap:6px;
  background:#fff;
}
.pp-packName{ font-weight:950; }
.pp-packCredits{ color:#2563eb; font-weight:950; }
.pp-packPrice{ color:#6b7280; font-weight:900; margin-bottom:8px; }

.pp-sliderCard{
  margin-top:12px;
  border:1px solid rgba(229,231,235,1);
  border-radius:16px;
  padding:14px;
  background:#fbfbfe;
}
.pp-range{ width:100%; margin:14px 0; }
.pp-breakdown{
  display:grid;
  grid-template-columns: 1fr auto;
  gap:10px 14px;
  align-items:center;
  padding:10px 0;
  border-top:1px dashed rgba(107,114,128,.35);
  border-bottom:1px dashed rgba(107,114,128,.35);
}
.pp-actions{
  margin-top:12px;
  display:flex;
  justify-content:flex-end;
  gap:10px;
  flex-wrap:wrap;
}
.pp-btn{
  border:1px solid rgba(229,231,235,1);
  background:#fff;
  border-radius:12px;
  padding:10px 12px;
  cursor:pointer;
  font-weight:900;
  font-size:13px;
}
.pp-btnPrimary{
  background:#6a55ea;
  color:#fff;
  border-color: transparent;
}
.pp-btn:disabled{
  opacity:.55;
  cursor:not-allowed;
}
.pp-placeholder{ margin-top: 4px; }
`;