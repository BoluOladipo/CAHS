import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { api, naira } from "./api";
import { useAuth } from "./auth";
import { Card } from "./shell";
import { calculatePlatformFee, applyLogisticsDiscount, SAVINGS_DISCLOSURES, LOAN_HISTORY_DISCLAIMER } from "@cahs/shared";

function useLoad<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    fn()
      .then(setData)
      .catch((e) => setErr((e as Error).message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return { data, err, reload: () => fn().then(setData) };
}

export function Home() {
  const { user } = useAuth();
  const roleActions: Record<string, { label: string; to: string; desc: string }[]> = {
    FARMER: [
      { label: "Business Financial Insights", to: "/app/insights", desc: "Breakdown of revenue, expenditure, loss tracking & AI growth plan" },
      { label: "AI Support & Triage", to: "/app/support", desc: "Two-stage resolution: guided steps & urgency-ranked bank escalation" },
      { label: "My Produce Listings", to: "/app/listings/mine", desc: "Publish crops and manage inventory" },
      { label: "Incoming Orders", to: "/app/orders", desc: "Accept or decline buyer purchase requests" },
      { label: "Book Warehouse Storage", to: "/app/storage", desc: "Reserve dry or cold storage at verified hubs" },
      { label: "Request Transport", to: "/app/logistics", desc: "Get quotes from verified haulage providers" },
      { label: "Agricultural Loans", to: "/app/loans", desc: "Apply for seasonal working capital with bank review" },
      { label: "Fixed-Term Savings", to: "/app/savings", desc: "Put harvest proceeds in projected-yield savings" },
    ],
    TRADER: [
      { label: "Business Financial Insights", to: "/app/insights", desc: "Track trading margins, expenses, losses & AI growth plan" },
      { label: "AI Support & Triage", to: "/app/support", desc: "Two-stage resolution: guided steps & urgency-ranked bank escalation" },
      { label: "Marketplace Discovery", to: "/app/market", desc: "Source produce directly from verified farmers" },
      { label: "Order History", to: "/app/orders", desc: "Track purchases and pay via protected pending sandbox" },
      { label: "Logistics & Shipments", to: "/app/logistics", desc: "Request haulage and track milestones in real-time" },
      { label: "Storage Facilities", to: "/app/storage", desc: "Secure warehouse space along transit routes" },
      { label: "Savings Options", to: "/app/savings", desc: "Fixed-term interest options held with Zenith Bank" },
    ],
    STORAGE_PROVIDER: [
      { label: "Warehouse Facilities", to: "/app/warehouse", desc: "Manage capacity, accept bookings and stock ledger" },
      { label: "AI Support Assistant", to: "/app/support", desc: "Step-by-step guidance and escalation triage" },
      { label: "Business CAC Verification", to: "/app/verification", desc: "Submit corporate credentials for approved status" },
    ],
    LOGISTICS_PROVIDER: [
      { label: "Jobs & Fleet", to: "/app/fleet", desc: "Manage drivers, vehicles and active assignments" },
      { label: "Delivery Requests & Quotes", to: "/app/logistics", desc: "Submit competitive bids for produce transport" },
      { label: "AI Support Assistant", to: "/app/support", desc: "Step-by-step guidance and escalation triage" },
      { label: "Business CAC Verification", to: "/app/verification", desc: "Submit corporate credentials for approved status" },
    ],
    BANK_OFFICER: [
      { label: "Urgency Complaint Queue", to: "/app/bank/complaints", desc: "Triage customer cases ranked Critical, High, Medium, Low" },
      { label: "Customer Financial Insights", to: "/app/bank/insights", desc: "Inspect verified financial summaries shared by loan applicants" },
      { label: "Loan Review Queue", to: "/app/bank/loans", desc: "Inspect loan-readiness checklists and underwrite credit" },
      { label: "Pilot Analytics Dashboard", to: "/app/admin/analytics", desc: "Monitor customer acquisition, retention and portfolio risk" },
      { label: "Product Configuration", to: "/app/admin/config", desc: "Configure loan tenors, savings rates and fee rules" },
    ],
    PLATFORM_ADMIN: [
      { label: "Pending Payments Engine", to: "/app/admin/payments-engine", desc: "Inspect retry logs and manage pending transfer protection" },
      { label: "Urgency Complaint Queue", to: "/app/bank/complaints", desc: "Review and resolve escalated customer complaints" },
      { label: "Business Verifications", to: "/app/admin/verify", desc: "Review CAC documents for storage & logistics providers" },
      { label: "Dispute Moderation", to: "/app/admin/disputes", desc: "Arbitrate transaction disputes and issue refund decisions" },
      { label: "Immutable Audit Log", to: "/app/admin/audit", desc: "Inspect detailed actor event records and system activity" },
      { label: "Pilot Analytics", to: "/app/admin/analytics", desc: "Examine platform KPIs with GTV separated from revenue" },
      { label: "System Configuration", to: "/app/admin/config", desc: "Manage platform fee rules and feature flags" },
    ],
  };

  const actions = roleActions[user?.role ?? ""] ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sand pb-4">
        <div>
          <h1 className="font-display text-3xl text-forest">Welcome, {user?.fullName}</h1>
          <p className="text-sm text-ink/70">
            Account role: <span className="font-semibold">{user?.role.replaceAll("_", " ")}</span> · Location: {user?.lga}, {user?.state}
          </p>
        </div>
        {user?.isEligibleZenithCustomer && (
          <span className="rounded-full bg-gold/20 px-3 py-1 text-xs font-semibold text-forest">
            ★ Zenith Customer Status Active (Proposed Benefit)
          </span>
        )}
      </div>

      {user?.isEligibleZenithCustomer && (
        <Card className="border-gold/40 bg-gold/5">
          <p className="text-xs font-semibold uppercase tracking-wider text-gold">Proposed partnership benefit</p>
          <p className="mt-1 text-sm text-ink/80">
            Your account is linked to Zenith Bank (simulated). You enjoy preferential 1.6% transaction fees (vs 2.0%) and a 6% discount on verified logistics.
          </p>
        </Card>
      )}

      <div>
        <h2 className="font-display text-xl text-forest">Quick Actions</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {actions.map((a) => (
            <Link key={a.to} to={a.to} className="group rounded-2xl border border-sand bg-white p-4 shadow-sm transition hover:border-leaf hover:shadow">
              <p className="font-semibold text-forest group-hover:text-leaf">{a.label} →</p>
              <p className="mt-1 text-xs text-ink/70">{a.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Market() {
  const [q, setQ] = useState("");
  const [produce, setProduce] = useState("");
  const [state, setState] = useState("");
  const [grade, setGrade] = useState("");
  const [verified, setVerified] = useState(false);
  const [compare, setCompare] = useState<string[]>([]);

  const queryParams = useMemo(() => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (produce) p.set("produce", produce);
    if (state) p.set("state", state);
    if (grade) p.set("grade", grade);
    if (verified) p.set("verifiedSeller", "true");
    return p.toString();
  }, [q, produce, state, grade, verified]);

  const { data } = useLoad(() => api(`/api/listings?${queryParams}`), [queryParams]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl text-forest">Agricultural Marketplace</h1>
        {compare.length > 1 && (
          <Link className="rounded-full bg-forest px-4 py-1.5 text-xs text-cream" to={`/app/compare?ids=${compare.join(",")}`}>
            Compare {compare.length} Selected Produce
          </Link>
        )}
      </div>

      <div className="rounded-2xl border border-sand bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <input
            className="rounded-lg border border-sand px-3 py-2 text-sm"
            placeholder="Search crop or keyword..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select className="rounded-lg border border-sand px-3 py-2 text-sm" value={produce} onChange={(e) => setProduce(e.target.value)}>
            <option value="">All Crops</option>
            <option value="maize">Maize</option>
            <option value="cassava">Cassava</option>
            <option value="yam">Yam</option>
            <option value="tomatoes">Tomatoes</option>
            <option value="rice">Rice</option>
            <option value="cocoa">Cocoa</option>
          </select>
          <select className="rounded-lg border border-sand px-3 py-2 text-sm" value={state} onChange={(e) => setState(e.target.value)}>
            <option value="">All States</option>
            <option value="Kano">Kano</option>
            <option value="Benue">Benue</option>
            <option value="Oyo">Oyo</option>
            <option value="Kaduna">Kaduna</option>
            <option value="Cross River">Cross River</option>
            <option value="Lagos">Lagos</option>
          </select>
          <select className="rounded-lg border border-sand px-3 py-2 text-sm" value={grade} onChange={(e) => setGrade(e.target.value)}>
            <option value="">All Grades</option>
            <option value="A">Grade A (Premium)</option>
            <option value="B">Grade B (Standard)</option>
            <option value="C">Grade C (Commercial)</option>
          </select>
          <label className="flex items-center gap-2 text-xs font-medium text-ink/80">
            <input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} className="rounded" />
            Zenith Verified Farmers
          </label>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data?.listings?.map((l: any) => (
          <Card key={l.id} className="flex flex-col justify-between">
            <div>
              <div className="relative mb-3 h-36 w-full overflow-hidden rounded-xl bg-sand/30">
                <img
                  src={l.images?.[0]?.path ?? "/placeholder-produce.svg"}
                  alt={l.images?.[0]?.alt ?? `${l.produceType} photo`}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/placeholder-produce.svg";
                  }}
                />
                <span className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold shadow-sm">
                  Grade {l.grade}
                </span>
                {l.farmer?.isEligibleZenithCustomer && (
                  <span className="absolute left-2 top-2 rounded-full bg-gold/90 px-2 py-0.5 text-xs font-semibold text-forest shadow-sm">
                    Verified Seller
                  </span>
                )}
              </div>
              <h2 className="font-display text-xl capitalize text-forest">{l.produceType}</h2>
              <p className="mt-1 font-semibold text-leaf">
                {l.quantity} {l.unit} available · {naira(l.pricePerUnit)} / {l.unit}
              </p>
              <p className="mt-0.5 text-xs text-ink/70">
                {l.state} · Farmer: {l.farmer.fullName}
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-sand/40 pt-3 text-sm">
              <Link className="font-medium text-leaf underline" to={`/app/listings/${l.id}`}>
                View details & order →
              </Link>
              <button
                className="text-xs text-ink/70 underline hover:text-ink"
                onClick={() => setCompare((c) => (c.includes(l.id) ? c.filter((x) => x !== l.id) : [...c, l.id].slice(0, 3)))}
              >
                {compare.includes(l.id) ? "Remove compare" : "+ Compare"}
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function Compare() {
  const [params] = useSearchParams();
  const { data } = useLoad(() => api(`/api/listings/compare?ids=${params.get("ids")}`), [params.get("ids")]);
  return (
    <div className="overflow-x-auto">
      <h1 className="font-display text-3xl">Side-by-side</h1>
      <table className="mt-4 w-full text-sm">
        <thead>
          <tr>
            <th />
            {data?.listings?.map((l: any) => (
              <th key={l.id} className="p-2">
                {l.produceType}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {["pricePerUnit", "quantity", "grade", "state"].map((k) => (
            <tr key={k} className="border-t border-sand">
              <td className="py-2 font-medium">{k}</td>
              {data?.listings?.map((l: any) => (
                <td key={l.id}>{String(l[k])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ListingDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const { data } = useLoad(() => api(`/api/listings/${id}`), [id]);
  const [qty, setQty] = useState(10);
  const [mode, setMode] = useState("logistics");
  async function order() {
    const created = await api("/api/orders", {
      method: "POST",
      body: JSON.stringify({ listingId: id, quantity: qty, deliveryMode: mode, logisticsBase: 50000 }),
    });
    nav(`/app/orders/${created.order.id}`);
  }
  const listing = data?.listing;
  if (!listing) return <p>Loading…</p>;
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <div className="relative mb-4 h-48 w-full overflow-hidden rounded-xl bg-sand/30">
          <img
            src={listing.images?.[0]?.path ?? "/placeholder-produce.svg"}
            alt={listing.images?.[0]?.alt ?? `${listing.produceType} photo`}
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/placeholder-produce.svg";
            }}
          />
          <span className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold shadow-sm">
            Grade {listing.grade}
          </span>
        </div>
        <h1 className="font-display text-3xl capitalize text-forest">{listing.produceType}</h1>
        <p className="mt-1 font-semibold text-leaf">
          {listing.quantity} {listing.unit} available · {naira(listing.pricePerUnit)}
        </p>
        <p className="text-sm text-ink/70">
          {listing.state}, {listing.lga} · Grade {listing.grade}
        </p>
        {data.priceInsight && (
          <div className="mt-4 rounded-xl border border-sand bg-sand/20 p-3 text-xs text-ink/80">
            <span className="font-semibold text-forest">AI Price Guidance (Advisory): </span>
            Indicative range {data.priceInsight.indicativeMin ? naira(data.priceInsight.indicativeMin) : "N/A"}–
            {data.priceInsight.indicativeMax ? naira(data.priceInsight.indicativeMax) : "N/A"} ({data.priceInsight.demandSignal}).{" "}
            {data.priceInsight.basis} Confidence: {data.priceInsight.confidence}.
          </div>
        )}
      </Card>
      {user?.role === "TRADER" && (
        <Card>
          <h2 className="font-display text-xl">Place order</h2>
          <label className="mt-2 block text-sm">
            Quantity
            <input type="number" className="mt-1 w-full rounded border border-sand px-2 py-1" value={qty} onChange={(e) => setQty(Number(e.target.value))} />
          </label>
          <label className="mt-2 block text-sm">
            Delivery
            <select className="mt-1 w-full rounded border border-sand px-2 py-1" value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="logistics">Verified logistics</option>
              <option value="self_collection">Self-collection</option>
            </select>
          </label>
          <FeeWidget amount={qty * listing.pricePerUnit} logistics={mode === "logistics" ? 50000 : 0} />
          <button className="mt-4 rounded-full bg-forest px-4 py-2 text-cream" onClick={order}>
            Submit order
          </button>
        </Card>
      )}
    </div>
  );
}

export function FeeWidget({ amount, logistics }: { amount: number; logistics: number }) {
  const { user } = useAuth();
  const non = calculatePlatformFee(amount, false);
  const yes = calculatePlatformFee(amount, true);
  const lNon = applyLogisticsDiscount(logistics, false);
  const lYes = applyLogisticsDiscount(logistics, true);
  return (
    <div className="mt-4 rounded-xl bg-cream p-3 text-sm">
      <p className="font-semibold">Fee calculator · Proposed partnership benefit</p>
      <p>Non-Zenith fee: {naira(non.feeAmount)} ({non.feePercent}%)</p>
      <p>Eligible Zenith fee: {naira(yes.feeAmount)} ({yes.feePercent}%) · funder {yes.discountFunder}</p>
      {logistics > 0 && (
        <>
          <p>Standard delivery: {naira(lNon.customerPays)}</p>
          <p>Eligible Zenith delivery: {naira(lYes.customerPays)} · funder {lYes.discountFunder}</p>
        </>
      )}
      <p className="mt-2 text-xs">{non.note}</p>
      <p className="text-xs">Your status: {user?.isEligibleZenithCustomer ? "eligible (proposed)" : "standard"}</p>
    </div>
  );
}

export function FarmerListings() {
  const { data, reload } = useLoad(() => api("/api/listings"));
  const { user } = useAuth();
  const [crop, setCrop] = useState("maize");
  const { data: priceData } = useLoad(() => (crop ? api(`/api/price-insights?produce=${encodeURIComponent(crop)}`) : Promise.resolve(null)), [crop]);

  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await api("/api/listings", {
      method: "POST",
      body: JSON.stringify({
        produceType: fd.get("produceType"),
        quantity: Number(fd.get("quantity")),
        unit: fd.get("unit"),
        pricePerUnit: Number(fd.get("pricePerUnit")),
        grade: fd.get("grade"),
        state: user?.state,
        lga: user?.lga,
        harvestNotes: fd.get("harvestNotes"),
      }),
    });
    reload();
  }
  const mine = data?.listings?.filter((l: any) => l.farmer.id === user?.id) ?? [];
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <h1 className="font-display text-2xl text-forest">Create Produce Listing</h1>
        <form onSubmit={create} className="mt-3 space-y-3 text-sm">
          <div>
            <label className="block text-xs font-semibold text-ink/70">Produce Type</label>
            <input
              name="produceType"
              placeholder="e.g. maize, yam, cassava"
              value={crop}
              onChange={(e) => setCrop(e.target.value)}
              className="mt-1 w-full rounded border border-sand px-2 py-1.5"
              required
            />
          </div>
          {priceData?.priceInsight && (
            <div className="rounded-xl border border-sand bg-sand/20 p-2.5 text-xs text-ink/80">
              <span className="font-semibold text-forest">AI Price Guidance (Advisory): </span>
              Indicative range {priceData.priceInsight.indicativeMin ? naira(priceData.priceInsight.indicativeMin) : "N/A"}–
              {priceData.priceInsight.indicativeMax ? naira(priceData.priceInsight.indicativeMax) : "N/A"}{" "}
              ({priceData.priceInsight.demandSignal})
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-ink/70">Quantity</label>
              <input name="quantity" type="number" placeholder="e.g. 500" className="mt-1 w-full rounded border border-sand px-2 py-1.5" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink/70">Unit</label>
              <input name="unit" defaultValue="kg" className="mt-1 w-full rounded border border-sand px-2 py-1.5" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-ink/70">Price per unit (₦)</label>
              <input name="pricePerUnit" type="number" placeholder="Price ₦" className="mt-1 w-full rounded border border-sand px-2 py-1.5" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink/70">Quality Grade</label>
              <select name="grade" className="mt-1 w-full rounded border border-sand px-2 py-1.5">
                <option value="A">Grade A (Premium)</option>
                <option value="B">Grade B (Standard)</option>
                <option value="C">Grade C (Commercial)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink/70">Harvest Notes & Window</label>
            <input name="harvestNotes" placeholder="e.g. Fresh harvest, dry bagged" className="mt-1 w-full rounded border border-sand px-2 py-1.5" />
          </div>
          <button className="rounded-full bg-forest px-5 py-2 text-cream hover:bg-forest/90">Publish Listing</button>
        </form>
      </Card>
      <div className="space-y-3">
        {mine.map((l: any) => (
          <Card key={l.id}>
            <p className="font-medium capitalize">{l.produceType}</p>
            <p className="text-sm">
              {l.quantity} {l.unit} · {naira(l.pricePerUnit)} · {l.status}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function Orders() {
  const { user } = useAuth();
  const { data, reload } = useLoad(() => api("/api/orders"));
  async function decide(id: string, accept: boolean) {
    await api(`/api/orders/${id}/decision`, { method: "POST", body: JSON.stringify({ accept }) });
    reload();
  }
  return (
    <div className="space-y-3">
      <h1 className="font-display text-3xl">Orders</h1>
      {data?.orders?.map((o: any) => (
        <Card key={o.id}>
          <div className="flex flex-wrap justify-between gap-2">
            <Link className="font-medium text-leaf underline" to={`/app/orders/${o.id}`}>
              {o.status} · {naira(o.totalDue)}
            </Link>
            <span className="text-xs">Fee {naira(o.platformFee)} {o.discountFunder ? `· funder ${o.discountFunder}` : ""}</span>
          </div>
          {user?.role === "FARMER" && o.status === "placed" && (
            <div className="mt-2 flex gap-2">
              <button className="rounded bg-leaf px-3 py-1 text-cream" onClick={() => decide(o.id, true)}>
                Accept
              </button>
              <button className="rounded border px-3 py-1" onClick={() => decide(o.id, false)}>
                Decline
              </button>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

export function OrderDetail() {
  const { id } = useParams();
  const { data, reload } = useLoad(
    () => api(`/api/orders/${id}`).then((d) => d.order).catch(() => api("/api/orders").then((d) => d.orders.find((o: any) => o.id === id))),
    [id],
  );
  const nav = useNavigate();
  if (!data) return <p>Loading…</p>;
  async function pay() {
    const checkout = await api("/api/payments/checkout", { method: "POST", body: JSON.stringify({ orderId: id, method: "zenith_simulated" }) });
    nav(`/app/pay?ref=${checkout.payment.providerRef}`);
  }
  async function complete() {
    await api(`/api/orders/${id}/complete`, { method: "POST", body: JSON.stringify({ rating: 5, comment: "Received (demo)" }) });
    reload();
  }
  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sand pb-3">
        <h1 className="font-display text-2xl text-forest">Order #{data.id.slice(0, 8)}</h1>
        <span className="rounded-full bg-sand/60 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-forest">
          Status: {data.status.replaceAll("_", " ")}
        </span>
      </div>

      {data.items && data.items.length > 0 && (
        <div className="rounded-xl border border-sand bg-sand/10 p-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-ink/70">Order Items</h2>
          <div className="mt-2 divide-y divide-sand/40 text-sm">
            {data.items.map((it: any) => (
              <div key={it.id} className="flex justify-between py-1.5">
                <span className="font-medium capitalize">{it.listing?.produceType ?? "Produce"}</span>
                <span>
                  {it.quantity} units · {naira(it.unitPrice)} / unit
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <ul className="space-y-1.5 text-sm">
        <li className="flex justify-between text-ink/80">
          <span>Produce Subtotal:</span>
          <span>{naira(data.subtotal)}</span>
        </li>
        <li className="flex justify-between text-ink/80">
          <span>
            Platform Fee:{" "}
            {data.zenithDiscount > 0 && (
              <span className="text-xs text-gold">(Zenith discount {naira(data.zenithDiscount)} funded by {data.discountFunder})</span>
            )}
          </span>
          <span>{naira(data.platformFee)}</span>
        </li>
        <li className="flex justify-between text-ink/80">
          <span>Logistics Charge ({data.deliveryMode.replaceAll("_", " ")}):</span>
          <span>{naira(data.logisticsCharge)}</span>
        </li>
        <li className="flex justify-between border-t border-sand pt-2 text-base font-bold text-forest">
          <span>Total Amount Due:</span>
          <span>{naira(data.totalDue)}</span>
        </li>
      </ul>

      <div className="flex flex-wrap gap-3 pt-2">
        {data.status === "payment_pending" && (
          <button className="rounded-full bg-forest px-5 py-2 text-sm text-cream hover:bg-forest/90" onClick={pay}>
            Proceed to Simulated Checkout →
          </button>
        )}
        {data.status === "delivered" && (
          <button className="rounded-full bg-forest px-5 py-2 text-sm text-cream hover:bg-forest/90" onClick={complete}>
            Confirm Receipt & Release Funds
          </button>
        )}
        {data.deliveryMode === "logistics" && (
          <Link className="rounded-full border border-forest px-4 py-2 text-sm font-medium text-forest hover:bg-sand/20" to="/app/logistics">
            View / Track Haulage
          </Link>
        )}
      </div>
    </Card>
  );
}

export function PaySandbox() {
  const [params] = useSearchParams();
  const ref = params.get("ref") ?? "";
  const nav = useNavigate();
  const [pendingState, setPendingState] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function checkStatus() {
    setLoading(true);
    try {
      const res = await api(`/api/payments/status/${ref}`);
      setPendingState(res.payment);
      setMsg(res.payment.customerMessage);
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function completeDirect() {
    await api("/api/payments/sandbox/complete", { method: "POST", body: JSON.stringify({ reference: ref }) });
    nav("/app/orders");
  }

  async function simulatePending() {
    setLoading(true);
    try {
      await api(`/api/payments/${ref}/retry-attempt`, { method: "POST" });
      await checkStatus();
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function simulateSuccess() {
    setLoading(true);
    try {
      await api(`/api/payments/${ref}/complete-success`, { method: "POST" });
      await checkStatus();
      setTimeout(() => nav("/app/orders"), 1500);
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function simulateTimeout() {
    setLoading(true);
    try {
      await api(`/api/payments/${ref}/timeout-release`, { method: "POST" });
      await checkStatus();
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="rounded-2xl border border-sand bg-white p-6 shadow-sm">
        <div className="inline-block rounded-full bg-forest/10 px-3 py-1 text-xs font-semibold text-forest">
          Zecathon 6.0 · Strengthening Trust in Digital Banking
        </div>
        <h1 className="mt-2 font-display text-2xl text-forest">Simulated Hosted Payment Gateway</h1>
        <p className="mt-1 text-sm text-ink/70">
          Payment Reference: <span className="font-mono font-medium text-forest">{ref || "TRX-DEMO-2026"}</span>
        </p>

        <div className="mt-4 rounded-xl border border-sand bg-sand/20 p-4 text-xs text-ink/80">
          <p className="font-semibold text-forest">Single Transaction Protection Guarantee:</p>
          <p className="mt-1">
            If a network timeout or incomplete transfer occurs, CAHS keeps this transaction in a <strong>Pending state</strong> and
            automatically retries it in the background using this exact reference. You will never see duplicate debits.
          </p>
        </div>

        {pendingState && (
          <div className="mt-6 rounded-xl border border-sand bg-sand/10 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink/70">Customer Transaction Status</span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                  pendingState.status === "successful"
                    ? "bg-leaf text-cream"
                    : pendingState.status === "not_completed"
                    ? "bg-clay/20 text-clay"
                    : "bg-gold/20 text-gold-dark font-medium animate-pulse"
                }`}
              >
                {pendingState.status.replaceAll("_", " ")}
              </span>
            </div>
            <p className="mt-3 text-sm font-medium text-forest">{msg || pendingState.customerMessage}</p>
            {pendingState.holdReleased && (
              <p className="mt-2 text-xs font-semibold text-leaf">✓ Any reserved bank hold has been released back to your account.</p>
            )}
          </div>
        )}

        <div className="mt-6 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink/60">Simulate Payment Scenarios</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              className="rounded-xl bg-forest py-2.5 px-4 text-sm font-medium text-cream hover:bg-forest/90"
              onClick={completeDirect}
            >
              1. Direct Success (Instant Confirm)
            </button>
            <button
              className="rounded-xl border border-gold bg-gold/10 py-2.5 px-4 text-sm font-medium text-forest hover:bg-gold/20"
              onClick={simulatePending}
              disabled={loading}
            >
              2. Incomplete Transfer (Trigger Pending)
            </button>
          </div>

          {pendingState?.status === "pending" && (
            <div className="mt-4 space-y-2 rounded-xl border border-sand bg-sand/10 p-4">
              <p className="text-xs font-semibold text-forest">Pending Engine Controls (Demo Verification):</p>
              <div className="flex flex-wrap gap-2">
                <button className="rounded-lg bg-leaf px-3 py-1.5 text-xs text-cream" onClick={simulateSuccess} disabled={loading}>
                  Simulate Bank Confirmation (Success)
                </button>
                <button className="rounded-lg border border-sand bg-white px-3 py-1.5 text-xs text-ink/80" onClick={simulatePending} disabled={loading}>
                  Run Background Retry Attempt
                </button>
                <button className="rounded-lg border border-clay bg-clay/10 px-3 py-1.5 text-xs text-clay" onClick={simulateTimeout} disabled={loading}>
                  Simulate Timeout & Hold Release
                </button>
                <button className="rounded-lg border border-sand bg-white px-3 py-1.5 text-xs" onClick={checkStatus} disabled={loading}>
                  Check Status Now
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-between border-t border-sand pt-4 text-xs text-ink/60">
          <Link to="/app/support" className="text-leaf underline">
            Have a question? Open AI Support & Triage
          </Link>
          <Link to="/app/orders" className="text-ink/80 underline">
            Back to Orders
          </Link>
        </div>
      </div>
    </div>
  );
}

export function LogisticsPage() {
  const { user } = useAuth();
  const { data, reload } = useLoad(() => api("/api/logistics/requests"));
  async function request(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await api("/api/logistics/requests", {
      method: "POST",
      body: JSON.stringify(Object.fromEntries(fd.entries())),
    });
    reload();
  }
  async function quote(id: string) {
    await api(`/api/logistics/requests/${id}/quotes`, {
      method: "POST",
      body: JSON.stringify({ baseCharge: 50000, conditions: "Covered truck, simulated" }),
    });
    reload();
  }
  async function accept(id: string) {
    await api(`/api/logistics/quotes/${id}/accept`, { method: "POST" });
    reload();
  }
  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl">Logistics</h1>
      {(user?.role === "TRADER" || user?.role === "FARMER") && (
        <Card>
          <form onSubmit={request} className="grid gap-2 text-sm md:grid-cols-2">
            <input name="origin" placeholder="Origin" className="rounded border border-sand px-2 py-1" required />
            <input name="destination" placeholder="Destination" className="rounded border border-sand px-2 py-1" required />
            <input name="loadDesc" placeholder="Load" className="rounded border border-sand px-2 py-1" required />
            <input name="weightKg" placeholder="Weight kg" className="rounded border border-sand px-2 py-1" />
            <input name="serviceLevel" defaultValue="standard" className="rounded border border-sand px-2 py-1" />
            <input name="pickupWindow" placeholder="Pickup window" className="rounded border border-sand px-2 py-1" />
            <button className="rounded-full bg-forest px-4 py-2 text-cream md:col-span-2">Request delivery</button>
          </form>
        </Card>
      )}
      {data?.requests?.map((r: any) => (
        <Card key={r.id}>
          <p>
            {r.origin} → {r.destination} · {r.loadDesc}
          </p>
          {user?.role === "LOGISTICS_PROVIDER" && (
            <button className="mt-2 text-sm text-leaf underline" onClick={() => quote(r.id)}>
              Submit quote (verified providers only)
            </button>
          )}
          {r.quotes?.map((q: any) => (
            <div key={q.id} className="mt-2 rounded bg-cream p-2 text-sm">
              Base {naira(q.baseCharge)} · discount {naira(q.discountAmount)} ({q.discountFunder ?? "none"}) · customer pays {naira(q.customerPays)}
              <p className="text-xs">Proposed partnership benefit where a discount applies.</p>
              {user?.id === r.requesterId && q.status === "offered" && (
                <button className="underline" onClick={() => accept(q.id)}>
                  Accept quote
                </button>
              )}
            </div>
          ))}
          {r.jobs?.map((j: any) => (
            <Link key={j.id} className="mt-2 block text-leaf underline" to={`/app/shipments/${j.id}`}>
              Track job {j.status}
            </Link>
          ))}
        </Card>
      ))}
    </div>
  );
}

const MILESTONES = ["packaged", "collected", "in_transit", "arrived_at_destination_warehouse", "out_for_delivery", "delivered"];

export function Shipment() {
  const { id } = useParams();
  const { user } = useAuth();
  const { data, reload } = useLoad(() => api(`/api/logistics/jobs/${id}`), [id]);
  async function advance(code: string) {
    await api(`/api/logistics/jobs/${id}/milestones`, { method: "POST", body: JSON.stringify({ code, location: "Simulated GPS" }) });
    reload();
  }
  async function pod() {
    await api(`/api/logistics/jobs/${id}/pod`, { method: "POST", body: JSON.stringify({ code: "SIM-OK", confirmed: true }) });
    reload();
  }
  const job = data?.job;
  if (!job) return <p>Loading…</p>;
  const done = new Set(job.milestones.map((m: any) => m.code));
  return (
    <Card>
      <h1 className="font-display text-2xl">Shipment tracking</h1>
      <p className="text-sm">ETA window: {job.etaWindow}</p>
      <ol className="mt-4 space-y-2">
        {MILESTONES.map((m) => (
          <li key={m} className={done.has(m) ? "text-leaf" : "text-ink/50"}>
            {done.has(m) ? "●" : "○"} {m.replaceAll("_", " ")}
            {user?.role === "LOGISTICS_PROVIDER" && !done.has(m) && (
              <button className="ml-2 text-xs underline" onClick={() => advance(m)}>
                Update
              </button>
            )}
          </li>
        ))}
      </ol>
      {data.driverVisible && job.driver && (
        <p className="mt-4 text-sm">
          Driver {job.driver.name} · {job.driver.contact} · mock location {job.mockLat},{job.mockLng} (visible only while active)
        </p>
      )}
      {!data.driverVisible && <p className="mt-4 text-sm">Driver contact is hidden (not authorised, or shipment is no longer active).</p>}
      <button className="mt-4 rounded border px-3 py-1 text-sm" onClick={pod}>
        Upload simulated proof of delivery
      </button>
    </Card>
  );
}

export function StoragePage() {
  const { user } = useAuth();
  const { data } = useLoad(() => api("/api/storage/facilities"));
  const { data: occ } = useLoad(() => (user?.role === "STORAGE_PROVIDER" ? api("/api/storage/occupancy") : Promise.resolve(null)));
  async function book(facilityId: string) {
    await api("/api/storage/bookings", {
      method: "POST",
      body: JSON.stringify({ facilityId, produceType: "maize", quantity: 20, durationDays: 14 }),
    });
    alert("Booking requested");
  }
  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl">Storage</h1>
      {data?.facilities?.map((f: any) => (
        <Card key={f.id}>
          <div className="flex justify-between">
            <h2 className="font-display text-xl">{f.name}</h2>
            {f.verified && <span className="text-xs text-leaf">Verified</span>}
          </div>
          <p className="text-sm">
            {f.storageType} · {f.available}/{f.capacity} {f.unit} · {naira(f.pricePerUnitPeriod)} / {f.unit} / week
          </p>
          {(user?.role === "FARMER" || user?.role === "TRADER") && (
            <button className="mt-2 text-sm text-leaf underline" onClick={() => book(f.id)}>
              Request booking
            </button>
          )}
        </Card>
      ))}
      {user?.role === "STORAGE_PROVIDER" && (
        <Card className="border-leaf/30 bg-leaf/5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-lg text-forest">Facility Operations & Bookings</h3>
              <p className="text-xs text-ink/70">Inspect incoming bookings, approve requests, and maintain the stock ledger</p>
            </div>
            <Link to="/app/warehouse" className="rounded-full bg-forest px-4 py-2 text-xs text-cream hover:bg-forest/90">
              Open Warehouse Ops →
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}

export function WarehouseOps() {
  const { data, reload } = useLoad(() => api("/api/storage/occupancy"));
  return (
    <div>
      <h1 className="font-display text-3xl">Occupancy</h1>
      {data?.facilities?.map((f: any) => (
        <Card key={f.id} className="mt-3">
          <h2>{f.name}</h2>
          <p>
            Available {f.available} / {f.capacity}
          </p>
          {f.bookings.map((b: any) => (
            <div key={b.id} className="mt-2 text-sm">
              {b.produceType} {b.quantity} · {b.status}
              {b.status === "requested" && (
                <button
                  className="ml-2 underline"
                  onClick={async () => {
                    await api(`/api/storage/bookings/${b.id}/decision`, { method: "POST", body: JSON.stringify({ accept: true }) });
                    reload();
                  }}
                >
                  Accept
                </button>
              )}
              <Link className="ml-2 underline" to={`/app/ledger/${b.id}`}>
                Ledger
              </Link>
            </div>
          ))}
        </Card>
      ))}
    </div>
  );
}

export function Ledger() {
  const { id } = useParams();
  const { user } = useAuth();
  const { data, reload } = useLoad(() => api(`/api/storage/bookings/${id}/ledger`), [id]);
  async function move(kind: string) {
    await api(`/api/storage/bookings/${id}/movement`, { method: "POST", body: JSON.stringify({ kind, quantity: 10, condition: "good" }) });
    reload();
  }
  if (!data) return <p>Loading…</p>;
  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-sand pb-3">
        <div>
          <h1 className="font-display text-2xl text-forest">Stock Movement Ledger</h1>
          <p className="text-sm text-ink/70">
            Facility: {data.booking?.facility?.name} · Crop: <span className="font-semibold capitalize">{data.booking?.produceType}</span>
          </p>
        </div>
        {data.risk && (
          <div
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold ${
              data.risk.level === "high"
                ? "bg-red-100 text-red-800"
                : data.risk.level === "moderate"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-emerald-100 text-emerald-800"
            }`}
          >
            Post-harvest Spoilage Risk: {data.risk.level.toUpperCase()} (Advisory)
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-4 text-sm font-medium">
        <span className="rounded-lg bg-sand/30 px-3 py-1">Total Intake: {data.intake}</span>
        <span className="rounded-lg bg-sand/30 px-3 py-1">Total Dispatch: {data.dispatch}</span>
        <span className="rounded-lg bg-leaf/20 px-3 py-1 font-semibold text-leaf">Reconciled Balance: {data.balance}</span>
      </div>

      {user?.role === "STORAGE_PROVIDER" && (
        <div className="flex gap-2">
          <button className="rounded-full bg-forest px-4 py-1.5 text-xs text-cream" onClick={() => move("intake")}>
            + Record Intake (+10)
          </button>
          <button className="rounded-full border border-forest px-4 py-1.5 text-xs text-forest" onClick={() => move("dispatch")}>
            - Record Dispatch (+10)
          </button>
        </div>
      )}

      <div>
        <h3 className="font-display text-base text-forest">Movement Audit History</h3>
        <ul className="mt-2 divide-y divide-sand/40 text-sm">
          {data.booking.movements.map((m: any) => (
            <li key={m.id} className="py-2 flex justify-between">
              <span className="capitalize font-medium">{m.kind} {m.quantity} units</span>
              <span className="text-ink/60">Condition: {m.condition}</span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

export function LoansPage() {
  const { data, reload } = useLoad(() => api("/api/loans/applications"));
  async function apply(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await api("/api/loans/applications", {
      method: "POST",
      body: JSON.stringify({
        amount: Number(fd.get("amount")),
        purpose: fd.get("purpose"),
        tenorDays: 180,
        farmInfo: fd.get("farmInfo"),
        crops: fd.get("crops"),
        landSizeHa: 8,
        historicalSales: fd.get("historicalSales"),
        attachSummaries: fd.get("attach") === "on",
      }),
    });
    reload();
  }
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <h1 className="font-display text-2xl">Loan application</h1>
        <p className="mt-2 text-xs">{LOAN_HISTORY_DISCLAIMER}</p>
        <form onSubmit={apply} className="mt-3 space-y-2 text-sm">
          <input name="amount" type="number" placeholder="Amount ₦" className="w-full rounded border border-sand px-2 py-1" required />
          <input name="purpose" placeholder="Purpose" className="w-full rounded border border-sand px-2 py-1" required />
          <input name="farmInfo" placeholder="Farm / business information" className="w-full rounded border border-sand px-2 py-1" />
          <input name="crops" placeholder="Crops" className="w-full rounded border border-sand px-2 py-1" />
          <input name="historicalSales" placeholder="Historical sales" className="w-full rounded border border-sand px-2 py-1" />
          <label className="flex gap-2">
            <input type="checkbox" name="attach" /> Attach platform summaries (requires consent)
          </label>
          <button className="rounded-full bg-forest px-4 py-2 text-cream">Submit for bank review</button>
        </form>
      </Card>
      <div className="space-y-3">
        {data?.applications?.map((a: any) => (
          <Card key={a.id}>
            <p>
              {naira(a.amount)} · {a.status}
            </p>
            <Link className="text-sm text-leaf underline" to={`/app/loans/${a.id}`}>
              Progress
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function LoanDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { data, reload } = useLoad(() => api(`/api/loans/applications/${id}`), [id]);
  async function decide(status: string) {
    const reason = prompt("Decision reason (required)") ?? "";
    await api(`/api/loans/applications/${id}/decision`, { method: "POST", body: JSON.stringify({ status, reason }) });
    reload();
  }
  async function disburse() {
    await api(`/api/loans/applications/${id}/disburse`, { method: "POST" });
    reload();
  }
  async function repay() {
    await api(`/api/loans/applications/${id}/repay`, { method: "POST", body: JSON.stringify({ amount: 50000 }) });
    reload();
  }
  if (!data) return <p>Loading…</p>;
  return (
    <Card>
      <h1 className="font-display text-2xl">Application {data.application.status}</h1>
      <p className="text-xs text-clay">{data.label}</p>
      <pre className="mt-3 overflow-auto rounded bg-cream p-3 text-xs">{JSON.stringify(data.readiness, null, 2)}</pre>
      <p className="mt-2 text-xs">{data.disclaimer}</p>
      {user?.role === "BANK_OFFICER" && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="rounded bg-leaf px-3 py-1 text-cream" onClick={() => decide("approved")}>
            Approve
          </button>
          <button className="rounded border px-3 py-1" onClick={() => decide("rejected")}>
            Reject
          </button>
          <button className="rounded border px-3 py-1" onClick={() => decide("more_info_requested")}>
            Request info
          </button>
          <button className="rounded border px-3 py-1" onClick={disburse}>
            Simulate disbursement
          </button>
        </div>
      )}
      {user?.role !== "BANK_OFFICER" && (
        <button className="mt-4 rounded border px-3 py-1" onClick={repay}>
          Simulate repayment ₦50,000
        </button>
      )}
    </Card>
  );
}

export function BankQueue() {
  const { data } = useLoad(() => api("/api/loans/applications"));
  return (
    <div>
      <h1 className="font-display text-3xl">Loan queue</h1>
      <p className="text-sm">Human decisions only. AI cannot change status.</p>
      {data?.applications?.map((a: any) => (
        <Card key={a.id} className="mt-3">
          <Link to={`/app/loans/${a.id}`}>
            {a.applicant?.fullName} · {naira(a.amount)} · {a.status}
          </Link>
        </Card>
      ))}
    </div>
  );
}

export function SavingsPage() {
  const { data, reload } = useLoad(() => api("/api/savings/products"));
  const { data: accounts } = useLoad(() => api("/api/savings/accounts"));
  const [ack, setAck] = useState(false);
  async function open(id: string) {
    if (!ack) return alert("Acknowledge all disclosures first");
    await api("/api/savings/accounts", { method: "POST", body: JSON.stringify({ productId: id, principal: 100000, acknowledged: true }) });
    reload();
  }
  return (
    <div>
      <h1 className="font-display text-3xl">Fixed-term savings</h1>
      <p className="text-sm text-clay">Subject to Zenith Bank approvals. Simulated. Institution holding funds: Zenith Bank.</p>
      <ul className="mt-3 list-disc pl-5 text-sm">
        {SAVINGS_DISCLOSURES.map((d) => (
          <li key={d}>{d}</li>
        ))}
      </ul>
      <label className="mt-3 flex gap-2 text-sm">
        <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} /> I acknowledge the disclosures. Returns are projected.
      </label>
      {data?.products?.map((p: any) => (
        <Card key={p.id} className="mt-3">
          <h2>{p.name}</h2>
          <p className="text-sm">
            Tenor {p.tenorDays} days · displayed rate {p.displayedRate}% · early withdrawal: {p.earlyWithdrawalNote} · tax treatment: where applicable
          </p>
          <button className="mt-2 text-leaf underline" onClick={() => open(p.id)}>
            Open ₦100,000 (simulated)
          </button>
        </Card>
      ))}
      {accounts?.accounts?.map((a: any) => (
        <p key={a.id} className="mt-2 text-sm">
          {naira(a.principal)} · {a.status} · projected {naira(a.projected)} · matures {new Date(a.maturesAt).toLocaleDateString("en-NG")}
        </p>
      ))}
    </div>
  );
}

export function Assistant() {
  const [prompt, setPrompt] = useState("Help me list maize");
  const [out, setOut] = useState("");
  async function send() {
    const r = await api("/api/ai/chat", { method: "POST", body: JSON.stringify({ prompt }) });
    setOut(r.output);
  }
  return (
    <Card>
      <h1 className="font-display text-2xl">Optional helper</h1>
      <p className="text-xs">Decision support only. Will not approve loans or promise returns. Logged.</p>
      <textarea className="mt-3 w-full rounded border border-sand p-2" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
      <button className="mt-2 rounded-full bg-forest px-4 py-2 text-cream" onClick={send}>
        Ask
      </button>
      {out && <p className="mt-4 whitespace-pre-wrap text-sm">{out}</p>}
    </Card>
  );
}

export function PrivacyPage() {
  const { data, reload } = useLoad(() => api("/api/users/consents"));
  const { refreshMe } = useAuth();
  async function toggle(granted: boolean) {
    await api("/api/users/consents", { method: "POST", body: JSON.stringify({ key: "share_with_bank_for_loan", granted }) });
    reload();
  }
  async function link() {
    await api("/api/users/bank-link", {
      method: "POST",
      body: JSON.stringify({ accountNumber: "1234567890", bankName: "Zenith Bank", consentShare: true }),
    });
    await refreshMe();
  }
  async function correct(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await api("/api/users/data-correction", { method: "POST", body: JSON.stringify({ description: fd.get("description") }) });
    alert("Correction request submitted");
  }
  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl">Consents and data</h1>
      <Card>
        <p>Share transaction summaries with the bank for loan assessment.</p>
        <button className="mt-2 text-leaf underline" onClick={() => toggle(true)}>
          Grant
        </button>
        <button className="ml-3 underline" onClick={() => toggle(false)}>
          Revoke
        </button>
        <pre className="mt-2 text-xs">{JSON.stringify(data?.consents, null, 2)}</pre>
      </Card>
      <Card>
        <p className="text-sm">Link a simulated Zenith account. Only a masked number and verification time are stored. Full number is encrypted.</p>
        <button className="mt-2 rounded bg-forest px-3 py-1 text-cream" onClick={link}>
          Link Zenith (simulated)
        </button>
      </Card>
      <Card>
        <form onSubmit={correct}>
          <textarea name="description" className="w-full rounded border border-sand p-2" placeholder="Describe inaccurate data to correct" />
          <button className="mt-2 rounded border px-3 py-1">Request correction</button>
        </form>
      </Card>
    </div>
  );
}

export function Rewards() {
  const { data } = useLoad(() => api("/api/rewards"));
  return (
    <Card>
      <h1 className="font-display text-2xl">Loyalty credits</h1>
      <p className="text-xs">Proposed partnership benefit</p>
      <p className="mt-2">Balance {data?.balance ?? 0}</p>
    </Card>
  );
}

export function VerificationPage() {
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await api("/api/logistics/business", { method: "POST", body: JSON.stringify(Object.fromEntries(fd.entries())) });
    alert("Submitted for admin review");
  }
  return (
    <Card>
      <h1 className="font-display text-2xl">Business verification</h1>
      <form onSubmit={submit} className="mt-3 space-y-2">
        <input name="name" placeholder="Business name" className="w-full rounded border px-2 py-1" required />
        <input name="cacNumber" placeholder="CAC number" className="w-full rounded border px-2 py-1" />
        <input name="address" placeholder="Address" className="w-full rounded border px-2 py-1" />
        <input name="contact" placeholder="Contact" className="w-full rounded border px-2 py-1" />
        <button className="rounded-full bg-forest px-4 py-2 text-cream">Submit</button>
      </form>
    </Card>
  );
}

export function FleetPage() {
  return <LogisticsPage />;
}

export function AdminVerify() {
  const { data, reload } = useLoad(() => api("/api/admin/verifications"));
  async function decide(id: string, status: string) {
    await api(`/api/admin/verifications/${id}/decide`, { method: "POST", body: JSON.stringify({ status, reason: "Demo review" }) });
    reload();
  }
  return (
    <div>
      <h1 className="font-display text-3xl">Verification queue</h1>
      {data?.submissions?.map((s: any) => (
        <Card key={s.id} className="mt-3">
          <p>
            {s.business.name} · {s.business.kind} · {s.status}
          </p>
          <div className="mt-2 flex gap-2 text-sm">
            <button onClick={() => decide(s.id, "approved")}>Approve</button>
            <button onClick={() => decide(s.id, "rejected")}>Reject</button>
            <button onClick={() => decide(s.id, "more_info_needed")}>More info</button>
          </div>
        </Card>
      ))}
    </div>
  );
}

export function AdminDisputes() {
  const { data, reload } = useLoad(() => api("/api/admin/disputes"));
  return (
    <div>
      <h1 className="font-display text-3xl">Disputes</h1>
      {data?.disputes?.map((d: any) => (
        <Card key={d.id} className="mt-3">
          <p>
            {d.reason} · {d.status}
          </p>
          <button
            className="text-sm underline"
            onClick={async () => {
              await api(`/api/payments/disputes/${d.id}/resolve`, { method: "POST", body: JSON.stringify({ resolution: "refund_full" }) });
              reload();
            }}
          >
            Refund full (simulated)
          </button>
        </Card>
      ))}
    </div>
  );
}

export function AdminAudit() {
  const { data } = useLoad(() => api("/api/admin/audit"));
  return (
    <div>
      <h1 className="font-display text-3xl">Audit log</h1>
      <a className="text-sm text-leaf underline" href="http://localhost:4000/api/admin/audit.csv">
        Export CSV
      </a>
      <ul className="mt-3 max-h-[480px] overflow-auto text-xs">
        {data?.events?.map((e: any) => (
          <li key={e.id}>
            {e.createdAt} · {e.action} · {e.entity} · {e.entityId}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Analytics() {
  const { data } = useLoad(() => api("/api/admin/analytics"));
  if (!data) return <p>Loading…</p>;
  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl">Pilot dashboard</h1>
      <p className="text-xs text-clay">Demo data. Incentive cost is not revenue. GTV and deposits are not CAHS revenue.</p>
      {["customerGrowth", "marketplace", "serviceQuality", "financial", "revenueStreams"].map((k) => (
        <Card key={k}>
          <h2 className="font-display text-xl capitalize">{k.replace(/[A-Z]/g, (x) => " " + x)}</h2>
          <pre className="mt-2 overflow-auto text-xs">{JSON.stringify(data[k], null, 2)}</pre>
        </Card>
      ))}
    </div>
  );
}

export function AdminConfig() {
  const { data } = useLoad(() => api("/api/admin/fee-rules"));
  const { data: flags } = useLoad(() => api("/api/admin/flags"));
  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl">Configuration</h1>
      <Card>
        <h2>Fee rules</h2>
        <pre className="text-xs">{JSON.stringify(data, null, 2)}</pre>
      </Card>
      <Card>
        <h2>Feature flags</h2>
        <pre className="text-xs">{JSON.stringify(flags, null, 2)}</pre>
      </Card>
    </div>
  );
}

export function FraudForm() {
  async function send(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await api("/api/admin/fraud-report", { method: "POST", body: JSON.stringify({ description: fd.get("d") }) });
    alert("Recorded");
  }
  return (
    <Card>
      <h1 className="font-display text-2xl">Report fraud or error</h1>
      <form onSubmit={send}>
        <textarea name="d" className="mt-3 w-full rounded border p-2" />
        <button className="mt-2 rounded bg-forest px-4 py-2 text-cream">Submit</button>
      </form>
    </Card>
  );
}

// =========================================================================
// Zecathon 6.0 Feature 1: AI Support & Urgency-Ranked Complaint Resolution
// =========================================================================
export function SupportPage() {
  const [text, setText] = useState("");
  const [triage, setTriage] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [escalating, setEscalating] = useState(false);
  const [escalatedCase, setEscalatedCase] = useState<any>(null);
  const [err, setErr] = useState("");
  const { data: myCases, reload: reloadCases } = useLoad(() => api("/api/support/my-cases"));

  const samplePrompts = [
    "Money debited from my account but order is still showing unpaid",
    "Tomato shipment is delayed by 8 hours and produce is at risk of heat spoilage",
    "Bag of maize delivered was grade C instead of grade A listed",
    "Check loan application requirements and review timeline",
    "Transfer timeout occurred and I need confirmation of no double debit",
  ];

  async function handleTriage(customText?: string) {
    const q = customText || text;
    if (!q.trim()) return;
    setLoading(true);
    setErr("");
    setEscalatedCase(null);
    try {
      const res = await api("/api/support/triage", {
        method: "POST",
        body: JSON.stringify({ text: q }),
      });
      setTriage(res);
      if (customText) setText(customText);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleEscalate() {
    if (!triage) return;
    setEscalating(true);
    try {
      const res = await api("/api/support/escalate", {
        method: "POST",
        body: JSON.stringify({
          category: triage.category,
          priority: triage.suggestedPriority,
          summary: text || triage.summary,
          stepsTried: triage.steps.join("\n"),
        }),
      });
      setEscalatedCase(res.case);
      reloadCases();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setEscalating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sand pb-4">
        <div>
          <div className="inline-block rounded-full bg-forest/10 px-3 py-1 text-xs font-semibold text-forest">
            Zecathon 6.0 · AI-Powered Transaction Investigation & Resolution
          </div>
          <h1 className="mt-2 font-display text-3xl text-forest">AI Customer Support & Complaint Triage</h1>
          <p className="mt-1 text-sm text-ink/70">
            Two-stage resolution: Instant step-by-step guidance for common issues; automatic urgency-ranked escalation to Zenith Bank.
          </p>
        </div>
      </div>

      {/* Security Banner */}
      <div className="rounded-xl border border-gold/40 bg-gold/10 p-4 text-xs text-ink/80">
        <span className="font-semibold text-forest">Security Rule:</span> Neither CAHS nor Zenith Bank will ever ask for
        your PIN, OTP, or password. Never disclose them in chat or over phone calls.
      </div>

      {/* Stage 1: Guided Self-Service */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl text-forest">Stage 1: Guided Self-Service</h2>
          <span className="rounded-full bg-sand/60 px-2.5 py-0.5 text-xs font-medium text-forest">Automated Triage</span>
        </div>

        <div>
          <p className="text-xs font-medium text-ink/70">Common scenarios (click to test):</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {samplePrompts.map((p, i) => (
              <button
                key={i}
                className="rounded-full border border-sand bg-sand/20 px-3 py-1 text-xs text-forest hover:border-leaf hover:bg-leaf/10"
                onClick={() => handleTriage(p)}
              >
                {p.slice(0, 48)}…
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Describe your issue in your own words</label>
          <textarea
            className="w-full rounded-xl border border-sand p-3 text-sm focus:border-leaf focus:outline-none"
            rows={3}
            placeholder="e.g. My account was debited ₦150,000 for order #ORD-123 but the status still says pending..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>

        <button
          className="rounded-full bg-forest px-6 py-2.5 text-sm font-medium text-cream hover:bg-forest/90 disabled:opacity-50"
          onClick={() => handleTriage()}
          disabled={loading || !text.trim()}
        >
          {loading ? "Analyzing system records…" : "Analyze with AI Assistant →"}
        </button>

        {err && <p className="text-sm text-clay">{err}</p>}

        {triage && (
          <div className="mt-4 space-y-4 rounded-2xl border border-sand bg-sand/15 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sand pb-3">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-ink/60">Identified Category:</span>
                <span className="ml-2 rounded-md bg-forest/10 px-2 py-0.5 text-xs font-bold text-forest">
                  {triage.category}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink/60">Assessed Urgency:</span>
                <span
                  className={`rounded-full px-3 py-0.5 text-xs font-bold uppercase tracking-wider ${
                    triage.suggestedPriority === "CRITICAL"
                      ? "bg-clay text-cream animate-pulse"
                      : triage.suggestedPriority === "HIGH"
                      ? "bg-gold text-forest font-semibold"
                      : "bg-forest/10 text-forest"
                  }`}
                >
                  {triage.suggestedPriority}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-sand bg-white p-3 text-xs">
              <span className="font-semibold text-forest">Internal System Context:</span> {triage.recordFact}
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink/70">Recommended Action Steps:</p>
              <ul className="mt-2 space-y-2">
                {triage.steps.map((st: string, idx: number) => (
                  <li key={idx} className="flex gap-2 text-sm text-ink/90">
                    <span className="font-bold text-forest">•</span>
                    <span>{st}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-sand pt-4">
              <p className="text-xs text-ink/70">Did these steps resolve your problem?</p>
              <div className="mt-2 flex flex-wrap gap-3">
                <button
                  className="rounded-full bg-leaf px-4 py-1.5 text-xs font-medium text-cream hover:bg-leaf/90"
                  onClick={() => {
                    setTriage(null);
                    setText("");
                    alert("Issue resolved! Thank you for using CAHS AI Support.");
                  }}
                >
                  ✓ Yes, issue is resolved
                </button>
                <button
                  className="rounded-full bg-clay px-4 py-1.5 text-xs font-medium text-cream hover:bg-clay/90 disabled:opacity-50"
                  onClick={handleEscalate}
                  disabled={escalating || Boolean(escalatedCase)}
                >
                  {escalating ? "Escalating…" : "No — Escalate to Zenith Bank Team →"}
                </button>
              </div>
            </div>
          </div>
        )}

        {escalatedCase && (
          <div className="rounded-xl border border-leaf bg-leaf/10 p-4">
            <p className="font-bold text-leaf">✓ Case #{escalatedCase.id.slice(0, 8)} Escalated to Zenith Bank Support</p>
            <p className="mt-1 text-xs text-ink/80">
              Assigned Priority: <strong>{escalatedCase.priority}</strong>. Status: <strong>{escalatedCase.status}</strong>.
              Your case has been placed in the bank review queue according to urgency. You do not need to repeat yourself.
            </p>
          </div>
        )}
      </Card>

      {/* Customer Tracking Table */}
      <Card className="space-y-3">
        <h2 className="font-display text-xl text-forest">My Complaint Cases & Status</h2>
        {!myCases?.cases?.length ? (
          <p className="text-xs text-ink/60">You have no open complaints logged.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-sand">
                  <th className="py-2">Case ID</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Officer</th>
                  <th>Summary</th>
                  <th>Resolution Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand/40">
                {myCases.cases.map((c: any) => (
                  <tr key={c.id}>
                    <td className="py-2 font-mono">{c.id.slice(0, 8)}</td>
                    <td className="font-semibold">{c.category}</td>
                    <td>
                      <span
                        className={`rounded px-1.5 py-0.5 text-xs font-semibold ${
                          c.priority === "CRITICAL" ? "bg-clay/20 text-clay" : c.priority === "HIGH" ? "bg-gold/20 text-forest" : "bg-sand"
                        }`}
                      >
                        {c.priority}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`rounded-full px-2 py-0.5 font-bold uppercase ${
                          c.status === "RESOLVED"
                            ? "bg-leaf text-cream"
                            : c.status === "INVESTIGATING"
                            ? "bg-gold text-forest"
                            : "bg-sand text-ink"
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td>{c.assignedTo || "Triage Pool"}</td>
                    <td className="max-w-xs truncate">{c.summary}</td>
                    <td className="text-leaf">{c.resolutionNote || "Pending investigation"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// =========================================================================
// Zecathon 6.0 Feature 1 (Bank Officer): Urgency-Ranked Complaint Queue
// =========================================================================
export function BankComplaintsQueue() {
  const [priority, setPriority] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const { data, reload } = useLoad(
    () => api(`/api/support/bank-queue?priority=${priority}&status=${status}`),
    [priority, status]
  );
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [note, setNote] = useState("");

  async function assignCase(id: string) {
    await api(`/api/support/cases/${id}/assign`, { method: "POST" });
    reload();
  }

  async function resolveCase(id: string) {
    await api(`/api/support/cases/${id}/resolve`, {
      method: "POST",
      body: JSON.stringify({ note: note || "Resolved after bank investigation." }),
    });
    setResolvingId(null);
    setNote("");
    reload();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sand pb-4">
        <div>
          <div className="inline-block rounded-full bg-forest/10 px-3 py-1 text-xs font-semibold text-forest">
            Zenith Bank Customer Care Portal
          </div>
          <h1 className="mt-2 font-display text-3xl text-forest">Urgency-Ranked Complaint Queue</h1>
          <p className="mt-1 text-sm text-ink/70">
            Cases are automatically scored and ranked by financial risk, perishable timelines, and fraud indicators.
          </p>
        </div>
      </div>

      {/* Metrics Ribbon */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-clay/30 bg-clay/5 p-4">
          <p className="text-xs font-semibold text-clay uppercase tracking-wider">Critical Priority</p>
          <p className="text-2xl font-bold text-clay">{data?.summary?.critical ?? 0}</p>
          <p className="text-xs text-ink/60">Debits without confirmation / fraud</p>
        </div>
        <div className="rounded-xl border border-gold/40 bg-gold/10 p-4">
          <p className="text-xs font-semibold text-gold-dark uppercase tracking-wider">High Priority</p>
          <p className="text-2xl font-bold text-forest">{data?.summary?.high ?? 0}</p>
          <p className="text-xs text-ink/60">Perishable loss / loan failure</p>
        </div>
        <div className="rounded-xl border border-sand bg-white p-4">
          <p className="text-xs font-semibold text-ink/70 uppercase tracking-wider">Medium Priority</p>
          <p className="text-2xl font-bold text-forest">{data?.summary?.medium ?? 0}</p>
          <p className="text-xs text-ink/60">Order & quality disputes</p>
        </div>
        <div className="rounded-xl border border-sand bg-white p-4">
          <p className="text-xs font-semibold text-leaf uppercase tracking-wider">Unresolved Total</p>
          <p className="text-2xl font-bold text-forest">{data?.summary?.unresolved ?? 0}</p>
          <p className="text-xs text-ink/60">Across all priority bands</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-ink/70">Priority:</span>
          {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((p) => (
            <button
              key={p}
              onClick={() => setPriority(p)}
              className={`rounded-full px-3 py-1 font-medium transition ${
                priority === p ? "bg-forest text-cream" : "border border-sand bg-white text-ink/80"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-ink/70">Status:</span>
          {["ALL", "RECEIVED", "INVESTIGATING", "RESOLVED"].map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded-full px-3 py-1 font-medium transition ${
                status === s ? "bg-forest text-cream" : "border border-sand bg-white text-ink/80"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Queue List */}
      <div className="space-y-3">
        {!data?.cases?.length ? (
          <Card>
            <p className="text-sm text-ink/60">No complaint cases match your selected filters.</p>
          </Card>
        ) : (
          data.cases.map((c: any) => (
            <Card
              key={c.id}
              className={`space-y-3 transition ${
                c.priority === "CRITICAL" && c.status !== "RESOLVED"
                  ? "border-clay bg-clay/5"
                  : c.priority === "HIGH" && c.status !== "RESOLVED"
                  ? "border-gold/50"
                  : ""
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sand pb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                      c.priority === "CRITICAL"
                        ? "bg-clay text-cream"
                        : c.priority === "HIGH"
                        ? "bg-gold text-forest font-semibold"
                        : "bg-sand text-ink"
                    }`}
                  >
                    {c.priority}
                  </span>
                  <span className="font-semibold text-forest">Case #{c.id.slice(0, 8)}</span>
                  <span className="text-xs text-ink/60">· {c.category}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span
                    className={`rounded-full px-2.5 py-0.5 font-bold uppercase ${
                      c.status === "RESOLVED"
                        ? "bg-leaf text-cream"
                        : c.status === "INVESTIGATING"
                        ? "bg-gold text-forest"
                        : "bg-sand text-ink/80"
                    }`}
                  >
                    {c.status}
                  </span>
                  <span className="text-ink/60">{new Date(c.createdAt).toLocaleTimeString()}</span>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="sm:col-span-2 space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink/60">Issue Summary:</p>
                  <p className="text-sm text-ink/90 font-medium">{c.summary}</p>
                  {c.stepsTried && (
                    <div className="mt-2 text-xs text-ink/70">
                      <span className="font-semibold">Stage 1 Tried:</span>
                      <pre className="mt-1 whitespace-pre-wrap rounded bg-sand/20 p-2 text-xs font-sans">{c.stepsTried}</pre>
                    </div>
                  )}
                  {c.resolutionNote && (
                    <div className="mt-2 rounded bg-leaf/10 p-2 text-xs text-leaf font-semibold">
                      Resolution: {c.resolutionNote}
                    </div>
                  )}
                </div>

                <div className="space-y-1 text-xs sm:border-l sm:border-sand sm:pl-3">
                  <p className="font-semibold text-forest">Customer Details:</p>
                  <p>{c.user?.fullName} ({c.user?.role})</p>
                  <p className="text-ink/60">{c.user?.phone}</p>
                  <p className="text-ink/60">{c.user?.email}</p>
                  {c.user?.isEligibleZenithCustomer && (
                    <span className="inline-block mt-1 rounded bg-gold/20 px-2 py-0.5 text-xs font-medium text-forest">
                      Zenith Account Linked
                    </span>
                  )}
                  <p className="mt-2 font-semibold text-forest">Assigned Officer:</p>
                  <p className="text-ink/80">{c.assignedTo || "Unassigned"}</p>
                </div>
              </div>

              {c.status !== "RESOLVED" && (
                <div className="flex flex-wrap items-center justify-end gap-2 border-t border-sand pt-3">
                  {!c.assignedTo && (
                    <button
                      className="rounded-full bg-forest px-4 py-1.5 text-xs font-medium text-cream hover:bg-forest/90"
                      onClick={() => assignCase(c.id)}
                    >
                      Assign to Me (Investigate)
                    </button>
                  )}
                  {resolvingId === c.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        className="rounded-lg border border-sand px-3 py-1 text-xs"
                        placeholder="Resolution note for customer..."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                      />
                      <button
                        className="rounded-full bg-leaf px-3 py-1 text-xs font-medium text-cream hover:bg-leaf/90"
                        onClick={() => resolveCase(c.id)}
                      >
                        Confirm Resolve
                      </button>
                      <button
                        className="rounded-full border border-sand px-3 py-1 text-xs"
                        onClick={() => setResolvingId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      className="rounded-full bg-leaf px-4 py-1.5 text-xs font-medium text-cream hover:bg-leaf/90"
                      onClick={() => setResolvingId(c.id)}
                    >
                      Mark Resolved
                    </button>
                  )}
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

// =========================================================================
// Zecathon 6.0 Feature 2: Pending-State Payment Protection Engine (Admin/Bank)
// =========================================================================
export function PaymentsEnginePage() {
  const { data, reload } = useLoad(() => api("/api/payments/pending-engine"));
  const [loading, setLoading] = useState(false);

  async function triggerRetry(ref: string) {
    setLoading(true);
    await api(`/api/payments/${ref}/retry-attempt`, { method: "POST" });
    reload();
    setLoading(false);
  }

  async function completeSuccess(ref: string) {
    setLoading(true);
    await api(`/api/payments/${ref}/complete-success`, { method: "POST" });
    reload();
    setLoading(false);
  }

  async function timeoutRelease(ref: string) {
    setLoading(true);
    await api(`/api/payments/${ref}/timeout-release`, { method: "POST" });
    reload();
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sand pb-4">
        <div>
          <div className="inline-block rounded-full bg-forest/10 px-3 py-1 text-xs font-semibold text-forest">
            Zecathon 6.0 · Strengthening Trust in Digital Banking
          </div>
          <h1 className="mt-2 font-display text-3xl text-forest">Pending-State Payment Protection Engine</h1>
          <p className="mt-1 text-sm text-ink/70">
            Rules-based engine that keeps incomplete transfers pending, retries them with the original reference, and prevents duplicate debits.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <p className="text-xs font-semibold text-forest uppercase tracking-wider">1. Single Customer Reference</p>
          <p className="mt-1 text-xs text-ink/70">
            Customer sees one clean transaction state. Repeated attempts and switch error codes are logged internally but hidden from user.
          </p>
        </Card>
        <Card>
          <p className="text-xs font-semibold text-forest uppercase tracking-wider">2. Exponential Backoff Retries</p>
          <p className="mt-1 text-xs text-ink/70">
            Automatic background retries at 30s, 2m, 5m, 15m intervals using the same transaction reference, making double debits impossible.
          </p>
        </Card>
        <Card>
          <p className="text-xs font-semibold text-forest uppercase tracking-wider">3. Timeout & Auto-Release</p>
          <p className="mt-1 text-xs text-ink/70">
            If retries expire, payment is marked "Not completed", funds holds are released, and zero debit is taken.
          </p>
        </Card>
      </div>

      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl text-forest">Active Pending Payments & Audit Ledger</h2>
          <button className="rounded-full border border-sand bg-white px-3 py-1 text-xs text-ink/80 hover:bg-sand/30" onClick={reload}>
            Refresh Ledger
          </button>
        </div>

        {!data?.pendingPayments?.length ? (
          <p className="text-xs text-ink/60">No pending transactions currently in the retry engine.</p>
        ) : (
          <div className="space-y-4">
            {data.pendingPayments.map((p: any) => (
              <div key={p.id} className="rounded-xl border border-sand bg-sand/15 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sand pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-forest">{p.providerRef}</span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${
                        p.status === "successful"
                          ? "bg-leaf text-cream"
                          : p.status === "not_completed"
                          ? "bg-clay/20 text-clay"
                          : "bg-gold/20 text-gold-dark animate-pulse"
                      }`}
                    >
                      {p.status.replaceAll("_", " ")}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-forest">{naira(p.amount)}</div>
                </div>

                <div className="grid gap-2 text-xs sm:grid-cols-3">
                  <div>
                    <span className="text-ink/60">Customer:</span> {p.user?.fullName} ({p.user?.email})
                  </div>
                  <div>
                    <span className="text-ink/60">Retry Count:</span> {p.retryCount} attempt(s)
                  </div>
                  <div>
                    <span className="text-ink/60">Hold Released:</span> {p.holdReleased ? "Yes" : "Active escrow"}
                  </div>
                </div>

                {/* Internal Timestamped Event Log */}
                {p.events?.length > 0 && (
                  <div className="rounded-lg bg-white p-3 border border-sand/60">
                    <p className="text-xs font-semibold uppercase tracking-wider text-ink/60">
                      Internal Switch Audit Events (Bank Reconciliation):
                    </p>
                    <div className="mt-1 max-h-32 overflow-y-auto space-y-1 text-xs font-mono text-ink/70">
                      {p.events.map((ev: any) => (
                        <div key={ev.id} className="flex justify-between border-b border-sand/30 py-0.5">
                          <span>{new Date(ev.createdAt).toLocaleTimeString()} · {ev.status}</span>
                          <span className="truncate max-w-xs text-ink/50">{ev.payload}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Engine Controls */}
                {p.status === "pending" && (
                  <div className="flex flex-wrap gap-2 pt-1 border-t border-sand">
                    <button
                      className="rounded-lg bg-leaf px-3 py-1.5 text-xs font-medium text-cream hover:bg-leaf/90"
                      onClick={() => completeSuccess(p.providerRef)}
                      disabled={loading}
                    >
                      Simulate Switch Success (Confirm)
                    </button>
                    <button
                      className="rounded-lg border border-sand bg-white px-3 py-1.5 text-xs font-medium text-ink/80 hover:bg-sand/20"
                      onClick={() => triggerRetry(p.providerRef)}
                      disabled={loading}
                    >
                      Trigger Background Retry (#{p.retryCount + 1})
                    </button>
                    <button
                      className="rounded-lg border border-clay bg-clay/10 px-3 py-1.5 text-xs font-medium text-clay hover:bg-clay/20"
                      onClick={() => timeoutRelease(p.providerRef)}
                      disabled={loading}
                    >
                      Simulate Timeout & Hold Release
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// =========================================================================
// Zecathon 6.0 Feature 3: Business Financial Insights
// =========================================================================
export function FinancialInsightsPage() {
  const { data, reload } = useLoad(() => api("/api/insights/my-summary"));
  const [toggling, setToggling] = useState(false);

  async function toggleConsent() {
    if (!data?.summary) return;
    setToggling(true);
    await api("/api/insights/toggle-consent", {
      method: "POST",
      body: JSON.stringify({ sharedWithBank: !data.summary.sharedWithBank }),
    });
    reload();
    setToggling(false);
  }

  const s = data?.summary;
  const b = data?.breakdown;
  const plan = data?.aiGrowthPlan;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sand pb-4">
        <div>
          <div className="inline-block rounded-full bg-forest/10 px-3 py-1 text-xs font-semibold text-forest">
            Zecathon 6.0 · Turning Customer Financial Data into Actionable Insights
          </div>
          <h1 className="mt-2 font-display text-3xl text-forest">Business Financial Insights</h1>
          <p className="mt-1 text-sm text-ink/70">
            Recorded money-in and money-out converted into revenue breakdowns, loss tracking, and an actionable AI growth plan.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-sand/60 px-3 py-1 text-xs font-semibold text-forest">
            {s?.monthLabel || "October 2026"} Summary
          </span>
        </div>
      </div>

      {/* Top 4 Key Financial Figures (Zecathon 6.0 Proposal Illustrative Example) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-sand bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-ink/60 uppercase tracking-wider">Total Revenue</p>
          <p className="mt-1 font-display text-2xl text-forest">{naira(s?.totalRevenue ?? 2400000)}</p>
          <p className="mt-1 text-xs font-semibold text-leaf">+{s?.revChangePercent ?? 12}% vs previous month</p>
        </div>

        <div className="rounded-2xl border border-sand bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-ink/60 uppercase tracking-wider">Total Expenditure</p>
          <p className="mt-1 font-display text-2xl text-ink">{naira(s?.totalExpenditure ?? 1650000)}</p>
          <p className="mt-1 text-xs text-ink/60">Inputs, storage, transport & fees</p>
        </div>

        <div className="rounded-2xl border border-clay/30 bg-clay/5 p-5 shadow-sm">
          <p className="text-xs font-semibold text-clay uppercase tracking-wider">Recorded Losses</p>
          <p className="mt-1 font-display text-2xl text-clay">{naira(s?.recordedLosses ?? 120000)}</p>
          <p className="mt-1 text-xs text-clay/80">Spoilage & rejected loads</p>
        </div>

        <div className="rounded-2xl border border-leaf/40 bg-leaf/10 p-5 shadow-sm">
          <p className="text-xs font-semibold text-leaf uppercase tracking-wider">Net Result</p>
          <p className="mt-1 font-display text-2xl text-forest">{naira(s?.netResult ?? 630000)}</p>
          <p className="mt-1 text-xs font-semibold text-forest">+{s?.prodChangePercent ?? 8}% production volume</p>
        </div>
      </div>

      {/* Detailed Breakdown Grids */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Revenue by Crop */}
        <Card className="space-y-3">
          <h2 className="font-display text-lg text-forest">Revenue by Produce Type</h2>
          <div className="space-y-3">
            {b?.revenueByCrop?.map((it: any, i: number) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span>{it.name}</span>
                  <span className="font-bold text-forest">{naira(it.amount)} ({it.percentage}%)</span>
                </div>
                <div className="h-2 w-full rounded-full bg-sand/40 overflow-hidden">
                  <div className="h-full bg-forest rounded-full" style={{ width: `${it.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Expenditure by Category */}
        <Card className="space-y-3">
          <h2 className="font-display text-lg text-forest">Expenditure Breakdown</h2>
          <div className="space-y-3">
            {b?.expenditureByCategory?.map((it: any, i: number) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span>{it.category}</span>
                  <span className="font-bold text-ink/80">{naira(it.amount)} ({it.percentage}%)</span>
                </div>
                <div className="h-2 w-full rounded-full bg-sand/40 overflow-hidden">
                  <div className="h-full bg-gold rounded-full" style={{ width: `${it.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Loss Tracking */}
        <Card className="space-y-3 border-clay/30">
          <h2 className="font-display text-lg text-clay">Recorded Loss Tracking</h2>
          <div className="space-y-3">
            {b?.lossesByCategory?.map((it: any, i: number) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span>{it.cause}</span>
                  <span className="font-bold text-clay">{naira(it.amount)} ({it.percentage}%)</span>
                </div>
                <div className="h-2 w-full rounded-full bg-sand/40 overflow-hidden">
                  <div className="h-full bg-clay rounded-full" style={{ width: `${it.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-ink/60">
            Loss recording helps identify cold-chain gaps and qualify for risk-mitigated credit terms.
          </p>
        </Card>
      </div>

      {/* AI Business Growth Plan */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between border-b border-sand pb-3">
          <div>
            <h2 className="font-display text-xl text-forest">AI Business Growth Plan</h2>
            <p className="text-xs text-ink/70">Actionable, explainable recommendations tailored to your recorded numbers.</p>
          </div>
          <span className="rounded-full bg-leaf/20 px-3 py-1 text-xs font-semibold text-forest">
            Indicative Recommendations
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {plan?.map((rec: any, idx: number) => (
            <div key={idx} className="rounded-xl border border-sand bg-sand/15 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="rounded bg-forest/10 px-2 py-0.5 text-xs font-bold text-forest">{rec.category}</span>
                <span className="text-xs font-semibold text-leaf">{rec.impact}</span>
              </div>
              <h3 className="font-semibold text-sm text-forest">{rec.title}</h3>
              <p className="text-xs text-ink/80 leading-relaxed">{rec.description}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Consent-Based Bank Sharing Card */}
      <Card className="border-gold/50 bg-gold/5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gold-dark">
              Consent-Based Data Sharing for Loan Assessment
            </p>
            <h2 className="mt-1 font-display text-xl text-forest">Share with Zenith Bank Credit Underwriters</h2>
            <p className="mt-1 text-xs text-ink/80 max-w-xl">
              By granting consent, you allow authorized Zenith Bank loan officers to review this verified monthly summary (revenue,
              expenses, net cash flow) directly during loan underwriting, eliminating manual bank statements.
            </p>
          </div>
          <button
            className={`rounded-full px-5 py-2.5 text-xs font-semibold transition ${
              s?.sharedWithBank
                ? "bg-leaf text-cream hover:bg-leaf/90"
                : "border border-forest bg-forest text-cream hover:bg-forest/90"
            }`}
            onClick={toggleConsent}
            disabled={toggling}
          >
            {s?.sharedWithBank ? "✓ Consent Active (Click to Pause)" : "Grant Consent to Share with Bank"}
          </button>
        </div>

        {s?.sharedWithBank && (
          <div className="rounded-lg border border-leaf/40 bg-white p-3 text-xs text-forest font-medium">
            ✓ Your financial insights profile is shared with Zenith Bank officers for credit assessment. Consent granted on{" "}
            {new Date(s.sharedAt || Date.now()).toLocaleDateString()}.
          </div>
        )}
      </Card>
    </div>
  );
}

// =========================================================================
// Zecathon 6.0 Feature 3 (Bank Officer): Customer Financial Insights View
// =========================================================================
export function BankCustomerInsights() {
  const [selectedUser, setSelectedUser] = useState("farmer@cahs.demo");
  const { data: usersData } = useLoad(() => api("/api/users?role=FARMER"));
  const { data, err } = useLoad(() => api(`/api/insights/bank-view/${selectedUser}`), [selectedUser]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sand pb-4">
        <div>
          <div className="inline-block rounded-full bg-forest/10 px-3 py-1 text-xs font-semibold text-forest">
            Zenith Bank Credit Underwriting Portal
          </div>
          <h1 className="mt-2 font-display text-3xl text-forest">Customer Financial Insights Verification</h1>
          <p className="mt-1 text-sm text-ink/70">
            Review applicant trading volume, cash flow, loss history and growth potential based on consent-shared platform records.
          </p>
        </div>
      </div>

      <Card className="space-y-3">
        <label className="block text-xs font-semibold uppercase tracking-wider text-ink/70">
          Select Applicant for Credit Assessment:
        </label>
        <div className="flex flex-wrap gap-2">
          {["farmer@cahs.demo", "trader.zenith@cahs.demo", "trader@cahs.demo"].map((u) => (
            <button
              key={u}
              onClick={() => setSelectedUser(u)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
                selectedUser === u ? "bg-forest text-cream" : "border border-sand bg-white text-ink/80"
              }`}
            >
              {u}
            </button>
          ))}
        </div>
      </Card>

      {err ? (
        <Card className="border-clay/40 bg-clay/5">
          <p className="text-sm font-semibold text-clay">Consent Not Granted</p>
          <p className="mt-1 text-xs text-ink/70">
            The selected applicant has not currently opted in to share their automated financial records with Zenith Bank.
            In compliance with NDPA data protection standards, financial data is only disclosed when customer consent is actively granted.
          </p>
        </Card>
      ) : data?.summary ? (
        <div className="space-y-6">
          <Card className="border-leaf/40 bg-leaf/5">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs font-semibold text-leaf uppercase tracking-wider">Consent Verified</p>
                <h2 className="font-display text-lg text-forest">{data.customer?.fullName} ({data.customer?.role})</h2>
                <p className="text-xs text-ink/60">{data.customer?.lga}, {data.customer?.state} · {data.customer?.email}</p>
              </div>
              <span className="rounded-full bg-leaf px-3 py-1 text-xs font-semibold text-cream">
                Platform Verified Ledger
              </span>
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-sand bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold text-ink/60 uppercase">Monthly Revenue</p>
              <p className="mt-1 font-display text-xl text-forest">{naira(data.summary.totalRevenue)}</p>
              <p className="text-xs text-leaf font-semibold">+{data.summary.revChangePercent}% vs prior month</p>
            </div>
            <div className="rounded-2xl border border-sand bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold text-ink/60 uppercase">Expenditure</p>
              <p className="mt-1 font-display text-xl text-ink">{naira(data.summary.totalExpenditure)}</p>
              <p className="text-xs text-ink/60">Operating costs</p>
            </div>
            <div className="rounded-2xl border border-clay/30 bg-clay/5 p-4 shadow-sm">
              <p className="text-xs font-semibold text-clay uppercase">Loss History</p>
              <p className="mt-1 font-display text-xl text-clay">{naira(data.summary.recordedLosses)}</p>
              <p className="text-xs text-clay/80">Spoilage & rejects</p>
            </div>
            <div className="rounded-2xl border border-leaf/40 bg-leaf/10 p-4 shadow-sm">
              <p className="text-xs font-semibold text-leaf uppercase">Net Margin Cash Flow</p>
              <p className="mt-1 font-display text-xl text-forest">{naira(data.summary.netResult)}</p>
              <p className="text-xs text-forest font-semibold">+{data.summary.prodChangePercent}% volume</p>
            </div>
          </div>

          <Card className="space-y-3">
            <h3 className="font-display text-lg text-forest">AI Growth & Affordability Assessment</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {data.aiGrowthPlan?.map((plan: any, i: number) => (
                <div key={i} className="rounded-xl border border-sand bg-sand/15 p-3 space-y-1">
                  <span className="rounded bg-forest/10 px-2 py-0.5 text-xs font-bold text-forest">{plan.category}</span>
                  <p className="font-semibold text-xs text-forest">{plan.title}</p>
                  <p className="text-xs text-ink/70 leading-relaxed">{plan.description}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-ink/60">
              Credit Note: Underwriting decisions remain strictly with authorized bank staff. Platform insights serve as decision support only.
            </p>
          </Card>
        </div>
      ) : (
        <p className="text-xs text-ink/60">Loading financial assessment records…</p>
      )}
    </div>
  );
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  useEffect(() => {
    if (!loading && !user) nav("/login");
  }, [loading, user, nav]);
  if (loading) return <p className="p-8">Loading session…</p>;
  if (!user) return null;
  return <>{children}</>;
}

export function useMemoSafe() {
  return useMemo(() => 1, []);
}
