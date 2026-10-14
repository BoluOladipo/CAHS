import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell, PublicShell } from "./shell";
import { Landing, Login, Partnership, Register, Team } from "./pages-public";
import {
  AdminAudit,
  AdminConfig,
  AdminDisputes,
  AdminVerify,
  Analytics,
  Assistant,
  BankQueue,
  BankComplaintsQueue,
  BankCustomerInsights,
  Compare,
  FarmerListings,
  FinancialInsightsPage,
  FleetPage,
  FraudForm,
  Home,
  Ledger,
  ListingDetail,
  LoanDetail,
  LoansPage,
  LogisticsPage,
  Market,
  OrderDetail,
  Orders,
  PaymentsEnginePage,
  PaySandbox,
  PrivacyPage,
  RequireAuth,
  Rewards,
  SavingsPage,
  Shipment,
  StoragePage,
  SupportPage,
  VerificationPage,
  WarehouseOps,
} from "./pages-app";

export default function App() {
  return (
    <Routes>
      <Route element={<PublicShell />}>
        <Route path="/" element={<Landing />} />
        <Route path="/partnership" element={<Partnership />} />
        <Route path="/team" element={<Team />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>
      <Route
        path="/app"
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route index element={<Home />} />
        <Route path="market" element={<Market />} />
        <Route path="compare" element={<Compare />} />
        <Route path="listings/mine" element={<FarmerListings />} />
        <Route path="listings/:id" element={<ListingDetail />} />
        <Route path="orders" element={<Orders />} />
        <Route path="orders/:id" element={<OrderDetail />} />
        <Route path="pay" element={<PaySandbox />} />
        <Route path="logistics" element={<LogisticsPage />} />
        <Route path="fleet" element={<FleetPage />} />
        <Route path="shipments/:id" element={<Shipment />} />
        <Route path="storage" element={<StoragePage />} />
        <Route path="warehouse" element={<WarehouseOps />} />
        <Route path="ledger/:id" element={<Ledger />} />
        <Route path="loans" element={<LoansPage />} />
        <Route path="loans/:id" element={<LoanDetail />} />
        <Route path="bank/loans" element={<BankQueue />} />
        <Route path="bank/complaints" element={<BankComplaintsQueue />} />
        <Route path="bank/insights" element={<BankCustomerInsights />} />
        <Route path="insights" element={<FinancialInsightsPage />} />
        <Route path="support" element={<SupportPage />} />
        <Route path="savings" element={<SavingsPage />} />
        <Route path="assistant" element={<Assistant />} />
        <Route path="privacy" element={<PrivacyPage />} />
        <Route path="rewards" element={<Rewards />} />
        <Route path="verification" element={<VerificationPage />} />
        <Route path="admin/payments-engine" element={<PaymentsEnginePage />} />
        <Route path="admin/verify" element={<AdminVerify />} />
        <Route path="admin/disputes" element={<AdminDisputes />} />
        <Route path="admin/audit" element={<AdminAudit />} />
        <Route path="admin/analytics" element={<Analytics />} />
        <Route path="admin/config" element={<AdminConfig />} />
        <Route path="report" element={<FraudForm />} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
