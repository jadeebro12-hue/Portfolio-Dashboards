import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { DataStateProvider } from '@/lib/data-state';
import NotFound from '@/pages/not-found';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

import Overview from '@/pages/overview';
import PropertiesList from '@/pages/properties';
import PropertyDetail from '@/pages/property-detail';
import ComplianceTracker from '@/pages/compliance';
import InvestorsList from '@/pages/investors';
import Alerts from '@/pages/alerts';
import DataTrust from '@/pages/data-trust';
import Activity from '@/pages/activity';
import Diagnosis from '@/pages/diagnosis';
import ActionQueue from '@/pages/action-queue';
import Methodology from '@/pages/methodology';
import { FiltersProvider } from '@/lib/analytics/use-analytics';

const queryClient = new QueryClient();

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Overview} />
        <Route path="/properties" component={PropertiesList} />
        <Route path="/properties/:id" component={PropertyDetail} />
        <Route path="/compliance" component={ComplianceTracker} />
        <Route path="/investors" component={InvestorsList} />
        <Route path="/alerts" component={Alerts} />
        <Route path="/data-trust" component={DataTrust} />
        <Route path="/activity" component={Activity} />
        <Route path="/diagnosis" component={Diagnosis} />
        <Route path="/actions" component={ActionQueue} />
        <Route path="/methodology" component={Methodology} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DataStateProvider>
        <FiltersProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
        </FiltersProvider>
      </DataStateProvider>
    </QueryClientProvider>
  );
}

export default App;
