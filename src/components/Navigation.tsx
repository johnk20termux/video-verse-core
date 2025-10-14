import { Link, useLocation } from "react-router-dom";
import { Sparkles, Search, Bookmark, Home, Puzzle, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const Navigation = () => {
  const location = useLocation();
  const { signOut } = useAuth();

  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Search, label: "Browse", path: "/browse" },
    { icon: Bookmark, label: "Watchlist", path: "/watchlist" },
    { icon: Puzzle, label: "Add-ons", path: "/addons" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-strong bg-background/80 border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-primary animate-pulse">
              <Sparkles className="w-5 h-5 text-primary-foreground" fill="currentColor" />
            </div>
            <span className="bg-gradient-to-r from-primary via-orange-400 to-accent bg-clip-text text-transparent font-extrabold tracking-tight">
              VideoForever
            </span>
          </Link>

          <div className="flex items-center gap-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 transition-smooth hover:text-primary ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              );
            })}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => signOut()}
              className="text-muted-foreground hover:text-primary"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
