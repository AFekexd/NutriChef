import { useLocation, useNavigate } from "react-router-dom";
import { Home, ShoppingCart, ChefHat, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function BottomNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  // Hide bottom nav on login/register pages
  if (location.pathname === "/login" || location.pathname === "/register") {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50">
      <div className="flex items-center justify-around h-20">
        <button
          onClick={() => navigate("/dashboard")}
          className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
            isActive("/dashboard")
              ? "text-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Home className="w-6 h-6" />
          <span className="text-xs font-medium">Home</span>
        </button>

        <button
          onClick={() => navigate("/inventory")}
          className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
            isActive("/inventory")
              ? "text-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <ShoppingCart className="w-6 h-6" />
          <span className="text-xs font-medium">Inventory</span>
        </button>

        <button
          onClick={() => navigate("/recipes")}
          className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
            isActive("/recipes")
              ? "text-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <ChefHat className="w-6 h-6" />
          <span className="text-xs font-medium">Recipes</span>
        </button>

        <button
          onClick={handleLogout}
          className="flex flex-col items-center justify-center w-full h-full gap-1 text-gray-600 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-6 h-6" />
          <span className="text-xs font-medium">Logout</span>
        </button>
      </div>
    </nav>
  );
}
