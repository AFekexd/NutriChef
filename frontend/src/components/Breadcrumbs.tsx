import { ChevronRight, Home } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

interface BreadcrumbItem {
  label: string;
  path: string;
}

const routeLabels: Record<string, string> = {
  dashboard: "Dashboard",
  inventory: "Inventory",
  recipes: "Recipe Recommendations",
  "my-recipes": "My Recipes",
  "shopping-list": "Shopping List",
  "meal-planning": "Meal Planning",
  profile: "Profile",
  admin: "Admin Panel",
  nutrition: "Nutrition Tracking",
};

export const Breadcrumbs = () => {
  const location = useLocation();
  const pathSegments = location.pathname.split("/").filter(Boolean);

  if (
    pathSegments.length === 0 ||
    pathSegments[0] === "login" ||
    pathSegments[0] === "register"
  ) {
    return null;
  }

  const breadcrumbs: BreadcrumbItem[] = [{ label: "Home", path: "/dashboard" }];

  let currentPath = "";
  pathSegments.forEach((segment) => {
    currentPath += `/${segment}`;
    const label =
      routeLabels[segment] ||
      segment.charAt(0).toUpperCase() + segment.slice(1);
    breadcrumbs.push({ label, path: currentPath });
  });

  // Don't show breadcrumbs if we're on dashboard
  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav className="hidden md:flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
      {breadcrumbs.map((crumb, index) => {
        const isLast = index === breadcrumbs.length - 1;
        const isHome = index === 0;

        return (
          <div key={crumb.path} className="flex items-center">
            {index > 0 && <ChevronRight className="w-4 h-4 mx-2" />}
            {isLast ? (
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {crumb.label}
              </span>
            ) : (
              <Link
                to={crumb.path}
                className="hover:text-green-600 dark:hover:text-green-400 transition-colors flex items-center gap-1"
              >
                {isHome && <Home className="w-4 h-4" />}
                {crumb.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
};
