import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "./api";
import { useAuth } from "./auth";
import { Card } from "./shell";

export function Landing() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-16">
      <section className="grid gap-10 py-12 md:grid-cols-2 md:items-center">
        <div>
          <p className="text-sm uppercase tracking-widest text-leaf">Nigeria · ₦ · demo prototype</p>
          <h1 className="mt-3 font-display text-4xl leading-tight text-forest md:text-5xl">
            Make agricultural trade easier to finance, store, pay for and deliver.
          </h1>
          <p className="mt-4 text-lg text-ink/80">
            CAHS connects farmers, buyers, warehouses, verified logistics firms and financial institutions in one
            coordinated ecosystem — while giving Zenith Bank a measurable channel for customer acquisition, engagement
            and responsible lending.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/login" className="rounded-full bg-forest px-5 py-2.5 text-cream">
              Open the demo
            </Link>
            <Link to="/partnership" className="rounded-full border border-forest px-5 py-2.5">
              Proposed partnership
            </Link>
          </div>
        </div>
        <Card>
          <h2 className="font-display text-2xl">Who it is for</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>Farmers — list produce, book storage, request transport, apply for loans.</li>
            <li>Traders — source, pay (simulated), track delivery, compare prices.</li>
            <li>Warehouses & logistics — verified jobs, occupancy, proof of delivery.</li>
            <li>Bank officers — human review of loan applications. AI never decides.</li>
          </ul>
          <p className="mt-4 text-xs text-ink/60">All money movement in this build is simulated.</p>
        </Card>
      </section>
    </div>
  );
}

export function Partnership() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-sm font-semibold text-clay">Proposed partnership benefit · not an existing agreement</p>
      <h1 className="mt-2 font-display text-4xl text-forest">Zenith Bank concept proposal</h1>
      <p className="mt-4">
        This page summarises a proposed pilot. Zenith Bank has not agreed to any of the items below. Every financial
        product remains subject to validation, approvals and partnership agreements.
      </p>
      <ul className="mt-6 list-disc space-y-2 pl-5">
        <li>Reduced transaction charges for eligible Zenith customers (illustration: ₦100,000 → ₦1,600 fee vs ₦2,000).</li>
        <li>Discounted logistics (illustration: ₦50,000 → ₦47,000). Discount funder is always shown.</li>
        <li>Progressive agricultural loan pathway. Officers decide. History may be considered; it never guarantees a larger loan.</li>
        <li>Fixed-term savings option administered by the bank (simulated). Returns are projected.</li>
        <li>Pilot dashboard: customer growth, marketplace activity, service quality, financial outcomes.</li>
      </ul>
      <h2 className="mt-8 font-display text-2xl">Requested next steps</h2>
      <ol className="mt-3 list-decimal space-y-2 pl-5">
        <li>Validate the problem with agricultural and bank stakeholders.</li>
        <li>Security, legal and compliance review.</li>
        <li>Agree pilot clusters, incentive funding and product configuration.</li>
        <li>Only then consider Phase 3 integrations with approved infrastructure.</li>
      </ol>
    </div>
  );
}

export function Team() {
  const rows = [
    [
      "Oladipo Boluwaduro Emmanuel",
      "Full-stack Developer / Project Manager",
      "Leads the build of the platform (marketplace, storage and logistics modules, payments flow and pending-state retry engine), manages scope, timeline and delivery, and coordinates the team.",
    ],
    [
      "Oladeji Martins",
      "AI / Business Analyst",
      "Designs the AI assistant, complaint urgency triage and growth-plan logic, and shapes the business model, bank incentives, lending pathway and partner discussions.",
    ],
    [
      "Obinyan Emmanuel Onosetale",
      "Data Analyst",
      "Builds the financial insights: revenue and expenditure breakdowns, production and revenue change (%), loss tracking and pilot metrics reporting.",
    ],
    [
      "Kayode Toluwani Prosper",
      "QA / QT",
      "Tests every feature before demo, including payment retry and pending states, complaint routing and data accuracy, and checks security, reliability and usability.",
    ],
  ];
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="inline-block rounded-full bg-forest/10 px-3 py-1 text-xs font-semibold text-forest">
        Zenith Bank Zecathon 6.0 Entry
      </div>
      <h1 className="mt-2 font-display text-4xl text-forest">Team and Expertise</h1>
      <p className="mt-2 text-sm text-ink/80">
        A multidisciplinary team of four, within the Zecathon limit of 2–4 members. Agricultural operations, finance and
        partnership responsibilities are shared across the team and led by the AI / Business Analyst.
      </p>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-sand">
              <th className="py-2 font-semibold">Team member</th>
              <th className="font-semibold">Role</th>
              <th className="font-semibold">How the role contributes to CAHS</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([name, role, contrib], i) => (
              <tr key={i} className="border-b border-sand/70">
                <td className="py-3 pr-4 font-medium text-forest">{name}</td>
                <td className="py-3 pr-4 text-ink/90">{role}</td>
                <td className="py-3 text-xs leading-relaxed text-ink/70">{contrib}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-8 rounded-2xl border border-sand bg-sand/30 p-4 text-xs text-ink/80">
        <span className="font-semibold">Official Contact:</span> Oladipo Boluwaduro Emmanuel (Project Lead) ·{" "}
        <a href="mailto:team@cahs.ng" className="text-leaf underline">
          team@cahs.ng
        </a>{" "}
        · +234 812 345 6789 · Lagos, Nigeria
      </div>
    </div>
  );
}

