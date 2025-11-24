import { Link, useNavigate } from "react-router-dom";
import { Heart, Home, Brain, BookHeart, MessageCircle, BarChart3, Sparkles, Info, LogOut } from "lucide-react";
import { Button } from "./ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Navigation = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    } else {
      navigate("/auth");
      toast({
        title: "Signed out successfully",
        description: "Come back soon!",
      });
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center pulse-glow">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold gradient-text">Aletheia</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            <NavButton to="/" icon={Home} label="Home" />
            <NavButton to="/analyze" icon={Brain} label="Analyze" />
            <NavButton to="/journal" icon={BookHeart} label="Journal" />
            <NavButton to="/chat" icon={MessageCircle} label="Chat with Sol" />
            <NavButton to="/meditation" icon={Sparkles} label="Meditate" />
            <NavButton to="/dashboard" icon={BarChart3} label="Dashboard" />
            <NavButton to="/about" icon={Info} label="About" />
          </div>

          <Button
            onClick={handleSignOut}
            variant="ghost"
            className="flex items-center gap-2 hover:bg-primary/10 hover:text-primary transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </div>
    </nav>
  );
};

const NavButton = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => (
  <Button
    asChild
    variant="ghost"
    className="flex items-center gap-2 hover:bg-primary/10 hover:text-primary transition-all duration-300"
  >
    <Link to={to}>
      <Icon className="w-4 h-4" />
      <span className="hidden lg:inline">{label}</span>
    </Link>
  </Button>
);

export default Navigation;
