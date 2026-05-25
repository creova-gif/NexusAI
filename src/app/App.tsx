import { Toaster } from "./components/ui/sonner";
import { Route, Switch } from "wouter";
import LandingPage from "./pages/LandingPage";
import ComplianceDashboard from "./pages/ComplianceDashboard";
import AMLAlerts from "./pages/AMLAlerts";
import EntityGraph from "./pages/EntityGraph";
import KycOnboarding from "./pages/KycOnboarding";
import SanctionsScreening from "./pages/SanctionsScreening";
import SARGenerator from "./pages/SARGenerator";
import FinancialAdvisory from "./pages/FinancialAdvisory";
import OpenBanking from "./pages/OpenBanking";
import AuditTrail from "./pages/AuditTrail";
import SystemHealth from "./pages/SystemHealth";
import CaseManagement from "./pages/CaseManagement";
import SupervisorQueue from "./pages/SupervisorQueue";
import RulesEngine from "./pages/RulesEngine";
import RiskProfile from "./pages/RiskProfile";
import WatchlistScreening from "./pages/WatchlistScreening";
import UboDiscovery from "./pages/UboDiscovery";
import RegulatoryReporting from "./pages/RegulatoryReporting";
import AgentInvestigator from "./pages/AgentInvestigator";
import CryptoForensics from "./pages/CryptoForensics";
import FederatedLearning from "./pages/FederatedLearning";
import DeepfakeDetection from "./pages/DeepfakeDetection";
import CommHub from "./pages/CommHub";
import WorkflowBuilder from "./pages/WorkflowBuilder";
import MakerChecker from "./pages/MakerChecker";
import ProductTour from "./pages/ProductTour";

export default function App() {
  return (
    <>
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/tour" component={ProductTour} />
        <Route path="/dashboard" component={ComplianceDashboard} />
        <Route path="/compliance" component={ComplianceDashboard} />
        <Route path="/alerts" component={AMLAlerts} />
        <Route path="/network" component={EntityGraph} />
        <Route path="/kyc" component={KycOnboarding} />
        <Route path="/sanctions" component={SanctionsScreening} />
        <Route path="/sar" component={SARGenerator} />
        <Route path="/advisory" component={FinancialAdvisory} />
        <Route path="/openbanking" component={OpenBanking} />
        <Route path="/audit" component={AuditTrail} />
        <Route path="/admin" component={SystemHealth} />
        <Route path="/cases" component={CaseManagement} />
        <Route path="/supervisor" component={SupervisorQueue} />
        <Route path="/rules" component={RulesEngine} />
        <Route path="/risk-profile" component={RiskProfile} />
        <Route path="/screening" component={WatchlistScreening} />
        <Route path="/ubo" component={UboDiscovery} />
        <Route path="/reporting" component={RegulatoryReporting} />
        <Route path="/agent" component={AgentInvestigator} />
        <Route path="/crypto-graph" component={CryptoForensics} />
        <Route path="/federated" component={FederatedLearning} />
        <Route path="/deepfake" component={DeepfakeDetection} />
        <Route path="/comms" component={CommHub} />
        <Route path="/workflow-builder" component={WorkflowBuilder} />
        <Route path="/qa-checker" component={MakerChecker} />
        <Route>
          {() => (
            <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
              <div className="text-center">
                <h1 className="text-4xl font-bold mb-4 text-white font-['Instrument_Serif']">404</h1>
                <p className="text-[var(--text-purple-2)]">Page not found</p>
              </div>
            </div>
          )}
        </Route>
      </Switch>
      <Toaster />
    </>
  );
}
