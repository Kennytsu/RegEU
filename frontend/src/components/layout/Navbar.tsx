import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Columns3,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
  Phone
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import euStars from "@/assets/eu-stars.png";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/board", label: "Board", icon: Columns3 },
  { href: "/chat", label: "Assistant", icon: MessageSquare },
  // { href: "/voice-call", label: "EUgene", icon: Phone },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      // Sign out and clear all session data
      await signOut();

      // Show success message
      toast.success('Logged out successfully');

      // Navigate to landing page
      navigate('/', { replace: true });

      // Force reload to ensure all state is cleared
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
    } catch (error) {
      toast.error('Failed to logout');
      console.error('Logout error:', error);

      // Even on error, try to navigate away
      navigate('/', { replace: true });
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img src={euStars} alt="EUgene" className="w-6 h-6" />
            <span className="font-semibold text-foreground">EUgene</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              const isEugene = item.href === "/voice-call";
              return (
                <Link key={item.href} to={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    className={cn(
                      "gap-2",
                      isEugene
                        ? "text-blue-600 hover:text-blue-700 font-semibold bg-blue-50 hover:bg-blue-100 border border-blue-200"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <item.icon className={cn("w-4 h-4", isEugene && "w-5 h-5")} />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground gap-2"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              Log out
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5 text-foreground" />
            ) : (
              <Menu className="w-5 h-5 text-foreground" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-background">
          <div className="px-4 py-3 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              const isEugene = item.href === "/voice-call";
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-2",
                      isEugene && "text-blue-600 font-semibold bg-blue-50 hover:bg-blue-100 border border-blue-200"
                    )}
                    size="sm"
                  >
                    <item.icon className={cn("w-4 h-4", isEugene && "w-5 h-5")} />
                    {item.label}
                  </Button>
                </Link>
              );
            })}

            {/* Logout button in mobile menu */}
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-muted-foreground"
              size="sm"
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
            >
              <LogOut className="w-4 h-4" />
              Log out
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
