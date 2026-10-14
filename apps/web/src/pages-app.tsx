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
      { label: "My Produce Listings", to: "/app/listings/mine", desc: "Publish crops and manage inventory" },
      { label: "Incoming Orders", to: "/app/orders", desc: "Accept or decline buyer purchase requests" },
      { label: "Book Warehouse Storage", to: "/app/storage", desc: "Reserve dry or cold storage at verified hubs" },
      { label: "Request Transport", to: "/app/logistics", desc: "Get quotes from verified haulage providers" },
      { label: "Agricultural Loans", to: "/app/loans", desc: "Apply for seasonal working capital with bank review" },
      { label: "Fixed-Term Savings", to: "/app/savings", desc: "Put harvest proceeds in projected-yield savings" },
    ],
    TRADER: [
      { label: "Marketplace Discovery", to: "/app/market", desc: "Source produce directly from verified farmers" },
      { label: "Order History", to: "/app/orders", desc: "Track purchases and pay via simulated sandbox" },
      { label: "Logistics & Shipments", to: "/app/logistics", desc: "Request haulage and track milestones in real-time" },
      { label: "Storage Facilities", to: "/app/storage", desc: "Secure warehouse space along transit routes" },
      { label: "Savings Options", to: "/app/savings", desc: "Fixed-term interest options held with Zenith Bank" },
    ],
    STORAGE_PROVIDER: [
      { label: "Warehouse Facilities", to: "/app/warehouse", desc: "Manage capacity, accept bookings and stock ledger" },
      { label: "Business CAC Verification", to: "/app/verification", desc: "Submit corporate credentials for approved status" },
    ],
    LOGISTICS_PROVIDER: [
      { label: "Jobs & Fleet", to: "/app/fleet", desc: "Manage drivers, vehicles and active assignments" },
      { label: "Delivery Requests & Quotes", to: "/app/logistics", desc: "Submit competitive bids for produce transport" },
      { label: "Business CAC Verification", to: "/app/verification", desc: "Submit corporate credentials for approved status" },
    ],
    BANK_OFFICER: [
      { label: "Loan Review Queue", to: "/app/bank/loans", desc: "Inspect loan-readiness checklists and underwrite credit" },
      { label: "Pilot Analytics Dashboard", to: "/app/admin/analytics", desc: "Monitor customer acquisition, retention and portfolio risk" },
      { label: "Product Configuration", to: "/app/admin/config", desc: "Configure loan tenors, savings rates and fee rules" },
    ],
    PLATFORM_ADMIN: [
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
  async function complete() {
    await api("/api/payments/sandbox/complete", { method: "POST", body: JSON.stringify({ reference: ref }) });
    nav("/app/orders");
  }
  return (
    <Card>
      <h1 className="font-display text-2xl">Simulated hosted checkout</h1>
      <p className="mt-2 text-sm">No card numbers are collected. Reference {ref}</p>
      <button className="mt-4 rounded-full bg-forest px-4 py-2 text-cream" onClick={complete}>
        Simulate successful payment
      </button>
    </Card>
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
