// @ts-nocheck
import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * Snov-style clickable mock: Prospects list + Enrich & AI catalog + credits + dynamic columns
 * - No external libs, pure React + inline CSS
 */

const PROVIDERS = [
  "FindyMail",
  "LeadMagic",
  "IcyPeas",
  "Prospeo",
  "Wiza",
  "ContactOut",
  "BetterContact",
];

const money = (n) => (Number.isFinite(n) ? n.toFixed(1).replace(/\.0$/, "") : String(n));

const baseColumns = [
  { id: "prospect", label: "PROSPECT", fixed: true },
  { id: "emails", label: "EMAILS", fixed: true },
  { id: "tags", label: "TAGS", fixed: true },
  { id: "added", label: "ADDED", fixed: true },
];

function seedProspects() {
  const names = [
    ["Doug", "Caywood"],
    ["David", "Chamberlain"],
    ["Kareem", "Zaki"],
    ["Brandon", "Herd"],
    ["Kenneth", "Auster"],
    ["Vincent", "Yancoskie"],
    ["Stephanie", "Griffith"],
    ["Vikas", "Sharma"],
    ["Lokesh", "Kannaiyan"],
    ["Vishakha", "Chavan"],
  ];
  const companies = [
    "Search Engines MD",
    "U.S. Inspection & NDT, LLC",
    "Thrive Capital",
    "Access Systems, Inc.",
    "U.S. Rubber Supply Co., Inc.",
    "Gradelink",
    "University Silkscreen",
    "Tradeindia.com",
    "Sonicwall",
    "Impresa",
  ];
  const titles = [
    "Co-Founder",
    "Chief Operating Officer",
    "Partner",
    "President",
    "Website Department Manager",
    "Business Owner",
    "Product Manager",
    "Senior Product Manager",
    "Operations Lead",
    "Head of Sales",
  ];
  const locations = [
    "Alipur, Delhi, India",
    "Bengaluru, Karnataka, India",
    "Vadodara, Gujarat, India",
    "New York, USA",
    "Chicago, USA",
    "London, UK",
    "Berlin, DE",
  ];

  const rows = Array.from({ length: 12 }).map((_, i) => {
    const [fn, ln] = names[i % names.length];
    const company = companies[i % companies.length];
    const title = titles[i % titles.length];
    const loc = locations[i % locations.length];
    const domain = company
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, "")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .join("") || "company";
    const email = i % 3 === 0 ? "" : `${fn.toLowerCase()}.${ln.toLowerCase()}@${domain}.com`;

    return {
      id: `p_${i + 1}`,
      firstName: fn,
      lastName: ln,
      title,
      company,
      companyDomain: i % 4 === 0 ? "" : `${domain}.com`,
      location: i % 2 === 0 ? loc : "",
      linkedin: i % 5 === 0 ? "" : `linkedin.com/in/${fn.toLowerCase()}-${ln.toLowerCase()}`,
      emails: email ? [email] : [],
      tags: i % 4 === 0 ? ["Imported"] : i % 3 === 0 ? ["New"] : [],
      added: `23 Dec 2025, 10:${(30 + i).toString().padStart(2, "0")} AM`,
      // enrichment placeholders:
      workEmail: "",
      emailStatus: "",
      phone: "",
      industry: "",
      seniority: "",
      jobListings: "",
      companyNews: "",
      fundingType: "",
    };
  });

  return rows;
}

function classNames(...xs) {
  return xs.filter(Boolean).join(" ");
}

function Badge({ children, tone = "gray", title }) {
  return (
    <span className={classNames("badge", `badge-${tone}`)} title={title || ""}>
      {children}
    </span>
  );
}

function IconDot({ tone = "green" }) {
  return <span className={classNames("dot", `dot-${tone}`)} />;
}

function Modal({ open, title, children, onClose, width = 920 }) {
  if (!open) return null;
  return (
    <div className="overlay" role="dialog" aria-modal="true">
      <div className="modal" style={{ width }}>
        <div className="modalHeader">
          <div className="modalTitle">{title}</div>
          <button className="iconBtn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="modalBody">{children}</div>
      </div>
    </div>
  );
}

