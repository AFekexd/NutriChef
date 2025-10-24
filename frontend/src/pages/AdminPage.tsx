import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import {
  Users,
  ShoppingBag,
  Image,
  ChefHat,
  BarChart3,
  Search,
  Trash2,
  Ban,
  CheckCircle,
  Shield,
  UserCog,
  AlertCircle,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { apiService } from "../services/api";

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalInventoryItems: number;
  totalRecipes: number;
  totalUploads: number;
}

export function AdminPage() {
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "users" | "inventory" | "recipes" | "uploads"
  >("dashboard");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [uploads, setUploads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // GSAP refs
  const headerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (activeTab === "users") loadUsers();
    else if (activeTab === "inventory") loadInventory();
    else if (activeTab === "recipes") loadRecipes();
    else if (activeTab === "uploads") loadUploads();
  }, [activeTab, currentPage, searchTerm]);

  useEffect(() => {
    if (!isLoading && headerRef.current) {
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
      );
    }
  }, [isLoading]);

  useEffect(() => {
    if (!isLoading && contentRef.current) {
      const cards = contentRef.current.querySelectorAll(".admin-card");
      gsap.fromTo(
        cards,
        { opacity: 0, scale: 0.95 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.4,
          stagger: 0.1,
          ease: "back.out(1.2)",
        }
      );
    }
  }, [isLoading, activeTab]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const data = await apiService.getAdminStats();
      setStats(data.stats);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await apiService.getAllUsers({
        page: currentPage,
        limit: 20,
        search: searchTerm,
      });
      setUsers(data.users);
      setTotalPages(data.pagination.totalPages);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  const loadInventory = async () => {
    setIsLoading(true);
    try {
      const data = await apiService.getAllAdminInventoryItems({
        page: currentPage,
        limit: 50,
        search: searchTerm,
      });
      setInventoryItems(data.items);
      setTotalPages(data.pagination.totalPages);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load inventory");
    } finally {
      setIsLoading(false);
    }
  };

  const loadRecipes = async () => {
    setIsLoading(true);
    try {
      const data = await apiService.getAllAdminRecipes({
        page: currentPage,
        limit: 50,
        search: searchTerm,
      });
      setRecipes(data.recipes);
      setTotalPages(data.pagination.totalPages);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load recipes");
    } finally {
      setIsLoading(false);
    }
  };

  const loadUploads = async () => {
    setIsLoading(true);
    try {
      const data = await apiService.getAllUploads({
        page: currentPage,
        limit: 50,
      });
      setUploads(data.uploads);
      setTotalPages(data.pagination.totalPages);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load uploads");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleUserStatus = async (
    userId: string,
    currentStatus: boolean
  ) => {
    if (
      !confirm(
        `Are you sure you want to ${
          currentStatus ? "deactivate" : "activate"
        } this user?`
      )
    ) {
      return;
    }

    try {
      await apiService.updateUserStatus(userId, !currentStatus);
      setSuccess("User status updated successfully!");
      loadUsers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to update user status");
    }
  };

  const handleToggleUserRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    if (
      !confirm(
        `Are you sure you want to change this user's role to ${newRole}?`
      )
    ) {
      return;
    }

    try {
      await apiService.updateUserRole(userId, newRole);
      setSuccess("User role updated successfully!");
      loadUsers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to update user role");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this user? This action cannot be undone!"
      )
    ) {
      return;
    }

    try {
      await apiService.deleteUser(userId);
      setSuccess("User deleted successfully!");
      loadUsers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to delete user");
    }
  };

  const handleDeleteInventoryItem = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this inventory item?")) {
      return;
    }

    try {
      await apiService.deleteAdminInventoryItem(itemId);
      setSuccess("Inventory item deleted successfully!");
      loadInventory();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to delete inventory item");
    }
  };

  const handleDeleteRecipe = async (recipeId: string) => {
    if (!confirm("Are you sure you want to delete this recipe?")) {
      return;
    }

    try {
      await apiService.deleteAdminRecipe(recipeId);
      setSuccess("Recipe deleted successfully!");
      loadRecipes();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to delete recipe");
    }
  };

  if (isLoading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 md:pb-0 md:pt-16 bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div ref={headerRef} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-10 h-10 text-purple-600 dark:text-purple-400" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-purple-400 dark:from-purple-400 dark:to-purple-600 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Manage users, inventory, recipes, and system data
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <p className="text-red-700 dark:text-red-400">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
            <p className="text-green-700 dark:text-green-400">{success}</p>
            <button
              onClick={() => setSuccess(null)}
              className="ml-auto text-green-600 hover:text-green-800"
            >
              ×
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { key: "dashboard", icon: BarChart3, label: "Dashboard" },
            { key: "users", icon: Users, label: "Users" },
            { key: "inventory", icon: ShoppingBag, label: "Inventory" },
            { key: "recipes", icon: ChefHat, label: "Recipes" },
            { key: "uploads", icon: Image, label: "Uploads" },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key as any);
                  setCurrentPage(1);
                  setSearchTerm("");
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.key
                    ? "bg-purple-600 text-white"
                    : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-950/30"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div ref={contentRef}>
          {/* Dashboard Tab */}
          {activeTab === "dashboard" && stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  label: "Total Users",
                  value: stats.totalUsers,
                  icon: Users,
                  color: "blue",
                },
                {
                  label: "Active Users",
                  value: stats.activeUsers,
                  icon: CheckCircle,
                  color: "green",
                },
                {
                  label: "Inventory Items",
                  value: stats.totalInventoryItems,
                  icon: ShoppingBag,
                  color: "orange",
                },
                {
                  label: "Recipes",
                  value: stats.totalRecipes,
                  icon: ChefHat,
                  color: "purple",
                },
                {
                  label: "Total Uploads",
                  value: stats.totalUploads,
                  icon: Image,
                  color: "pink",
                },
              ].map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <Card
                    key={index}
                    className={`admin-card p-6 bg-gradient-to-br from-white to-${stat.color}-50/30 dark:from-gray-900 dark:to-${stat.color}-900/10`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          {stat.label}
                        </p>
                        <p
                          className={`text-3xl font-bold text-${stat.color}-600 dark:text-${stat.color}-400`}
                        >
                          {stat.value.toLocaleString()}
                        </p>
                      </div>
                      <div
                        className={`p-4 bg-${stat.color}-100 dark:bg-${stat.color}-950/50 rounded-xl`}
                      >
                        <Icon
                          className={`w-8 h-8 text-${stat.color}-600 dark:text-${stat.color}-400`}
                        />
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Users Tab */}
          {activeTab === "users" && (
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>

              {/* Users List */}
              <div className="space-y-3">
                {users.map((user) => (
                  <Card key={user.userId} className="admin-card p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                            {user.name}
                          </h3>
                          {user.role === "admin" && (
                            <Badge className="bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                              <Shield className="w-3 h-3 mr-1" />
                              Admin
                            </Badge>
                          )}
                          {user.isActive ? (
                            <Badge className="bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300">
                              Active
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300">
                              Inactive
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {user.email}
                        </p>
                        <div className="flex gap-4 mt-2 text-xs text-gray-500">
                          <span>{user._count.inventoryItems} items</span>
                          <span>{user._count.recipes} recipes</span>
                          <span>{user._count.sessions} sessions</span>
                          <span>
                            Joined{" "}
                            {new Date(user.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleToggleUserRole(user.userId, user.role)
                          }
                          className="text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950"
                        >
                          <UserCog className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleToggleUserStatus(user.userId, user.isActive)
                          }
                          className={
                            user.isActive ? "text-orange-600" : "text-green-600"
                          }
                        >
                          {user.isActive ? (
                            <Ban className="w-4 h-4" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteUser(user.userId)}
                          className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-4 py-2 rounded-lg ${
                          currentPage === page
                            ? "bg-purple-600 text-white"
                            : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {page}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          )}

          {/* Inventory Tab */}
          {activeTab === "inventory" && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search inventory items..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {inventoryItems.map((item) => (
                  <Card key={item.inventoryItemId} className="admin-card p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          {item.ingredient.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {item.user.name}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleDeleteInventoryItem(item.inventoryItemId)
                        }
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="text-sm text-gray-500">
                      <p>
                        {item.quantity} {item.unit}
                      </p>
                      <p>
                        Expires:{" "}
                        {new Date(item.expiryDate).toLocaleDateString()}
                      </p>
                      {item.location && <p>Location: {item.location}</p>}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Recipes Tab */}
          {activeTab === "recipes" && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search recipes..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recipes.map((recipe) => (
                  <Card key={recipe.recipeId} className="admin-card p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                          {recipe.title}
                        </h3>
                        {recipe.user && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            by {recipe.user.name}
                          </p>
                        )}
                        <div className="flex gap-2 mt-2">
                          <span className="text-xs text-gray-500">
                            {recipe.calories} cal
                          </span>
                          <span className="text-xs text-gray-500">
                            {recipe.servings} servings
                          </span>
                          {recipe.isAIGenerated && (
                            <Badge className="bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs">
                              AI
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteRecipe(recipe.recipeId)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Uploads Tab */}
          {activeTab === "uploads" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {uploads.map((upload) => (
                <Card key={upload.uploadId} className="admin-card p-4">
                  <img
                    src={import.meta.env.VITE_API_URL + "/" + upload.imageUrl}
                    alt="Upload"
                    className="w-full h-48 object-cover rounded-lg mb-3"
                  />
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {upload.aiService} • {upload.detectedItems.length} items
                    detected
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(upload.createdAt).toLocaleDateString()}
                  </p>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
