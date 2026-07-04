import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AllNotes from "./pages/AllNotes";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NoteEditor from "./pages/NoteEditor";
import KnowledgeGraph from "./pages/KnowledgeGraph";
import TagExplorer from "./pages/TagExplorer";
import PublicShare from "./pages/PublicShare";
import Settings from "./pages/Settings";
import Collections from "./pages/Collections";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/signup" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/notes" element={<AllNotes />} />
          <Route path="/editor/:noteId" element={<NoteEditor />} />
          <Route path="/graph" element={<KnowledgeGraph />} />
          <Route path="/tags" element={<TagExplorer />} />
          <Route path="/share/:slug" element={<PublicShare />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
