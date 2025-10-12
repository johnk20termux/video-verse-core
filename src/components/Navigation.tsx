import { Link, useLocation } from "react-router-dom";
import { Play, Search, Bookmark, Home } from "lucide-react";

const Navigation = () => {
  const location = useLocation();

  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Search, label: "Browse", path: "/browse" },
    { icon: Bookmark, label: "Watchlist", path: "/watchlist" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-strong bg-background/80 border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center glow-primary">
              <Play className="w-5 h-5 text-primary-foreground" fill="currentColor" />
            </div>
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              StreamHub
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
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
