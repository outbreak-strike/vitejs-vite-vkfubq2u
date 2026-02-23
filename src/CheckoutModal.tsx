// @ts-nocheck
import React, { useMemo, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  productName: string;
  totalUsd: number;

  // optional info
  vatNote?: string;
  currency?: string; // "USD"
  onPay: () => void; // parent will "confirm" and close
};

export default function CheckoutModal({
  open,
  onClose,
  productName,
  totalUsd,
  vatNote = "Includes VAT",
  currency = "USD",
  onPay,
}: Props) {
  const [showDetails, setShowDetails] = useState(false);
  const [company, setCompany] = useState("");
  const [vatId, setVatId] = useState("");

  const totalLabel = useMemo(() => {
    // mimic EU style: 1 069,20
    const v = Number(totalUsd || 0);
    const s = v.toFixed(2).replace(".", ",");
    const parts = s.split(",");
    const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return `${intPart},${parts[1]} ${currency === "USD" ? "$" : currency}`;
  }, [totalUsd, currency]);

  if (!open) return null;

  return (
    <div className="cm-backdrop" onMouseDown={onClose}>
      <style>{styles}</style>

      <div className="cm-modal" onMouseDown={(e) => e.stopPropagation()}>
        <button className="cm-x" onClick={onClose} aria-label="Close">
          ×
        </button>

        <div className="cm-logo">Snov<span className="cm-dot">io</span></div>

        <div className="cm-product">{productName}</div>

        <div className="cm-totalRow">
          <div className="cm-totalLabel">Total:</div>
          <div className="cm-total">{totalLabel}</div>
        </div>

        <button className="cm-details" onClick={() => setShowDetails((v) => !v)}>
          {showDetails ? "Hide details" : "View details"}
        </button>

        {showDetails && (
          <div className="cm-detailsBox">
            <div className="cm-muted">{vatNote}</div>
            <div className="cm-muted">VAT ID (optional):</div>
          </div>
        )}

        <div className="cm-fields">
          <input
            className="cm-input"
            placeholder="Company (optional)"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
          <input
            className="cm-input"
            placeholder="VAT ID (optional)"
            value={vatId}
            onChange={(e) => setVatId(e.target.value)}
          />
        </div>

        <div className="cm-sectionTitle">Saved Payment Method</div>

        <div className="cm-paymentCard">
          <div className="cm-cardLeft">
            <div className="cm-mc">●●</div>
            <div>
              <div className="cm-cardLine">Ending with *3767</div>
              <div className="cm-muted">Expires 12/2026</div>
            </div>
          </div>
        </div>

        <button className="cm-linkBtn">+ Use new payment method</button>

        <button
          className="cm-pay"
          onClick={() => {
            onPay?.();
            onClose?.();
          }}
        >
          Pay {totalLabel}
        </button>

        <div className="cm-footer">
          <span className="cm-muted">FastSpring / 2Checkout (prototype)</span>
        </div>
      </div>
    </div>
  );
}

const styles = `
.cm-backdrop{
  position:fixed; inset:0;
  background:rgba(17,24,39,.45);
  display:flex;
  align-items:center;
  justify-content:center;
  padding:22px;
  z-index:9999;
}
.cm-modal{
  width:min(420px, 100%);
  background:#fff;
  border-radius:14px;
  border:1px solid rgba(0,0,0,.06);
  box-shadow:0 20px 60px rgba(0,0,0,.25);
  padding:18px 18px 16px;
  position:relative;
}
.cm-x{
  position:absolute;
  right:10px; top:8px;
  width:34px; height:34px;
  border-radius:10px;
  border:1px solid rgba(229,231,235,1);
  background:#fff;
  cursor:pointer;
  font-size:20px;
  line-height:0;
}
.cm-logo{
  font-weight:950;
  font-size:36px;
  letter-spacing:-0.5px;
  color:#7c3aed;
  text-align:center;
  margin-top:6px;
}
.cm-dot{ color:#a78bfa; font-weight:900; }
.cm-product{
  margin-top:10px;
  text-align:center;
  font-weight:800;
  color:#111827;
}
.cm-totalRow{
  margin-top:8px;
  display:flex;
  justify-content:center;
  gap:10px;
  align-items:baseline;
}
.cm-totalLabel{ color:#6b7280; font-weight:800; }
.cm-total{ color:#22c55e; font-weight:950; font-size:20px; }
.cm-details{
  margin:10px auto 0;
  display:block;
  border:none;
  background:transparent;
  color:#2563eb;
  cursor:pointer;
  font-weight:800;
}
.cm-detailsBox{
  margin-top:8px;
  padding:10px 12px;
  background:#f9fafb;
  border:1px solid rgba(229,231,235,1);
  border-radius:12px;
}
.cm-muted{ color:#6b7280; font-weight:650; font-size:12px; }
.cm-fields{ margin-top:10px; display:flex; flex-direction:column; gap:10px; }
.cm-input{
  width:100%;
  border:1px solid rgba(229,231,235,1);
  border-radius:12px;
  padding:12px 12px;
  outline:none;
  font-weight:750;
}
.cm-input:focus{ border-color:rgba(124,58,237,.45); box-shadow:0 0 0 4px rgba(124,58,237,.10); }
.cm-sectionTitle{
  margin-top:14px;
  font-weight:950;
  color:#111827;
}
.cm-paymentCard{
  margin-top:8px;
  border:1px solid rgba(229,231,235,1);
  border-radius:12px;
  padding:12px;
}
.cm-cardLeft{ display:flex; gap:10px; align-items:center; }
.cm-mc{
  width:34px; height:22px;
  border-radius:6px;
  background:linear-gradient(90deg,#ef4444,#f59e0b);
  color:transparent;
}
.cm-cardLine{ font-weight:900; color:#111827; }
.cm-linkBtn{
  margin-top:10px;
  border:none;
  background:transparent;
  color:#2563eb;
  cursor:pointer;
  font-weight:900;
}
.cm-pay{
  margin-top:12px;
  width:100%;
  border:none;
  border-radius:12px;
  padding:12px 12px;
  background:#6a55ea;
  color:#fff;
  font-weight:950;
  cursor:pointer;
}
.cm-pay:hover{ filter:brightness(.98); }
.cm-footer{
  margin-top:10px;
  text-align:center;
}
`;