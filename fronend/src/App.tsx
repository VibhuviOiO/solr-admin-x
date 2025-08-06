import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Collections from "./pages/Collections";
import ClusterNodes from "./pages/ClusterNodes";
import NodeDetail from "./pages/NodeDetail";
import DatacenterDetail from "./pages/DatacenterDetail";
import NotFound from "./pages/NotFound";
import ZKStatus from "./pages/ZKStatus";
import DatacenterDashboard from "./pages/DatacenterDashboard";
import DatacenterNodes from "./pages/DatacenterNodes";
import DatacenterSecurity from "./pages/DatacenterSecurity";
import DatacenterLogging from "./pages/DatacenterLogging";
import DatacenterJavaProperties from "./pages/DatacenterJavaProperties";
import DatacenterThreadDump from "./pages/DatacenterThreadDump";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/cluster/nodes" element={<ClusterNodes />} />
          <Route path="/datacenter/:datacenter" element={<DatacenterDetail />} />
          <Route path="/datacenter/:datacenter/dashboard" element={<DatacenterDashboard />} />
          <Route path="/datacenter/:datacenter/zk-status" element={<ZKStatus />} />
          <Route path="/datacenter/:datacenter/nodes" element={<DatacenterNodes />} />
          <Route path="/datacenter/:datacenter/security" element={<DatacenterSecurity />} />
          <Route path="/datacenter/:datacenter/logging" element={<DatacenterLogging />} />
          <Route path="/datacenter/:datacenter/java-properties" element={<DatacenterJavaProperties />} />
          <Route path="/datacenter/:datacenter/thread-dump" element={<DatacenterThreadDump />} />
          <Route path="/node/:nodeId" element={<NodeDetail />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
