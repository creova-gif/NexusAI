import { Toaster } from "./components/ui/sonner";
import { Route, Switch } from "wouter";
import LandingPage from "./pages/LandingPage";
import ComplianceDashboard from "./pages/ComplianceDashboard";

export default function App() {
  return (
    <>
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/dashboard" component={ComplianceDashboard} />
        <Route path="/compliance" component={ComplianceDashboard} />
        <Route>
          {() => (
            <div className="min-h-screen flex items-center justify-center bg-[var(--navy-bg)]">
              <div className="text-center">
                <h1 className="text-4xl font-bold mb-4 text-white" style={{ fontFamily: "'DM Serif Display', serif" }}>404</h1>
                <p style={{ color: "var(--navy-text2)" }}>Page not found</p>
              </div>
            </div>
          )}
        </Route>
      </Switch>
      <Toaster />
    </>
  );
}
