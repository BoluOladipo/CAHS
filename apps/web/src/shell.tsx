import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "./auth";

export function Banners() {
  return (
    <div className="text-xs sm:text-sm">
      <div className="banner-proto px-3 py-2 text-center">
        Prototype: simulated payments, loans and savings. No real funds are handled.
      </div>
      <div className="banner-concept px-3 py-1.5 text-center font-medium">
        Concept proposal. Subject to validation, approvals and partnership agreements.
      </div>
    </div>
  );
}

const NAV: Record<string, { to: string; label: string }[]> = {
  FARMER: [
    { to: "/app", label: "Home" },
    { to: "/app/listings/mine", label: "My listings" },
    { to: "/app/orders", label: "Orders" },
    { to: "/app/storage", label: "Storage" },
    { to: "/app/logistics", label: "Transport" },
    { to: "/app/insights", label: "Financial insights" },
    { to: "/app/support", label: "AI Support & Triage" },
    { to: "/app/loans", label: "Loans" },
    { to: "/app/savings", label: "Savings" },
    { to: "/app/rewards", label: "Rewards" },
  ],
  TRADER: [
    { to: "/app", label: "Home" },
    { to: "/app/market", label: "Market" },
    { to: "/app/orders", label: "Orders" },
    { to: "/app/logistics", label: "Shipments" },
    { to: "/app/storage", label: "Storage" },
    { to: "/app/insights", label: "Financial insights" },
    { to: "/app/support", label: "AI Support & Triage" },
    { to: "/app/loans", label: "Loans" },
    { to: "/app/savings", label: "Savings" },
  ],
  STORAGE_PROVIDER: [
    { to: "/app", label: "Home" },
    { to: "/app/warehouse", label: "Facilities" },
    { to: "/app/support", label: "AI Support" },
    { to: "/app/verification", label: "Verification" },
  ],
  LOGISTICS_PROVIDER: [
    { to: "/app", label: "Home" },
    { to: "/app/fleet", label: "Jobs & fleet" },
    { to: "/app/support", label: "AI Support" },
    { to: "/app/verification", label: "Verification" },
  ],
  BANK_OFFICER: [
    { to: "/app", label: "Home" },
    { to: "/app/bank/loans", label: "Loan queue" },
    { to: "/app/bank/complaints", label: "Complaint queue" },
    { to: "/app/bank/insights", label: "Customer insights" },
    { to: "/app/admin/analytics", label: "Pilot dashboard" },
    { to: "/app/admin/config", label: "Products" },
  ],
  PLATFORM_ADMIN: [
    { to: "/app", label: "Home" },
    { to: "/app/admin/payments-engine", label: "Pending payments engine" },
    { to: "/app/bank/complaints", label: "Complaint queue" },
    { to: "/app/admin/verify", label: "Verifications" },
    { to: "/app/admin/disputes", label: "Disputes" },
    { to: "/app/admin/audit", label: "Audit" },
    { to: "/app/admin/analytics", label: "Analytics" },
    { to: "/app/admin/config", label: "Config" },
  ],
};

export function AppShell() {
  const { user, logout } = useAuth();
  const links = NAV[user?.role ?? ""] ?? [];
  return (
    <div className="min-h-screen">
      <Banners />
      <header className="border-b border-sand bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link to="/app" className="font-display text-xl text-forest">
            CAHS
          </Link>
          <nav className="flex flex-wrap gap-3 text-sm">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === "/app"}
                className={({ isActive }) => (isActive ? "font-semibold text-leaf" : "text-ink/80")}
              >
                {l.label}
              </NavLink>
            ))}
            <NavLink to="/app/assistant" className="text-ink/80">
              Helper
            </NavLink>
            <NavLink to="/app/privacy" className="text-ink/80">
              Consents
            </NavLink>
          </nav>
          <div className="flex items-center gap-3 text-sm">
            {user?.isEligibleZenithCustomer && (
              <span className="rounded-full bg-gold/20 px-2 py-0.5 text-xs">Zenith-eligible (proposed)</span>
            )}
            <span className="hidden sm:inline">{user?.fullName}</span>
            <button className="text-leaf underline" onClick={() => logout()}>
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
      <footer className="border-t border-sand px-4 py-6 text-center text-xs text-ink/70">
        Oladipo Boluwaduro Emmanuel (Project Lead) · team@cahs.ng · +234 812 345 6789 · Report fraud or error via the in-app form.
        Gross transaction value and customer deposits are not CAHS revenue.
      </footer>
    </div>
  );
}

export function PublicShell() {
  return (
    <div>
      <Banners />
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link to="/" className="font-display text-2xl text-forest">
          Centralized Agro Hub
        </Link>
        <nav className="flex gap-4 text-sm">
          <Link to="/partnership">Zenith proposal</Link>
          <Link to="/team">Team</Link>
          <Link to="/login" className="rounded-full bg-forest px-4 py-1.5 text-cream">
            Log in
          </Link>
        </nav>
      </header>
      <Outlet />
      <footer className="mt-16 border-t border-sand px-4 py-8 text-center text-xs text-ink/70">
        Concept proposal. Subject to validation, approvals and partnership agreements.
        <br />
        Oladipo Boluwaduro Emmanuel (Project Lead) · team@cahs.ng · +234 812 345 6789
      </footer>
    </div>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-sand bg-white p-5 shadow-sm ${className}`}>{children}</div>;
}
