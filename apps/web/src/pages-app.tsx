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
  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl text-forest">Hello, {user?.fullName}</h1>
      <p className="text-ink/70">Role: {user?.role.replaceAll("_", " ")}. Primary actions for your role are in the navigation.</p>
      {user?.isEligibleZenithCustomer && (
        <Card>
          <p className="text-sm font-semibold text-gold">Proposed partnership benefit</p>
          <p>Eligible Zenith customer status is linked (simulated). Reduced fees and discounts apply only while this flag is true and the rule is active.</p>
        </Card>
      )}
    </div>
  );
}

export function Market() {
  const [q, setQ] = useState("");
  const [compare, setCompare] = useState<string[]>([]);
  const { data } = useLoad(() => api(`/api/listings?q=${encodeURIComponent(q)}`), [q]);
  return (
    <div>
      <h1 className="font-display text-3xl">Marketplace</h1>
      <input className="mt-4 w-full rounded-lg border border-sand px-3 py-2" placeholder="Search produce" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {data?.listings?.map((l: any) => (
          <Card key={l.id}>
            <div className="flex justify-between">
              <h2 className="font-display text-xl capitalize">{l.produceType}</h2>
              <span className="text-sm">{l.grade}</span>
            </div>
            <p>
              {l.quantity} {l.unit} · {naira(l.pricePerUnit)} / {l.unit}
            </p>
            <p className="text-sm text-ink/60">
              {l.state} · {l.farmer.fullName}
            </p>
            <div className="mt-3 flex gap-2 text-sm">
              <Link className="text-leaf underline" to={`/app/listings/${l.id}`}>
                Open
              </Link>
              <button
                className="underline"
                onClick={() => setCompare((c) => (c.includes(l.id) ? c.filter((x) => x !== l.id) : [...c, l.id].slice(0, 3)))}
              >
                {compare.includes(l.id) ? "Remove compare" : "Compare"}
              </button>
            </div>
          </Card>
        ))}
      </div>
      {compare.length > 1 && (
        <p className="mt-4">
          <Link className="text-leaf underline" to={`/app/compare?ids=${compare.join(",")}`}>
            Compare {compare.length} listings
          </Link>
        </p>
      )}
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
        <h1 className="font-display text-3xl capitalize">{listing.produceType}</h1>
        <p>
          {listing.quantity} {listing.unit} available · {naira(listing.pricePerUnit)}
        </p>
        <p className="text-sm">
          {listing.state}, {listing.lga} · Grade {listing.grade}
        </p>
        {data.priceInsight && (
          <p className="mt-4 text-sm">
            Indicative price range {data.priceInsight.indicativeMin}–{data.priceInsight.indicativeMax} ({data.priceInsight.demandSignal}).{" "}
            {data.priceInsight.basis} Confidence: {data.priceInsight.confidence}.
          </p>
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
        <h1 className="font-display text-2xl">New listing</h1>
        <form onSubmit={create} className="mt-3 space-y-2 text-sm">
          <input name="produceType" placeholder="Produce" className="w-full rounded border border-sand px-2 py-1" required />
          <input name="quantity" type="number" placeholder="Quantity" className="w-full rounded border border-sand px-2 py-1" required />
          <input name="unit" defaultValue="kg" className="w-full rounded border border-sand px-2 py-1" />
          <input name="pricePerUnit" type="number" placeholder="Price per unit" className="w-full rounded border border-sand px-2 py-1" required />
          <select name="grade" className="w-full rounded border border-sand px-2 py-1">
            <option>A</option>
            <option>B</option>
            <option>C</option>
          </select>
          <input name="harvestNotes" placeholder="Harvest notes" className="w-full rounded border border-sand px-2 py-1" />
          <button className="rounded-full bg-forest px-4 py-2 text-cream">Publish</button>
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
  const { data, reload } = useLoad(() => api("/api/orders").then((d) => d.orders.find((o: any) => o.id === id)), [id]);
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
    <Card>
      <h1 className="font-display text-2xl">Order {data.status}</h1>
      <ul className="mt-3 text-sm">
        <li>Produce subtotal {naira(data.subtotal)}</li>
        <li>Platform fee {naira(data.platformFee)} {data.zenithDiscount ? `(Zenith discount ${naira(data.zenithDiscount)}, funder ${data.discountFunder})` : ""}</li>
        <li>Logistics {naira(data.logisticsCharge)}</li>
        <li className="font-semibold">Total due {naira(data.totalDue)}</li>
      </ul>
      {data.status === "payment_pending" && (
        <button className="mt-4 rounded-full bg-forest px-4 py-2 text-cream" onClick={pay}>
          Pay in sandbox
        </button>
      )}
      {data.status === "delivered" && (
        <button className="mt-4 rounded-full bg-forest px-4 py-2 text-cream" onClick={complete}>
          Confirm receipt
        </button>
      )}
      {data.deliveryMode === "logistics" && (
        <Link className="mt-4 block text-leaf underline" to="/app/logistics">
          Arrange / track logistics
        </Link>
      )}
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
      {occ?.facilities && <pre className="overflow-auto rounded bg-white p-3 text-xs">{JSON.stringify(occ.facilities, null, 2)}</pre>}
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
  const { data, reload } = useLoad(() => api(`/api/storage/bookings/${id}/ledger`), [id]);
  async function move(kind: string) {
    await api(`/api/storage/bookings/${id}/movement`, { method: "POST", body: JSON.stringify({ kind, quantity: 10, condition: "good" }) });
    reload();
  }
  if (!data) return <p>Loading…</p>;
  return (
    <Card>
      <h1 className="font-display text-2xl">Stock ledger</h1>
      <p>
        Intake {data.intake} · Dispatch {data.dispatch} · Balance {data.balance}
      </p>
      <div className="mt-3 flex gap-2">
        <button className="rounded border px-3 py-1" onClick={() => move("intake")}>
          Record intake +10
        </button>
        <button className="rounded border px-3 py-1" onClick={() => move("dispatch")}>
          Record dispatch +10
        </button>
      </div>
      <ul className="mt-4 text-sm">
        {data.booking.movements.map((m: any) => (
          <li key={m.id}>
            {m.kind} {m.quantity} · {m.condition}
          </li>
        ))}
      </ul>
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
