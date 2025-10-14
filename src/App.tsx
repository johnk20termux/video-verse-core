import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Browse from "./pages/Browse";
import MovieDetail from "./pages/MovieDetail";
import Watchlist from "./pages/Watchlist";
import Addons from "./pages/Addons";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Navigation from "./components/Navigation";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<ProtectedRoute><Navigation /><Home /></ProtectedRoute>} />
            <Route path="/browse" element={<ProtectedRoute><Navigation /><Browse /></ProtectedRoute>} />
            <Route path="/movie/:id" element={<ProtectedRoute><Navigation /><MovieDetail /></ProtectedRoute>} />
            <Route path="/watchlist" element={<ProtectedRoute><Navigation /><Watchlist /></ProtectedRoute>} />
            <Route path="/addons" element={<ProtectedRoute><Navigation /><Addons /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