export function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("trader.zenith@cahs.demo");
  const [password, setPassword] = useState("Demo1234!");
  const [otp, setOtp] = useState("");
  const [err, setErr] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr("");
    try {
      await login(email, password, otp || undefined);
      nav("/app");
    } catch (ex) {
      setErr((ex as Error).message);
    }
  }

  const demos = [
    ["farmer@cahs.demo", "Farmer"],
    ["trader.zenith@cahs.demo", "Zenith-eligible trader"],
    ["trader@cahs.demo", "Non-Zenith trader"],
    ["storage@cahs.demo", "Storage"],
    ["logistics@cahs.demo", "Logistics (verified)"],
    ["logistics.unverified@cahs.demo", "Logistics (unverified)"],
    ["bank@cahs.demo", "Bank officer (OTP 123456)"],
    ["admin@cahs.demo", "Admin (OTP 123456)"],
  ];

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="font-display text-3xl text-forest">Log in to the demo</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        <label className="block text-sm">
          Email
          <input className="mt-1 w-full rounded-lg border border-sand px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="block text-sm">
          Password
          <input type="password" className="mt-1 w-full rounded-lg border border-sand px-3 py-2" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <label className="block text-sm">
          Simulated OTP (staff only)
          <input className="mt-1 w-full rounded-lg border border-sand px-3 py-2" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="123456" />
        </label>
        {err && <p className="text-sm text-clay">{err}</p>}
        <button className="w-full rounded-full bg-forest py-2.5 text-cream">Enter</button>
      </form>
      <p className="mt-6 text-sm font-medium">Demo accounts (password Demo1234!)</p>
      <ul className="mt-2 space-y-1 text-sm">
        {demos.map(([e, r]) => (
          <li key={e}>
            <button className="text-leaf underline" onClick={() => setEmail(e)}>
              {e}
            </button>{" "}
            — {r}
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm">
        New user? <Link to="/register">Register</Link>
      </p>
    </div>
  );
}

export function Register() {
  const nav = useNavigate();
  const { login } = useAuth();
  const [err, setErr] = useState("");
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await api("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email: fd.get("email"),
          phone: fd.get("phone"),
          password: fd.get("password"),
          fullName: fd.get("fullName"),
          role: fd.get("role"),
          state: fd.get("state"),
          lga: fd.get("lga"),
        }),
      });
      await login(String(fd.get("email")), String(fd.get("password")));
      nav("/app");
    } catch (ex) {
      setErr((ex as Error).message);
    }
  }
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="font-display text-3xl">Create an account</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        {["fullName", "email", "phone", "password", "state", "lga"].map((n) => (
          <label key={n} className="block text-sm capitalize">
            {n}
            <input name={n} required className="mt-1 w-full rounded-lg border border-sand px-3 py-2" />
          </label>
        ))}
        <label className="block text-sm">
          Role
          <select name="role" className="mt-1 w-full rounded-lg border border-sand px-3 py-2">
            <option value="FARMER">Farmer</option>
            <option value="TRADER">Trader / Buyer</option>
            <option value="STORAGE_PROVIDER">Storage provider</option>
            <option value="LOGISTICS_PROVIDER">Logistics provider</option>
          </select>
        </label>
        {err && <p className="text-clay text-sm">{err}</p>}
        <button className="w-full rounded-full bg-forest py-2 text-cream">Register</button>
      </form>
    </div>
  );
}
