import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Analyze from "./pages/Analyze";
import Journal from "./pages/Journal";
import Chat from "./pages/Chat";
import VoiceTherapy from "./pages/VoiceTherapy";
import Dashboard from "./pages/Dashboard";
import About from "./pages/About";
import Meditation from "./pages/Meditation";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-16 h-16 rounded-full gradient-bg breathing-animation"></div></div>;

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={!session ? <Auth /> : <Navigate to="/" />} />
            <Route path="/" element={session ? <Home /> : <Navigate to="/auth" />} />
            <Route path="/analyze" element={session ? <Analyze /> : <Navigate to="/auth" />} />
            <Route path="/journal" element={session ? <Journal /> : <Navigate to="/auth" />} />
            <Route path="/chat" element={session ? <Chat /> : <Navigate to="/auth" />} />
            <Route path="/voice-therapy" element={session ? <VoiceTherapy /> : <Navigate to="/auth" />} />
            <Route path="/dashboard" element={session ? <Dashboard /> : <Navigate to="/auth" />} />
            <Route path="/meditation" element={session ? <Meditation /> : <Navigate to="/auth" />} />
            <Route path="/about" element={session ? <About /> : <Navigate to="/auth" />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