function ProgressBar({ value }) {
  return (
    <div className="progressWrap">
      <div className="progressBar" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

function formatProspectCell(row) {
  const full = `${row.firstName} ${row.lastName}`.trim();
  const subtitle = [row.title, row.company].filter(Boolean).join(" • ");
  return { full, subtitle };
}

function normalizeName(s) {
  if (!s) return s;
  const t = String(s).trim();
  if (!t) return t;
  return t
    .split(/\s+/)
    .map((w) => w.slice(0, 1).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function normalizeDomain(s) {
  if (!s) return s;
  let t = String(s).trim().toLowerCase();
  t = t.replace(/^https?:\/\//, "").replace(/^www\./, "");
  t = t.split("/")[0];
  return t;
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function simulateWait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export default function App() {
  const [credits, setCredits] = useState(97);
  const [rows, setRows] = useState(() => seedProspects());

  const [activeList, setActiveList] = useState("dbs ai amplitude");
  const [lists] = useState(() => [
    { name: "red", count: 1 },
    { name: "dbs ai amplitude", count: 14800 },
    { name: "Prospect list 3", count: 90 },
    { name: "Prospect list 2", count: 3 },
    { name: "test", count: 5 },
    { name: "Prospect list 1", count: 1 },
    { name: "Prospect list", count: 1 },
    { name: "Prospect list 4", count: 90 },
  ]);

  const [query, setQuery] = useState("");

  // selection
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const selectedCount = selectedIds.size;

  // dynamic columns
  // column definition: {id,label,kind:"base"|"enrich"|"ai", deletable:boolean}
  const [columns, setColumns] = useState(() => [...baseColumns]);
  const [hiddenCols, setHiddenCols] = useState(() => new Set());

  // UI overlays
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [columnsOpen, setColumnsOpen] = useState(false);

  // enrichment flow states
  const [category, setCategory] = useState("person"); // person | company | ai | verification | cleanup
  const [pickedAction, setPickedAction] = useState(null); // {id,title,pricePerRow,type,...}
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [runOpen, setRunOpen] = useState(false);
  const [buyOpen, setBuyOpen] = useState(false);

  const [runProgress, setRunProgress] = useState(0);
  const [runLog, setRunLog] = useState([]);
  const [runSummary, setRunSummary] = useState(null);

  const tableScrollRef = useRef(null);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const { full, subtitle } = formatProspectCell(r);
      return (
        full.toLowerCase().includes(q) ||
        (subtitle || "").toLowerCase().includes(q) ||
        (r.emails?.join(" ") || "").toLowerCase().includes(q) ||
        (r.linkedin || "").toLowerCase().includes(q)
      );
    });
  }, [rows, query]);

  const allVisibleSelected = useMemo(() => {
    if (filteredRows.length === 0) return false;
    return filteredRows.every((r) => selectedIds.has(r.id));
  }, [filteredRows, selectedIds]);

  function toggleSelectAllVisible() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        filteredRows.forEach((r) => next.delete(r.id));
      } else {
        filteredRows.forEach((r) => next.add(r.id));
      }
      return next;
    });
  }

  function toggleRow(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // action catalog options
  const catalog = useMemo(() => {
    return {
      person: [
        {
          id: "work_email",
          title: "Work email (Waterfall)",
          subtitle: "Find work email using additional providers",
          pricePerRow: 1.5,
          tags: PROVIDERS,
          addColumns: [{ id: "workEmail", label: "WORK EMAIL", kind: "enrich" }],
        },
        {
          id: "full_profile",
          title: "Fully enriched profile",
          subtitle: "Enrich all available person fields (Xverum data)",
          pricePerRow: 0.5,
          addColumns: [
            { id: "phone", label: "PHONE", kind: "enrich" },
            { id: "industry", label: "INDUSTRY", kind: "enrich" },
            { id: "seniority", label: "SENIORITY", kind: "enrich" },
            { id: "linkedin", label: "LINKEDIN", kind: "enrich" },
            { id: "location", label: "LOCATION", kind: "enrich" },
          ],
        },
      ],
      company: [
        {
          id: "job_listings",
          title: "Job listings",
          subtitle: "Find job listings signal for the company",
          pricePerRow: 0.6,
          addColumns: [{ id: "jobListings", label: "JOB LISTINGS", kind: "enrich" }],
        },
        {
          id: "news",
          title: "Company news",
          subtitle: "Latest internet news mentions for the company",
          pricePerRow: 0.7,
          addColumns: [{ id: "companyNews", label: "COMPANY NEWS", kind: "enrich" }],
        },
        {
          id: "funding",
          title: "Funding type",
          subtitle: "Detect funding type (bootstrapped / seed / series ...)",
          pricePerRow: 0.6,
          addColumns: [{ id: "fundingType", label: "FUNDING TYPE", kind: "enrich" }],
        },
      ],
      ai: [
        {
          id: "ai_prompt",
          title: "AI prompt → output column",
          subtitle: "Generate a column using personalized variables",
          pricePerRow: 1.0,
          isAI: true,
        },
        {
          id: "web_agent",
          title: "Web research agent",
          subtitle: "Find info from open sources on the internet (demo)",
          pricePerRow: 1.2,
          isAI: true,
          mode: "web",
        },
        {
          id: "email_agent",
          title: "Email agent",
          subtitle: "Draft an email using prompt + row data (demo)",
          pricePerRow: 1.2,
          isAI: true,
          mode: "email",
        },
      ],
      verification: [
        {
          id: "verify_imported",
          title: "Verify imported emails",
          subtitle: "Verify emails using Snov provider",
          pricePerRow: 0.3,
          addColumns: [{ id: "emailStatus", label: "EMAIL STATUS", kind: "enrich" }],
        },
      ],
      cleanup: [
        {
          id: "norm_name",
          title: "Normalize First & Last Name",
          subtitle: "Cleanup formatting for names",
          pricePerRow: 0.1,
        },
        {
          id: "norm_company",
          title: "Normalize Company Name",
          subtitle: "Cleanup company name formatting",
          pricePerRow: 0.1,
        },
        {
          id: "norm_domain",
          title: "Normalize Company Domain",
          subtitle: "Cleanup company domain formatting",
          pricePerRow: 0.1,
          addColumns: [{ id: "companyDomain", label: "COMPANY DOMAIN", kind: "enrich" }],
        },
      ],
    };
  }, []);

  const targetRowIds = useMemo(() => {
    // In Snov, typically bulk actions apply to selected rows; if none selected — treat as disabled.
    return Array.from(selectedIds);
  }, [selectedIds]);

  const estimatedCost = useMemo(() => {
    if (!pickedAction) return 0;
    const per = pickedAction.pricePerRow ?? 0;
    return per * (targetRowIds.length || 0);
  }, [pickedAction, targetRowIds.length]);

  function ensureColumns(action) {
    if (!action?.addColumns?.length) return;
    setColumns((prev) => {
      const exists = new Set(prev.map((c) => c.id));
      const additions = action.addColumns
        .filter((c) => !exists.has(c.id))
        .map((c) => ({ ...c, deletable: !baseColumns.find((b) => b.id === c.id) }));
      if (additions.length === 0) return prev;
      return [...prev, ...additions];
    });
  }

  function scrollTableToRightSoon() {
    // after column added, scroll to the far right
    requestAnimationFrame(() => {
      const el = tableScrollRef.current;
      if (!el) return;
      el.scrollLeft = el.scrollWidth;
    });
  }

  function openCatalog() {
    if (selectedCount === 0) {
      toast("Select at least 1 prospect to run enrichment.");
      return;
    }
    setCatalogOpen(true);
    setCategory("person");
    setPickedAction(null);
  }

  function pickAction(action) {
    setPickedAction(action);
    if (action?.isAI) {
      // open AI panel style from Instantly
      setAiPanelOpen(true);
      setCatalogOpen(false);
    } else {
      setConfirmOpen(true);
    }
  }

  // simple toast
  const [toastMsg, setToastMsg] = useState("");
  const toastTimer = useRef(null);
  function toast(msg) {
    setToastMsg(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(""), 2500);
  }

  // AI panel state
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiOutputCol, setAiOutputCol] = useState("AI Output");
  const [aiNewColName, setAiNewColName] = useState("");
  const [aiMode, setAiMode] = useState("prompt"); // prompt | web | email
  const [aiCreatingNewCol, setAiCreatingNewCol] = useState(true);

  const aiExistingOutputCols = useMemo(() => {
    // allow output to any non-hidden column (including dynamic). We'll also offer create new.
    return columns.map((c) => c.label);
  }, [columns]);

  function addAIColumn(label) {
    const id = `ai_${label.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_${Date.now()}`;
    setColumns((prev) => [...prev, { id, label, kind: "ai", deletable: true }]);
    return id;
  }

  async function runAction(action, options = {}) {
    if (!action) return;

    const count = targetRowIds.length;
    if (count === 0) {
      toast("Select at least 1 prospect.");
      return;
    }

    const cost = (action.pricePerRow ?? 0) * count;
    if (credits < cost) {
      setBuyOpen(true);
      return;
    }

    // add columns up-front to show right scroll
    ensureColumns(action);

    setConfirmOpen(false);
    setAiPanelOpen(false);
    setRunOpen(true);
    setRunProgress(0);
    setRunLog([]);
    setRunSummary(null);

    // spend credits
    setCredits((c) => Math.max(0, +(c - cost).toFixed(2)));

    // simulate progress + per-row results
    const ids = targetRowIds;

    // for Work email: simulate waterfall providers log
    const isWorkEmail = action.id === "work_email";

    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const pct = Math.round(((i + 1) / ids.length) * 100);
      setRunProgress(pct);

      if (isWorkEmail) {
        setRunLog((prev) => [
          ...prev,
          `Row ${i + 1}/${ids.length}: trying providers…`,
        ]);
        // simulate a couple provider attempts
        const tries = 1 + Math.floor(Math.random() * 3);
        for (let t = 0; t < tries; t++) {
          const prov = PROVIDERS[(i + t) % PROVIDERS.length];
          await simulateWait(180);
          setRunLog((prev) => [...prev, `  • ${prov}: ${(Math.random() > 0.35) ? "no match" : "match found"}`]);
        }
      }

      await simulateWait(220);

      setRows((prev) =>
        prev.map((r) => {
          if (r.id !== id) return r;

          // result distribution
          const roll = Math.random();
          const status = roll < 0.7 ? "success" : roll < 0.9 ? "partial" : "failed";

          if (action.id === "work_email") {
            // if already has email -> maybe keep; else add workEmail
            if (status === "failed") return { ...r, enrichment_state: "failed_work_email" };
            const domain = normalizeDomain(r.companyDomain || `${r.company}`) || "company.com";
            const we =
              r.workEmail ||
              `${(r.firstName || "name").toLowerCase()}.${(r.lastName || "surname").toLowerCase()}@${domain.replace(/^\./, "")}`;
            return { ...r, workEmail: we, enrichment_state: status };
          }

          if (action.id === "full_profile") {
            if (status === "failed") return { ...r, enrichment_state: "failed_profile" };
            const phone = r.phone || `+1 (555) ${Math.floor(1000000 + Math.random() * 8999999)}`;
            const industry = r.industry || randomChoice(["Software", "FinTech", "Healthcare", "E-commerce", "Education"]);
            const seniority = r.seniority || randomChoice(["IC", "Manager", "Director", "VP", "C-level"]);
            const linkedin = r.linkedin || `linkedin.com/in/${r.firstName.toLowerCase()}-${r.lastName.toLowerCase()}`;
            const location = r.location || randomChoice(["Austin, TX", "NYC, USA", "London, UK", "Berlin, DE"]);
            return { ...r, phone, industry, seniority, linkedin, location, enrichment_state: status };
          }

          if (action.id === "job_listings") {
            if (status === "failed") return { ...r, enrichment_state: "failed_job_listings" };
            const jl = `${randomChoice([0, 2, 5, 9, 14, 26])} open roles`;
            return { ...r, jobListings: jl, enrichment_state: status };
          }

          if (action.id === "news") {
            if (status === "failed") return { ...r, enrichment_state: "failed_news" };
            const news = randomChoice([
              "New product launch mentioned by TechPress",
              "Hiring spike reported in local media",
              "Partnership announced with a major vendor",
            ]);
            return { ...r, companyNews: news, enrichment_state: status };
          }

          if (action.id === "funding") {
            if (status === "failed") return { ...r, enrichment_state: "failed_funding" };
            const ft = randomChoice(["Bootstrapped", "Seed", "Series A", "Series B", "Public"]);
            return { ...r, fundingType: ft, enrichment_state: status };
          }

          if (action.id === "verify_imported") {
            const baseEmail = r.emails?.[0] || r.workEmail || "";
            if (!baseEmail) return { ...r, emailStatus: "No email", enrichment_state: "skipped" };
            const st = randomChoice(["Verified", "Risky", "Invalid"]);
            return { ...r, emailStatus: st, enrichment_state: "verified" };
          }

          if (action.id === "norm_name") {
            return {
              ...r,
              firstName: normalizeName(r.firstName),
              lastName: normalizeName(r.lastName),
              enrichment_state: "normalized",
            };
          }

          if (action.id === "norm_company") {
            return {
              ...r,
              company: normalizeName(r.company),
              enrichment_state: "normalized",
            };
          }

          if (action.id === "norm_domain") {
            return {
              ...r,
              companyDomain: normalizeDomain(r.companyDomain || r.company),
              enrichment_state: "normalized",
            };
          }

          return r;
        })
      );
    }

    // summary
    const summary = { total: ids.length, success: 0, partial: 0, failed: 0 };
    rows.forEach(() => {}); // no-op
    // compute from current rows (after updates may not be immediate; do a best effort)
    // We'll approximate based on random distribution for UX.
    summary.success = Math.round(ids.length * 0.7);
    summary.partial = Math.round(ids.length * 0.2);
    summary.failed = Math.max(0, ids.length - summary.success - summary.partial);

    setRunSummary(summary);
    setRunLog((prev) => [...prev, "Done."]);
    scrollTableToRightSoon();
  }

  async function runAI() {
    const count = targetRowIds.length;
    if (count === 0) {
      toast("Select at least 1 prospect.");
      return;
    }

    // price based on selected AI action or mode
    const per = pickedAction?.pricePerRow ?? (aiMode === "prompt" ? 1.0 : 1.2);
    const cost = per * count;

    if (credits < cost) {
      setBuyOpen(true);
      return;
    }

    setCredits((c) => Math.max(0, +(c - cost).toFixed(2)));

    // choose output column id
    let outColId = null;
    let outColLabel = aiOutputCol;

    if (aiCreatingNewCol) {
      const label = (aiNewColName || "AI Output").trim();
      outColLabel = label;
      outColId = addAIColumn(label);
    } else {
      // map label -> column id (first match)
      const c = columns.find((x) => x.label === aiOutputCol);
      if (!c) {
        outColId = addAIColumn(aiOutputCol);
      } else {
        outColId = c.id;
      }
    }

    // ensure visible
    setHiddenCols((prev) => {
      const next = new Set(prev);
      next.delete(outColId);
      return next;
    });

    setRunOpen(true);
    setRunProgress(0);
    setRunLog([]);
    setRunSummary(null);
    setAiPanelOpen(false);

    for (let i = 0; i < targetRowIds.length; i++) {
      const id = targetRowIds[i];
      setRunProgress(Math.round(((i + 1) / targetRowIds.length) * 100));
      await simulateWait(220);

      setRows((prev) =>
        prev.map((r) => {
          if (r.id !== id) return r;

          const { full } = formatProspectCell(r);
          const vars = {
            first_name: r.firstName,
            last_name: r.lastName,
            full_name: full,
            company: r.company,
            title: r.title,
            location: r.location,
            linkedin: r.linkedin,
            email: r.emails?.[0] || r.workEmail || "",
          };

          let text = "";
          if (aiMode === "web") {
            text = `Web research: ${vars.company} — ${randomChoice([
              "key product: enterprise SaaS",
              "recent mention: partnership",
              "signal: hiring growth",
            ])}`;
          } else if (aiMode === "email") {
            text = `Subject: Quick question, ${vars.first_name}\n\nHi ${vars.first_name},\n\nNoticed ${vars.company} is growing. ${randomChoice([
              "Would it make sense to share a quick idea on improving outbound efficiency?",
              "Can I send a 2-minute note on a workflow that could save time for your team?",
              "Open to a short chat this week?",
            ])}\n\nBest,\nDenys`;
          } else {
            // prompt mode: do minimal template expansion
            const prompt = (aiPrompt || "Write 1-line personalization for {{company}}").trim();
            text = prompt
              .replaceAll("{{first_name}}", vars.first_name || "")
              .replaceAll("{{last_name}}", vars.last_name || "")
              .replaceAll("{{full_name}}", vars.full_name || "")
              .replaceAll("{{company}}", vars.company || "")
              .replaceAll("{{title}}", vars.title || "")
              .replaceAll("{{location}}", vars.location || "")
              .replaceAll("{{linkedin}}", vars.linkedin || "")
              .replaceAll("{{email}}", vars.email || "");
            // add some "model output" flavor
            text = `${text}${text.endsWith(".") ? "" : "."} (${randomChoice(["Relevant", "Concise", "Friendly"])})`;
          }

          return { ...r, [outColId]: text, enrichment_state: "ai_generated" };
        })
      );

      setRunLog((prev) => [...prev, `Generated for row ${i + 1}/${targetRowIds.length}`]);
    }

    setRunSummary({ total: targetRowIds.length, success: targetRowIds.length, partial: 0, failed: 0 });
    scrollTableToRightSoon();
  }

  function addOrShowColumn(colId, label, kind = "enrich") {
    setColumns((prev) => {
      if (prev.some((c) => c.id === colId)) return prev;
      return [...prev, { id: colId, label, kind, deletable: true }];
    });
    setHiddenCols((prev) => {
      const next = new Set(prev);
      next.delete(colId);
      return next;
    });
    scrollTableToRightSoon();
  }

  function toggleHide(colId) {
    setHiddenCols((prev) => {
      const next = new Set(prev);
      if (next.has(colId)) next.delete(colId);
      else next.add(colId);
      return next;
    });
  }

  function deleteColumn(colId) {
    setColumns((prev) => prev.filter((c) => c.id !== colId));
    setHiddenCols((prev) => {
      const next = new Set(prev);
      next.delete(colId);
      return next;
    });
    // remove data from rows (optional)
    setRows((prev) =>
      prev.map((r) => {
        const copy = { ...r };
        if (colId in copy) delete copy[colId];
        return copy;
      })
    );
  }

  // default: show company domain column once to demonstrate hide/delete
  useEffect(() => {
    addOrShowColumn("companyDomain", "COMPANY DOMAIN", "enrich");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ====== UI ======
  const visibleColumns = useMemo(() => {
    return columns.filter((c) => !hiddenCols.has(c.id));
  }, [columns, hiddenCols]);

  const selectedRowsPreview = useMemo(() => {
    const ids = new Set(targetRowIds);
    return rows.filter((r) => ids.has(r.id));
  }, [rows, targetRowIds]);

  function openConfirm(action) {
    setPickedAction(action);
    setConfirmOpen(true);
  }

  function openBuy() {
    setBuyOpen(true);
  }

  function simulateFastSpringPurchase(pack) {
    // UI simulation — no real integration
    const add = pack === "small" ? 50 : pack === "medium" ? 200 : 600;
    setCredits((c) => c + add);
    setBuyOpen(false);
    toast(`Purchased +${add} e-credits (simulation).`);
  }

  // catalog rendering helpers
  const categoryMeta = [
    { id: "person", label: "Enrich Person Info", icon: "👤" },
    { id: "company", label: "Enrich Company Info", icon: "🏢" },
    { id: "ai", label: "AI", icon: "✨" },
    { id: "verification", label: "Verification", icon: "✅" },
    { id: "cleanup", label: "Data Cleanup", icon: "🧹" },
  ];

  const items = catalog[category] || [];

  return (
    <div className="app">
      <style>{styles}</style>

      {/* Left purple nav */}
      <aside className="leftNav">
        <div className="brand">Snov<span className="brandDot">io</span></div>

        <div className="navGroup">
          <div className="navItem active">Prospects</div>
          <div className="navItem">Companies</div>
        </div>

        <div className="navFooter">
          <button className="upgradeBtn">★ Upgrade plan</button>
        </div>
      </aside>

      {/* Main */}
      <div className="main">
        {/* Top bar */}
        <div className="topbar">
          <div className="topbarLeft">
            <div className="topLink active">Leads</div>
            <div className="topLink">Finder</div>
            <div className="topLink">Verifier</div>
            <div className="topLink">Deliverability</div>
            <div className="topLink">Campaigns</div>
            <div className="topLink">LinkedIn</div>
            <div className="topLink">Unibox</div>
            <div className="topLink">AI Studio</div>
            <div className="topLink">CRM</div>
            <div className="topLink">Extensions</div>
          </div>

          <div className="topbarRight">
            <div className="creditPill" title="e-credits balance">
              <span className="coin">🪙</span>
              <span>{money(credits)}</span>
            </div>
            <button className="topIconBtn" title="Search">🔎</button>
            <button className="topIconBtn" title="Notifications">🔔</button>
            <div className="avatar">DK</div>
          </div>
        </div>

        {/* Promo bar */}
        <div className="promo">
          <span className="promoBadge">🏅</span>
          <span>Turn prospects into profits — unlock more tools to drive your sales.</span>
          <button className="btn btn-light">Upgrade now</button>
        </div>

        {/* Content split: lists panel + table */}
        <div className="content">
          {/* Lists panel */}
          <section className="listsPanel">
            <div className="listsHeader">
              <div className="listsTitle">Prospects</div>
              <div className="listsIcons">
                <button className="iconBtn" title="Settings">☰</button>
                <button className="iconBtn" title="Create list">＋</button>
              </div>
            </div>

            <div className="listsSearch">
              <input
                className="input"
                placeholder="Search"
                value={""}
                onChange={() => {}}
                disabled
              />
            </div>

            <div className="lists">
              {lists.map((l) => (
                <button
                  key={l.name}
                  className={classNames("listItem", l.name === activeList && "listItemActive")}
                  onClick={() => setActiveList(l.name)}
                >
                  <span className="listName">{l.name}</span>
                  <span className="listCount">{l.count}</span>
                </button>
              ))}
            </div>

            <button className="createList">＋ Create new list</button>

            <div className="listsSectionTitle">Campaigns</div>
          </section>

          {/* Main panel */}
          <section className="panel">
            <div className="panelHeader">
              <div className="panelTitle">{activeList}</div>

              <div className="toolbar">
                <button className="btn btn-primary">
                  <span className="btnIcon">＋</span> Add prospects <span className="caret">▾</span>
                </button>

                <button className="btn btn-ghost">Verify emails</button>
                <button className="btn btn-ghost">Send campaign</button>

                {/* REQUIRED: Enrich button after send campaigns */}
                <button className="btn btn-gradient" onClick={openCatalog}>
                  ✨ Enrich &amp; AI
                </button>

                <button className="btn btn-ghost">⋯</button>

                <div className="toolbarRight">
                  <div className="pill">● 141</div>
                  <div className="pill">● 10</div>
                  <div className="pill">● 13568</div>
                  <div className="pill">● 334</div>
                  <div className="pill">● 778</div>
                  <div className="pill">in 14614</div>
                  <div className="pill">li 186</div>
                </div>
              </div>

              <div className="subToolbar">
                <div className="subLeft">
                  <div className="searchBox">
                    <span className="searchIcon">🔎</span>
                    <input
                      className="searchInput"
                      placeholder="Search..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </div>

                  <button className="btn btn-light">Filters ▾</button>
                </div>

                <div className="subRight">
                  <button className="btn btn-light">No sort ▾</button>

                  <div className="popoverWrap">
                    <button className="btn btn-light" onClick={() => setColumnsOpen((v) => !v)}>
                      Columns ▾
                    </button>
                    {columnsOpen && (
                      <div className="popover" onMouseLeave={() => setColumnsOpen(false)}>
                        <div className="popoverTitle">Manage columns</div>
                        <div className="popoverHint">
                          Hide/show columns. Delete only added ones.
                        </div>
                        <div className="popoverList">
                          {columns.map((c) => (
                            <div key={c.id} className="colRow">
                              <label className="colCheck">
                                <input
                                  type="checkbox"
                                  checked={!hiddenCols.has(c.id)}
                                  onChange={() => toggleHide(c.id)}
                                />
                                <span className="colLabel">{c.label}</span>
                              </label>
                              <div className="colMeta">
                                <Badge tone={c.kind === "ai" ? "purple" : c.kind === "enrich" ? "blue" : "gray"}>
                                  {c.kind.toUpperCase()}
                                </Badge>
                                {c.deletable ? (
                                  <button className="linkDanger" onClick={() => deleteColumn(c.id)}>
                                    Delete
                                  </button>
                                ) : (
                                  <span className="mutedSmall">Fixed</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="popoverFooter">
                          <button
                            className="btn btn-light"
                            onClick={() => {
                              // demo: add a sample column
                              addOrShowColumn("custom_note", "CUSTOM NOTE", "ai");
                            }}
                          >
                            + Add demo column
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <button className="btn btn-light">Actions ▾</button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="tableWrap" ref={tableScrollRef}>
              <table className="table">
                <thead>
                  <tr>
                    <th className="th thCheck">
                      <label className="check">
                        <input
                          type="checkbox"
                          checked={allVisibleSelected}
                          onChange={toggleSelectAllVisible}
                        />
                      </label>
                    </th>
                    {visibleColumns.map((c) => (
                      <th key={c.id} className="th">
                        <div className="thInner">
                          <span>{c.label}</span>
                          <span className="thSort">▾</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {filteredRows.map((r, idx) => {
                    const { full, subtitle } = formatProspectCell(r);
                    const checked = selectedIds.has(r.id);

                    return (
                      <tr key={r.id} className={classNames("tr", checked && "trSelected")}>
                        <td className="td tdCheck">
                          <label className="check">
                            <input type="checkbox" checked={checked} onChange={() => toggleRow(r.id)} />
                          </label>
                        </td>

                        {visibleColumns.map((c) => {
                          // base fields mapping:
                          if (c.id === "prospect") {
                            return (
                              <td key={c.id} className="td">
                                <div className="prospectCell">
                                  <div className="prospectName">{full}</div>
                                  <div className="prospectMeta">{subtitle}</div>
                                </div>
                              </td>
                            );
                          }
                          if (c.id === "emails") {
                            const email = r.emails?.[0] || r.workEmail || "";
                            const tone = email ? "green" : "gray";
                            return (
                              <td key={c.id} className="td">
                                <div className="emailCell">
                                  <IconDot tone={email ? "green" : "gray"} />
                                  <span className={classNames("mono", !email && "muted")}>
                                    {email || "—"}
                                  </span>
                                </div>
                              </td>
                            );
                          }
                          if (c.id === "tags") {
                            return (
                              <td key={c.id} className="td">
                                <div className="tagRow">
                                  {r.tags?.length ? (
                                    r.tags.map((t) => <Badge key={t} tone="gray">{t}</Badge>)
                                  ) : (
                                    <span className="muted">—</span>
                                  )}
                                  {r.enrichment_state ? (
                                    <Badge
                                      tone={
                                        r.enrichment_state.includes("failed")
                                          ? "red"
                                          : r.enrichment_state === "partial"
                                          ? "amber"
                                          : r.enrichment_state === "success"
                                          ? "green"
                                          : r.enrichment_state.includes("ai")
                                          ? "purple"
                                          : "blue"
                                      }
                                      title="Last run state (demo)"
                                    >
                                      {String(r.enrichment_state).replaceAll("_", " ").toUpperCase()}
                                    </Badge>
                                  ) : null}
                                </div>
                              </td>
                            );
                          }
                          if (c.id === "added") {
                            return (
                              <td key={c.id} className="td">
                                <span className="muted">{r.added}</span>
                              </td>
                            );
                          }

                          // dynamic columns: show content
                          const val = r[c.id];
                          return (
                            <td key={c.id} className="td">
                              {typeof val === "string" && val.includes("\n") ? (
                                <pre className="pre">{val}</pre>
                              ) : val ? (
                                <span className={c.kind === "ai" ? "aiText" : ""}>{String(val)}</span>
                              ) : (
                                <span className="muted">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}

                  {filteredRows.length === 0 && (
                    <tr>
                      <td className="td" colSpan={1 + visibleColumns.length}>
                        <div className="empty">
                          <div className="emptyTitle">No prospects found</div>
                          <div className="emptyHint">Try another search query.</div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="tableFooter">
              <div className="mutedSmall">
                Selected: <b>{selectedCount}</b> • Visible rows: <b>{filteredRows.length}</b>
              </div>
              <div className="pager">
                <button className="btn btn-light">1</button>
                <button className="btn btn-light">2</button>
                <button className="btn btn-light">3</button>
                <span className="mutedSmall">…</span>
                <button className="btn btn-light">296</button>
                <button className="btn btn-light">Load 50 more</button>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Toast */}
      {toastMsg && <div className="toast">{toastMsg}</div>}

      {/* Catalog modal */}
      <Modal
        open={catalogOpen}
        title="Choose an enrichment to add"
        onClose={() => setCatalogOpen(false)}
        width={980}
      >
        <div className="catalog">
          <div className="catalogLeft">
            <div className="catalogTab">Discover</div>

            <div className="catList">
              {categoryMeta.map((m) => (
                <button
                  key={m.id}
                  className={classNames("catItem", m.id === category && "catItemActive")}
                  onClick={() => setCategory(m.id)}
                >
                  <span className="catIcon">{m.icon}</span>
                  <span className="catLabel">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="catalogRight">
            <div className="catalogHint">
              Selected rows: <b>{selectedCount}</b> • Credits: <b>{money(credits)}</b>
            </div>

            <div className="grid">
              {items.map((it) => (
                <div key={it.id} className="card">
                  <div className="cardTop">
                    <div>
                      <div className="cardTitle">{it.title}</div>
                      <div className="cardSub">{it.subtitle}</div>
                    </div>
                    <div className="pricePill">
                      <span className="coin">🪙</span>
                      <span>{money(it.pricePerRow)} / row</span>
                    </div>
                  </div>

                  {it.tags?.length ? (
                    <div className="providerRow">
                      {it.tags.map((p) => (
                        <Badge key={p} tone="blue">{p}</Badge>
                      ))}
                    </div>
                  ) : null}

                  {it.addColumns?.length ? (
                    <div className="cardMeta">
                      Adds columns:{" "}
                      {it.addColumns.map((c) => (
                        <Badge key={c.id} tone="gray">{c.label}</Badge>
                      ))}
                    </div>
                  ) : null}

                  <div className="cardFooter">
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        setPickedAction(it);
                        if (it.isAI) {
                          setAiMode(it.mode || "prompt");
                          setAiPanelOpen(true);
                          setCatalogOpen(false);
                        } else {
                          setConfirmOpen(true);
                        }
                      }}
                    >
                      Select
                    </button>
                    <button className="btn btn-light" onClick={() => toast("Demo: details page not implemented")}>
                      Details
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {!items.length && <div className="muted">No items in this category (demo).</div>}
          </div>
        </div>
      </Modal>

      {/* Confirm modal */}
      <Modal
        open={confirmOpen}
        title={pickedAction ? `Confirm: ${pickedAction.title}` : "Confirm"}
        onClose={() => setConfirmOpen(false)}
        width={720}
      >
        <div className="confirm">
          <div className="confirmRow">
            <div className="confirmLabel">Selected rows</div>
            <div className="confirmValue">{selectedCount}</div>
          </div>
          <div className="confirmRow">
            <div className="confirmLabel">Price per row</div>
            <div className="confirmValue">🪙 {money(pickedAction?.pricePerRow ?? 0)}</div>
          </div>
          <div className="confirmRow">
            <div className="confirmLabel">Estimated cost</div>
            <div className="confirmValue strong">🪙 {money(estimatedCost)}</div>
          </div>
          <div className="confirmRow">
            <div className="confirmLabel">Your balance</div>
            <div className="confirmValue">🪙 {money(credits)}</div>
          </div>

          {credits < estimatedCost ? (
            <div className="alert alert-warn">
              Not enough e-credits. Buy credits to continue.
            </div>
          ) : (
            <div className="alert alert-ok">
              Ready to run. This is a demo simulation (no real data changes).
            </div>
          )}

          <div className="confirmActions">
            <button className="btn btn-light" onClick={() => setConfirmOpen(false)}>
              Cancel
            </button>

            {credits < estimatedCost ? (
              <button className="btn btn-primary" onClick={openBuy}>
                Buy e-credits
              </button>
            ) : (
              <button className="btn btn-primary" onClick={() => runAction(pickedAction)}>
                Run enrichment
              </button>
            )}
          </div>
        </div>
      </Modal>

      {/* AI Panel (Instantly-like side panel) */}
      <div className={classNames("aiPanel", aiPanelOpen && "aiPanelOpen")}>
        <div className="aiHeader">
          <div>
            <div className="aiTitle">AI Prompts</div>
            <div className="aiTabs">
              <button className={classNames("aiTab", aiMode === "prompt" && "aiTabActive")} onClick={() => setAiMode("prompt")}>
                Write AI Prompt
              </button>
              <button className={classNames("aiTab", aiMode === "web" && "aiTabActive")} onClick={() => setAiMode("web")}>
                Web agent
              </button>
              <button className={classNames("aiTab", aiMode === "email" && "aiTabActive")} onClick={() => setAiMode("email")}>
                Email agent
              </button>
            </div>
          </div>
          <button className="iconBtn" onClick={() => setAiPanelOpen(false)} aria-label="Close AI panel">✕</button>
        </div>

        <div className="aiBody">
          <div className="aiBlock">
            <div className="aiLabel">Prompt</div>
            <textarea
              className="textarea"
              rows={6}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder={
                aiMode === "email"
                  ? "Write your email instruction here. Use {{first_name}}, {{company}}, etc."
                  : aiMode === "web"
                  ? "What to research about {{company}}?"
                  : "Write your prompt. Use {{first_name}}, {{company}}, {{title}}, {{location}}, {{linkedin}}, {{email}}"
              }
            />
            <div className="aiHint">
              Variables: <code>{"{{first_name}}"}</code> <code>{"{{last_name}}"}</code> <code>{"{{company}}"}</code>{" "}
              <code>{"{{title}}"}</code> <code>{"{{location}}"}</code> <code>{"{{linkedin}}"}</code> <code>{"{{email}}"}</code>
            </div>
          </div>

          <div className="aiBlock">
            <div className="aiLabel">Output Column</div>
            <div className="rowGap">
              <label className="radioRow">
                <input
                  type="radio"
                  checked={aiCreatingNewCol}
                  onChange={() => setAiCreatingNewCol(true)}
                />
                <span>Create new column</span>
              </label>
              {aiCreatingNewCol && (
                <input
                  className="input"
                  placeholder="New column name (e.g., Personalization)"
                  value={aiNewColName}
                  onChange={(e) => setAiNewColName(e.target.value)}
                />
              )}

              <label className="radioRow">
                <input
                  type="radio"
                  checked={!aiCreatingNewCol}
                  onChange={() => setAiCreatingNewCol(false)}
                />
                <span>Use existing column</span>
              </label>

              {!aiCreatingNewCol && (
                <select className="select" value={aiOutputCol} onChange={(e) => setAiOutputCol(e.target.value)}>
                  {aiExistingOutputCols.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="aiBlock">
            <div className="aiLabel">Cost</div>
            <div className="aiCostRow">
              <span>Selected rows:</span> <b>{selectedCount}</b>
            </div>
            <div className="aiCostRow">
              <span>Estimated credits:</span>{" "}
              <b>🪙 {money((aiMode === "prompt" ? 1.0 : 1.2) * selectedCount)}</b>
            </div>
            <div className="aiCostRow">
              <span>Balance:</span> <b>🪙 {money(credits)}</b>
            </div>
          </div>

          <div className="aiActions">
            <button className="btn btn-light" onClick={() => setAiPanelOpen(false)}>
              Cancel
            </button>

            {credits < (aiMode === "prompt" ? 1.0 : 1.2) * selectedCount ? (
              <button className="btn btn-primary" onClick={openBuy}>
                Buy e-credits
              </button>
            ) : (
              <button
                className="btn btn-primary"
                onClick={() => {
                  // pick pseudo action for logging
                  setPickedAction({ id: "ai", pricePerRow: aiMode === "prompt" ? 1.0 : 1.2 });
                  runAI();
                }}
              >
                Generate
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Run modal */}
      <Modal
        open={runOpen}
        title="Running…"
        onClose={() => setRunOpen(false)}
        width={760}
      >
        <div className="run">
          <div className="runTop">
            <div className="runMeta">
              <div className="mutedSmall">
                Operation: <b>{pickedAction?.title || pickedAction?.id || "—"}</b>
              </div>
              <div className="mutedSmall">
                Rows: <b>{selectedCount}</b> • Balance: <b>🪙 {money(credits)}</b>
              </div>
            </div>
            <div className="runPct">{runProgress}%</div>
          </div>

          <ProgressBar value={runProgress} />

          <div className="runLog">
            {runLog.length ? (
              runLog.slice(-16).map((l, i) => (
                <div key={i} className="runLine">
                  {l}
                </div>
              ))
            ) : (
              <div className="muted">Preparing…</div>
            )}
          </div>

          {runSummary && (
            <div className="summary">
              <Badge tone="green">Success: {runSummary.success}</Badge>
              <Badge tone="amber">Partial: {runSummary.partial}</Badge>
              <Badge tone="red">Failed: {runSummary.failed}</Badge>
              <Badge tone="gray">Total: {runSummary.total}</Badge>
            </div>
          )}

          <div className="confirmActions">
            <button className="btn btn-light" onClick={() => setRunOpen(false)}>
              Close
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                // after run, auto-scroll for analysis
                scrollTableToRightSoon();
                toast("Scrolled to the newest columns.");
              }}
            >
              Scroll to new columns
            </button>
          </div>
        </div>
      </Modal>

      {/* Buy credits modal */}
      <Modal
        open={buyOpen}
        title="Buy e-credits (FastSpring simulation)"
        onClose={() => setBuyOpen(false)}
        width={720}
      >
        <div className="buy">
          <div className="buyHint">
            This is a clickable demo. No real checkout is performed.
          </div>

          <div className="buyGrid">
            <div className="buyCard">
              <div className="buyTitle">Starter pack</div>
              <div className="buyCredits">+50 e-credits</div>
              <div className="buyPrice">$9 (demo)</div>
              <button className="btn btn-primary" onClick={() => simulateFastSpringPurchase("small")}>
                Pay with FastSpring
              </button>
            </div>

            <div className="buyCard">
              <div className="buyTitle">Growth pack</div>
              <div className="buyCredits">+200 e-credits</div>
              <div className="buyPrice">$29 (demo)</div>
              <button className="btn btn-primary" onClick={() => simulateFastSpringPurchase("medium")}>
                Pay with FastSpring
              </button>
            </div>

            <div className="buyCard">
              <div className="buyTitle">Pro pack</div>
              <div className="buyCredits">+600 e-credits</div>
              <div className="buyPrice">$69 (demo)</div>
              <button className="btn btn-primary" onClick={() => simulateFastSpringPurchase("large")}>
                Pay with FastSpring
              </button>
            </div>
          </div>

          <div className="confirmActions">
            <button className="btn btn-light" onClick={() => setBuyOpen(false)}>
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

const styles = `
:root{
  --purple:#6a55ea;
  --purple-2:#7c68ff;
  --bg:#f6f7fb;
  --panel:#ffffff;
  --line:#e6e8f0;
  --text:#1e2430;
  --muted:#6c7486;
  --shadow:0 12px 30px rgba(16,24,40,.12);
  --radius:14px;
  --radius2:12px;
  --btn:#f2f4f8;
  --btnText:#2a3243;
  --green:#16a34a;
  --red:#ef4444;
  --amber:#f59e0b;
  --blue:#2563eb;
}

*{box-sizing:border-box}
html,body{height:100%}
body{margin:0;font-family:Inter,system-ui,Segoe UI,Roboto,Arial,sans-serif;color:var(--text);background:var(--bg)}
code{background:#eef2ff;padding:2px 6px;border-radius:8px}

.app{display:flex;min-height:100vh}

.leftNav{
  width:230px;background:var(--purple);color:white;display:flex;flex-direction:column;
  padding:18px 14px;gap:16px
}
.brand{font-weight:800;font-size:28px;letter-spacing:.2px}
.brandDot{font-weight:700;opacity:.9;font-size:16px;margin-left:2px}
.navGroup{display:flex;flex-direction:column;gap:8px;margin-top:6px}
.navItem{
  text-align:left;border:0;background:transparent;color:white;
  padding:12px 12px;border-radius:12px;opacity:.9;cursor:pointer;
}
.navItem:hover{background:rgba(255,255,255,.08)}
.navItem.active{background:rgba(255,255,255,.14);opacity:1}
.navFooter{margin-top:auto}
.upgradeBtn{
  width:100%;border:0;background:rgba(0,0,0,.16);color:white;
  padding:11px 12px;border-radius:12px;cursor:pointer;font-weight:650
}
.upgradeBtn:hover{background:rgba(0,0,0,.22)}

.main{flex:1;display:flex;flex-direction:column;min-width:0}

.topbar{
  height:56px;background:var(--panel);border-bottom:1px solid var(--line);
  display:flex;align-items:center;justify-content:space-between;padding:0 14px;gap:12px;
}
.topbarLeft{display:flex;gap:16px;align-items:center;min-width:0;overflow:auto}
.topLink{font-size:13px;color:var(--muted);white-space:nowrap;cursor:pointer}
.topLink.active{color:var(--text);font-weight:650}
.topbarRight{display:flex;align-items:center;gap:10px}
.topIconBtn{
  border:1px solid var(--line);background:white;border-radius:12px;padding:8px 10px;cursor:pointer
}
.avatar{
  width:34px;height:34px;border-radius:999px;background:#e5e7eb;color:#111827;
  display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px
}
.creditPill{
  display:flex;align-items:center;gap:8px;border:1px solid var(--line);background:#fff;
  padding:7px 10px;border-radius:999px;font-weight:700
}
.coin{filter:saturate(1.1)}
.promo{
  background:linear-gradient(90deg,#ffe6f0,#fff3d6);
  border-bottom:1px solid var(--line);
  padding:10px 14px;display:flex;align-items:center;gap:10px
}
.promoBadge{
  width:24px;height:24px;border-radius:8px;background:#fff;display:flex;align-items:center;justify-content:center
}

.content{display:flex;gap:0;min-height:0;flex:1}
.listsPanel{
  width:320px;background:var(--panel);border-right:1px solid var(--line);padding:14px;
  display:flex;flex-direction:column;gap:12px;min-height:0
}
.listsHeader{display:flex;justify-content:space-between;align-items:center}
.listsTitle{font-weight:800}
.listsIcons{display:flex;gap:6px}
.iconBtn{
  border:1px solid var(--line);background:white;border-radius:12px;padding:6px 10px;cursor:pointer
}
.listsSearch .input{width:100%}
.input,.select,.textarea{
  border:1px solid var(--line);border-radius:12px;padding:10px 12px;background:white;
  outline:none;font-size:14px
}
.textarea{width:100%;resize:vertical}
.lists{overflow:auto;min-height:0;border-top:1px solid transparent}
.listItem{
  width:100%;border:0;background:transparent;text-align:left;cursor:pointer;
  padding:10px 10px;border-radius:12px;display:flex;justify-content:space-between;align-items:center;
  color:var(--text)
}
.listItem:hover{background:#f3f4f6}
.listItemActive{background:#eef2ff}
.listName{max-width:230px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.listCount{color:var(--muted);font-weight:650}
.createList{
  border:0;background:transparent;color:var(--blue);cursor:pointer;text-align:left;padding:10px 4px
}
.listsSectionTitle{margin-top:6px;color:var(--muted);font-weight:700}

.panel{flex:1;min-width:0;display:flex;flex-direction:column}
.panelHeader{padding:14px 14px 0}
.panelTitle{font-size:18px;font-weight:800;margin-bottom:10px}
.toolbar{
  display:flex;align-items:center;gap:10px;flex-wrap:wrap
}
.toolbarRight{margin-left:auto;display:flex;gap:8px;flex-wrap:wrap}
.pill{
  border:1px solid var(--line);background:#fff;border-radius:999px;padding:7px 10px;color:var(--muted);font-weight:700;font-size:12px
}
.subToolbar{
  margin-top:10px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap
}
.subLeft,.subRight{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.searchBox{
  display:flex;align-items:center;gap:8px;border:1px solid var(--line);background:#fff;border-radius:999px;
  padding:8px 12px;min-width:320px
}
.searchInput{border:0;outline:none;font-size:14px;width:100%}
.searchIcon{opacity:.7}

.btn{
  border:1px solid var(--line);background:var(--btn);color:var(--btnText);
  border-radius:12px;padding:9px 12px;cursor:pointer;font-weight:650;font-size:13px
}
.btn:hover{filter:brightness(.98)}
.btn:active{transform:translateY(1px)}
.btn-primary{background:var(--purple);border-color:transparent;color:white}
.btn-ghost{background:#fff}
.btn-light{background:#fff}
.btn-gradient{
  background:linear-gradient(90deg,#2b6cb0,#7c3aed);
  border-color:transparent;color:white
}
.btnIcon{margin-right:6px}
.caret{opacity:.8;margin-left:6px}

.tableWrap{
  margin:14px; background:var(--panel); border:1px solid var(--line); border-radius:var(--radius);
  overflow:auto; min-height:0; box-shadow:0 1px 0 rgba(16,24,40,.02)
}
.table{border-collapse:separate;border-spacing:0;width:100%;min-width:980px}
.th{
  position:sticky;top:0;background:#fbfbfe;border-bottom:1px solid var(--line);
  font-size:12px;color:#525a6a;letter-spacing:.4px;padding:12px 12px;text-align:left;
  z-index:1
}
.thCheck{width:44px}
.thInner{display:flex;align-items:center;gap:8px}
.thSort{opacity:.5}
.tr{background:white}
.tr:hover{background:#fafbff}
.trSelected{background:#f1f5ff}
.td{border-bottom:1px solid var(--line);padding:12px 12px;vertical-align:top;font-size:13px}
.tdCheck{width:44px}
.check input{width:16px;height:16px}

.prospectCell{display:flex;flex-direction:column;gap:3px}
.prospectName{font-weight:750;color:#4f46e5;cursor:pointer}
.prospectMeta{color:var(--muted);font-size:12px}
.emailCell{display:flex;align-items:center;gap:8px}
.mono{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:12px}
.muted{color:var(--muted)}
.mutedSmall{color:var(--muted);font-size:12px}
.tagRow{display:flex;gap:8px;flex-wrap:wrap;align-items:center}

.dot{width:9px;height:9px;border-radius:999px;display:inline-block}
.dot-green{background:#22c55e}
.dot-gray{background:#cbd5e1}

.badge{
  font-size:11px;border-radius:999px;padding:5px 9px;border:1px solid var(--line);background:#fff;color:var(--muted);
  font-weight:700
}
.badge-green{border-color:rgba(34,197,94,.35);background:rgba(34,197,94,.10);color:#166534}
.badge-amber{border-color:rgba(245,158,11,.35);background:rgba(245,158,11,.12);color:#92400e}
.badge-red{border-color:rgba(239,68,68,.35);background:rgba(239,68,68,.10);color:#991b1b}
.badge-blue{border-color:rgba(37,99,235,.35);background:rgba(37,99,235,.10);color:#1e40af}
.badge-purple{border-color:rgba(124,58,237,.35);background:rgba(124,58,237,.10);color:#5b21b6}
.badge-gray{border-color:rgba(100,116,139,.30);background:rgba(100,116,139,.08);color:#334155}

.tableFooter{
  margin:0 14px 14px;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap
}
.pager{display:flex;gap:8px;align-items:center;flex-wrap:wrap}

.overlay{
  position:fixed;inset:0;background:rgba(16,24,40,.55);display:flex;align-items:center;justify-content:center;
  padding:22px;z-index:50
}
.modal{
  background:#fff;border-radius:18px;box-shadow:var(--shadow);border:1px solid rgba(255,255,255,.35);
  overflow:hidden;max-height:86vh;display:flex;flex-direction:column
}
.modalHeader{
  display:flex;justify-content:space-between;align-items:center;padding:16px 18px;border-bottom:1px solid var(--line)
}
.modalTitle{font-weight:850;font-size:18px}
.modalBody{padding:16px 18px;overflow:auto}

.catalog{display:grid;grid-template-columns:260px 1fr;gap:16px}
.catalogLeft{border-right:1px solid var(--line);padding-right:14px}
.catalogTab{color:#2563eb;font-weight:800;border-bottom:2px solid #2563eb;padding:6px 0;width:max-content}
.catList{margin-top:10px;display:flex;flex-direction:column;gap:8px}
.catItem{
  display:flex;align-items:center;gap:10px;border:1px solid transparent;background:#fff;border-radius:12px;padding:10px 10px;
  cursor:pointer;text-align:left
}
.catItem:hover{background:#f6f7ff}
.catItemActive{background:#eef2ff;border-color:#dbeafe}
.catIcon{width:26px;display:flex;justify-content:center}
.catLabel{font-weight:750}

.catalogRight{min-width:0}
.catalogHint{color:var(--muted);font-size:12px;margin-bottom:10px}
.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.card{
  border:1px solid var(--line);border-radius:16px;padding:14px;background:#fff;
  display:flex;flex-direction:column;gap:10px
}
.cardTop{display:flex;justify-content:space-between;gap:10px}
.cardTitle{font-weight:850}
.cardSub{color:var(--muted);font-size:12px;margin-top:2px}
.pricePill{
  border:1px solid var(--line);border-radius:999px;padding:6px 10px;display:flex;gap:8px;align-items:center;font-weight:800
}
.providerRow{display:flex;gap:8px;flex-wrap:wrap}
.cardMeta{color:var(--muted);font-size:12px;display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.cardFooter{display:flex;gap:8px;margin-top:auto}

.confirmRow{display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px dashed rgba(100,116,139,.25)}
.confirmLabel{color:var(--muted)}
.confirmValue{font-weight:750}
.strong{font-weight:900}
.alert{margin-top:12px;padding:10px 12px;border-radius:12px;border:1px solid var(--line);font-weight:700}
.alert-warn{background:rgba(245,158,11,.12);border-color:rgba(245,158,11,.30);color:#92400e}
.alert-ok{background:rgba(34,197,94,.10);border-color:rgba(34,197,94,.30);color:#166534}
.confirmActions{display:flex;justify-content:flex-end;gap:10px;margin-top:14px}

.progressWrap{height:10px;border-radius:999px;background:#eef2ff;overflow:hidden;border:1px solid rgba(99,102,241,.20)}
.progressBar{height:100%;background:linear-gradient(90deg,#2563eb,#7c3aed)}
.runTop{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}
.runPct{font-weight:900;font-size:18px}
.runLog{
  margin-top:12px;border:1px solid var(--line);border-radius:14px;padding:10px;background:#fbfbfe;min-height:140px;
  font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:12px;color:#384152;overflow:auto
}
.runLine{padding:2px 0}
.summary{margin-top:12px;display:flex;gap:8px;flex-wrap:wrap}

.buyHint{color:var(--muted);margin-bottom:12px}
.buyGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
.buyCard{border:1px solid var(--line);border-radius:16px;padding:14px;background:#fff;display:flex;flex-direction:column;gap:8px}
.buyTitle{font-weight:900}
.buyCredits{color:#2563eb;font-weight:900}
.buyPrice{color:var(--muted);font-weight:750;margin-bottom:8px}

.toast{
  position:fixed;bottom:18px;left:50%;transform:translateX(-50%);
  background:#111827;color:#fff;padding:10px 14px;border-radius:999px;box-shadow:0 10px 20px rgba(0,0,0,.25);
  z-index:60;font-weight:700;font-size:13px
}

/* popover */
.popoverWrap{position:relative}
.popover{
  position:absolute;top:44px;right:0;width:360px;background:#fff;border:1px solid var(--line);border-radius:16px;
  box-shadow:var(--shadow);padding:12px;z-index:20
}
.popoverTitle{font-weight:900}
.popoverHint{color:var(--muted);font-size:12px;margin-top:2px;margin-bottom:10px}
.popoverList{max-height:340px;overflow:auto;border-top:1px dashed rgba(100,116,139,.25);padding-top:10px}
.colRow{display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-bottom:1px dashed rgba(100,116,139,.18)}
.colCheck{display:flex;gap:10px;align-items:center}
.colLabel{font-weight:750}
.colMeta{display:flex;gap:8px;align-items:center}
.linkDanger{border:0;background:transparent;color:#dc2626;font-weight:900;cursor:pointer}
.popoverFooter{margin-top:10px;display:flex;justify-content:flex-end}

/* AI panel */
.aiPanel{
  position:fixed;top:0;right:-520px;height:100vh;width:520px;background:#fff;border-left:1px solid var(--line);
  box-shadow:var(--shadow);z-index:55;transition:right .18s ease;display:flex;flex-direction:column
}
.aiPanelOpen{right:0}
.aiHeader{padding:16px;border-bottom:1px solid var(--line);display:flex;justify-content:space-between;gap:10px}
.aiTitle{font-weight:950;font-size:18px}
.aiTabs{display:flex;gap:14px;margin-top:10px;flex-wrap:wrap}
.aiTab{
  border:0;background:transparent;color:var(--muted);cursor:pointer;font-weight:800;padding:6px 0
}
.aiTabActive{color:#2563eb;border-bottom:2px solid #2563eb}
.aiBody{padding:14px;overflow:auto;display:flex;flex-direction:column;gap:14px}
.aiBlock{border:1px solid var(--line);border-radius:16px;padding:12px;background:#fff}
.aiLabel{font-weight:900;margin-bottom:8px}
.aiHint{color:var(--muted);font-size:12px;margin-top:8px}
.rowGap{display:flex;flex-direction:column;gap:10px}
.radioRow{display:flex;gap:10px;align-items:center;color:var(--text);font-weight:750}
.aiActions{display:flex;justify-content:flex-end;gap:10px}
.aiCostRow{display:flex;justify-content:space-between;color:var(--muted);margin:6px 0}
.pre{margin:0;white-space:pre-wrap;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:12px;color:#0f172a}
.aiText{color:#5b21b6;font-weight:700}

/* Empty state */
.empty{padding:24px;text-align:center}
.emptyTitle{font-weight:900}
.emptyHint{color:var(--muted);margin-top:4px}
`;