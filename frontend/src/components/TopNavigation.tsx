import { useLocation, useNavigate } from "react-router-dom";
import { Home, ShoppingCart, LogOut, ChefHat } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/button";

export function TopNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  // Hide top nav on login/register pages
  if (location.pathname === "/login" || location.pathname === "/register") {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="hidden md:block fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              NutriChef
            </h1>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate("/dashboard")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                isActive("/dashboard")
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="font-medium">Dashboard</span>
            </button>

            <button
              onClick={() => navigate("/inventory")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                isActive("/inventory")
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="font-medium">Inventory</span>
            </button>
          </div>

          {/* User Info and Logout */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">
                {user?.name}
              </p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="text-red-600 hover:bg-red-50 border-red-200"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
