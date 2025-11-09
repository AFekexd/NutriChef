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
  Clock,
  AlertTriangle,
  History,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Alert, AlertDescription } from "../components/ui/alert";
import { apiService } from "../services/api";
import { confirmDialog } from "../utils/confirmDialog";

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalInventoryItems: number;
  totalRecipes: number;
  totalUploads: number;
}

export function AdminPage() {
  const [activeTab, setActiveTab] = useState<
    | "dashboard"
    | "users"
    | "inventory"
    | "recipes"
    | "uploads"
    | "logs"
    | "api-logs"
  >("dashboard");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [uploads, setUploads] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [apiLogs, setApiLogs] = useState<any[]>([]);
  const [apiStats, setApiStats] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showModerationModal, setShowModerationModal] = useState(false);
  const [moderationHistory, setModerationHistory] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [logFilters, setLogFilters] = useState({
    action: "",
    targetType: "",
  });
  const [apiLogFilters, setApiLogFilters] = useState({
    method: "",
    statusCode: "",
    path: "",
  });

  // Lazy loading states
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreLogs, setHasMoreLogs] = useState(true);
  const [hasMoreApiLogs, setHasMoreApiLogs] = useState(true);

  // GSAP refs
  const headerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const apiLogsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    // Reset page when tab changes
    setCurrentPage(1);

    if (activeTab === "users") loadUsers();
    else if (activeTab === "inventory") loadInventory();
    else if (activeTab === "recipes") loadRecipes();
    else if (activeTab === "uploads") loadUploads();
    else if (activeTab === "logs") {
      setLogs([]); // Clear old logs
      loadLogs();
    } else if (activeTab === "api-logs") {
      setApiLogs([]); // Clear old logs
      loadApiLogs();
    }
  }, [activeTab]);

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

  // Infinite scroll for Admin Logs
  useEffect(() => {
    if (activeTab !== "logs" || !logsEndRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMoreLogs &&
          !isLoading &&
          !isLoadingMore
        ) {
          loadLogs(true); // Append mode
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(logsEndRef.current);

    return () => observer.disconnect();
  }, [activeTab, hasMoreLogs, isLoading, isLoadingMore]);

  // Infinite scroll for API Logs
  useEffect(() => {
    if (activeTab !== "api-logs" || !apiLogsEndRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMoreApiLogs &&
          !isLoading &&
          !isLoadingMore
        ) {
          loadApiLogs(true); // Append mode
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(apiLogsEndRef.current);

    return () => observer.disconnect();
  }, [activeTab, hasMoreApiLogs, isLoading, isLoadingMore]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
    setHasMoreLogs(true);
    setHasMoreApiLogs(true);

    // Reload data with new filters
    if (activeTab === "logs") {
      setLogs([]); // Clear old logs
      loadLogs();
    } else if (activeTab === "api-logs") {
      setApiLogs([]); // Clear old logs
      loadApiLogs();
    }
  }, [logFilters, apiLogFilters, searchTerm]);

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

  const loadLogs = async (append = false) => {
    if (append && !hasMoreLogs) return; // Don't load if no more data

    if (!append) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const pageToLoad = append ? currentPage + 1 : currentPage;

      const data = await apiService.getAdminLogs({
        page: pageToLoad,
        limit: 50,
        action: logFilters.action || undefined,
        targetType: logFilters.targetType || undefined,
      });

      if (append) {
        setLogs((prev) => [...prev, ...data.logs]);
        setCurrentPage(pageToLoad);
      } else {
        setLogs(data.logs);
      }

      setTotalPages(data.pagination.totalPages);
      setHasMoreLogs(pageToLoad < data.pagination.totalPages);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load logs");
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const loadApiLogs = async (append = false) => {
    if (append && !hasMoreApiLogs) return; // Don't load if no more data

    if (!append) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const pageToLoad = append ? currentPage + 1 : currentPage;

      const [logsData, statsData] = await Promise.all([
        apiService.getApiActivityLogs({
          page: pageToLoad,
          limit: 50,
          method: apiLogFilters.method || undefined,
          statusCode: apiLogFilters.statusCode
            ? Number(apiLogFilters.statusCode)
            : undefined,
          path: apiLogFilters.path || undefined,
          searchTerm: searchTerm || undefined,
        }),
        // Only fetch stats on initial load
        append ? Promise.resolve(apiStats) : apiService.getApiActivityStats({}),
      ]);

      if (append) {
        setApiLogs((prev) => [...prev, ...logsData.logs]);
        setCurrentPage(pageToLoad);
      } else {
        setApiLogs(logsData.logs);
      }

      if (!append) {
        setApiStats(statsData);
      }

      setTotalPages(logsData.pagination.totalPages);
      setHasMoreApiLogs(pageToLoad < logsData.pagination.totalPages);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load API logs");
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleViewUserModeration = async (user: any) => {
    try {
      const data = await apiService.getUserModeration(user.userId);
      setSelectedUser(user);
      setModerationHistory(data);
      setShowModerationModal(true);
    } catch (err: any) {
      setError(
        err.response?.data?.error || "Failed to load moderation history"
      );
    }
  };

  const handleWarnUser = async (userId: string) => {
    const reason = window.prompt("Enter a reason for the warning:");
    if (reason === null) return;

    const adminNote = window.prompt("(Optional) Internal admin note:");

    confirmDialog({
      title: "Send Warning?",
      message: "Are you sure you want to send a warning to this user?",
      confirmText: "Send Warning",
      cancelText: "Cancel",
      onConfirm: async () => {
        try {
          await apiService.sendWarningToUser(
            userId,
            reason.trim() || undefined,
            adminNote?.trim() || undefined
          );
          setSuccess("Warning sent successfully!");
          loadUsers();
          setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
          setError(err.response?.data?.error || "Failed to send warning");
        }
      },
    });
  };

  const handleTimeoutUser = async (userId: string) => {
    const durationStr = window.prompt(
      "Enter timeout duration in hours (e.g., 24 for 1 day, 168 for 1 week):"
    );
    if (durationStr === null) return;

    const duration = parseInt(durationStr);
    if (isNaN(duration) || duration <= 0) {
      setError("Invalid duration. Please enter a positive number.");
      return;
    }

    const reason = window.prompt("Enter a reason for the timeout:");
    if (reason === null) return;

    const adminNote = window.prompt("(Optional) Internal admin note:");

    confirmDialog({
      title: "Timeout User?",
      message: `Are you sure you want to timeout this user for ${duration} hours? They will be logged out and unable to access their account until the timeout expires.`,
      confirmText: "Timeout User",
      cancelText: "Cancel",
      onConfirm: async () => {
        try {
          await apiService.timeoutUser(
            userId,
            duration,
            reason.trim() || undefined,
            adminNote?.trim() || undefined
          );
          setSuccess(`User timed out for ${duration} hours!`);
          loadUsers();
          setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
          setError(err.response?.data?.error || "Failed to timeout user");
        }
      },
    });
  };

  const handleBanUser = async (userId: string) => {
    const isPermanent = window.confirm(
      "Should this be a permanent ban? Click OK for permanent, Cancel for temporary."
    );

    let duration: number | undefined;
    if (!isPermanent) {
      const durationStr = window.prompt(
        "Enter ban duration in hours (e.g., 720 for 30 days):"
      );
      if (durationStr === null) return;

      duration = parseInt(durationStr);
      if (isNaN(duration) || duration <= 0) {
        setError("Invalid duration. Please enter a positive number.");
        return;
      }
    }

    const reason = window.prompt("Enter a reason for the ban:");
    if (reason === null) return;

    const adminNote = window.prompt("(Optional) Internal admin note:");

    confirmDialog({
      title: isPermanent ? "Permanently Ban User?" : "Ban User?",
      message: isPermanent
        ? "Are you sure you want to PERMANENTLY ban this user? This is a serious action!"
        : `Are you sure you want to ban this user for ${duration} hours?`,
      confirmText: "Ban User",
      cancelText: "Cancel",
      onConfirm: async () => {
        try {
          await apiService.banUser(
            userId,
            reason.trim() || undefined,
            duration,
            adminNote?.trim() || undefined
          );
          setSuccess(
            isPermanent
              ? "User permanently banned!"
              : `User banned for ${duration} hours!`
          );
          loadUsers();
          setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
          setError(err.response?.data?.error || "Failed to ban user");
        }
      },
    });
  };

  const handleUnbanUser = async (userId: string) => {
    confirmDialog({
      title: "Unban User?",
      message:
        "Are you sure you want to remove the ban/timeout from this user?",
      confirmText: "Unban User",
      cancelText: "Cancel",
      onConfirm: async () => {
        try {
          await apiService.unbanUser(userId);
          setSuccess("User unbanned successfully!");
          loadUsers();
          setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
          setError(err.response?.data?.error || "Failed to unban user");
        }
      },
    });
  };

  const handleToggleUserRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    confirmDialog({
      title: "Change User Role?",
      message: `Are you sure you want to change this user's role to ${newRole}?`,
      confirmText: "Change Role",
      cancelText: "Cancel",
      onConfirm: async () => {
        try {
          await apiService.updateUserRole(userId, newRole);
          setSuccess("User role updated successfully!");
          loadUsers();
          setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
          setError(err.response?.data?.error || "Failed to update user role");
        }
      },
    });
  };

  const handleDeleteUser = async (userId: string) => {
    confirmDialog({
      title: "Delete User Account?",
      message:
        "Are you sure you want to permanently delete this user and all their data? This action cannot be undone! A notification email will be sent to the user.",
      confirmText: "Delete Permanently",
      cancelText: "Cancel",
      onConfirm: async () => {
        try {
          await apiService.deleteUser(userId);
          setSuccess(
            "User account deleted successfully! Notification email sent."
          );
          loadUsers();
          setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
          setError(err.response?.data?.error || "Failed to delete user");
        }
      },
    });
  };

  const handleDeleteInventoryItem = async (itemId: string) => {
    confirmDialog({
      title: "Delete Inventory Item?",
      message:
        "Are you sure you want to delete this inventory item? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      onConfirm: async () => {
        try {
          await apiService.deleteAdminInventoryItem(itemId);
          setSuccess("Inventory item deleted successfully!");
          loadInventory();
          setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
          setError(
            err.response?.data?.error || "Failed to delete inventory item"
          );
        }
      },
    });
  };

  const handleDeleteRecipe = async (recipeId: string) => {
    confirmDialog({
      title: "Delete Recipe?",
      message:
        "Are you sure you want to delete this recipe? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      onConfirm: async () => {
        try {
          await apiService.deleteAdminRecipe(recipeId);
          setSuccess("Recipe deleted successfully!");
          loadRecipes();
          setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
          setError(err.response?.data?.error || "Failed to delete recipe");
        }
      },
    });
  };

  if (isLoading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 md:pb-8 pt-0 md:pt-20 bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* Header */}
        <div ref={headerRef} className="mb-6 md:mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-orange-600 dark:text-orange-400" />
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 dark:from-orange-400 dark:to-orange-500 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
          </div>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
            Manage users, inventory, recipes, and system data
          </p>
        </div>

        {/* Messages */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="w-5 h-5" />
            <AlertDescription>{error}</AlertDescription>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-current hover:opacity-70"
            >
              ×
            </button>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-700 dark:text-green-300">
              {success}
            </AlertDescription>
            <button
              onClick={() => setSuccess(null)}
              className="ml-auto text-green-600 hover:text-green-800"
            >
              ×
            </button>
          </Alert>
        )}

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { key: "dashboard", icon: BarChart3, label: "Dashboard" },
            { key: "users", icon: Users, label: "Users" },
            { key: "inventory", icon: ShoppingBag, label: "Inventory" },
            { key: "recipes", icon: ChefHat, label: "Recipes" },
            { key: "uploads", icon: Image, label: "Uploads" },
            { key: "logs", icon: AlertCircle, label: "Admin Logs" },
            { key: "api-logs", icon: History, label: "API Logs" },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key as any);
                  setCurrentPage(1);
                  setSearchTerm("");
                  if (tab.key === "logs") {
                    setLogFilters({ action: "", targetType: "" });
                  } else if (tab.key === "api-logs") {
                    setApiLogFilters({ method: "", statusCode: "", path: "" });
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.key
                    ? "bg-orange-600 text-white shadow-md"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-orange-50 dark:hover:bg-orange-900/20 border border-gray-200 dark:border-gray-700"
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
                  color: "orange",
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
                    className={`admin-card p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                          {stat.label}
                        </p>
                        <p
                          className={`text-3xl font-bold ${
                            stat.color === "blue"
                              ? "text-blue-600 dark:text-blue-400"
                              : stat.color === "green"
                              ? "text-green-600 dark:text-green-400"
                              : stat.color === "orange"
                              ? "text-orange-600 dark:text-orange-400"
                              : "text-pink-600 dark:text-pink-400"
                          }`}
                        >
                          {stat.value.toLocaleString()}
                        </p>
                      </div>
                      <div
                        className={`p-4 rounded-xl ${
                          stat.color === "blue"
                            ? "bg-blue-100 dark:bg-blue-900/30"
                            : stat.color === "green"
                            ? "bg-green-100 dark:bg-green-900/30"
                            : stat.color === "orange"
                            ? "bg-orange-100 dark:bg-orange-900/30"
                            : "bg-pink-100 dark:bg-pink-900/30"
                        }`}
                      >
                        <Icon
                          className={`w-8 h-8 ${
                            stat.color === "blue"
                              ? "text-blue-600 dark:text-blue-400"
                              : stat.color === "green"
                              ? "text-green-600 dark:text-green-400"
                              : stat.color === "orange"
                              ? "text-orange-600 dark:text-orange-400"
                              : "text-pink-600 dark:text-pink-400"
                          }`}
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
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <Input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                />
              </div>

              {/* Users List */}
              <div className="space-y-3">
                {users.map((user) => (
                  <Card
                    key={user.userId}
                    className="admin-card p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                            {user.name}
                          </h3>
                          {user.role === "admin" && (
                            <Badge className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
                              <Shield className="w-3 h-3 mr-1" />
                              Admin
                            </Badge>
                          )}
                          {user.isActive ? (
                            <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                              Active
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                              Inactive
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
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
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleToggleUserRole(user.userId, user.role)
                          }
                          className="text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                          title="Change role"
                        >
                          <UserCog className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleWarnUser(user.userId)}
                          className="text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                          title="Send warning"
                        >
                          <AlertTriangle className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTimeoutUser(user.userId)}
                          className="text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950"
                          title="Timeout user"
                        >
                          <Clock className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleBanUser(user.userId)}
                          className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                          title="Ban user"
                        >
                          <Ban className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewUserModeration(user)}
                          className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                          title="View moderation history"
                        >
                          <History className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteUser(user.userId)}
                          className="text-red-800 hover:bg-red-100 dark:hover:bg-red-950"
                          title="Delete account permanently (will send email)"
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
                            ? "bg-orange-600 text-white"
                            : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
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
                        <p className="text-sm text-gray-600 dark:text-gray-300">
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
                          <p className="text-sm text-gray-600 dark:text-gray-300">
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
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
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

          {/* Logs Tab */}
          {activeTab === "logs" && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Filter by Action
                  </label>
                  <select
                    value={logFilters.action}
                    onChange={(e) =>
                      setLogFilters({ ...logFilters, action: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  >
                    <option value="">All Actions</option>
                    <option value="user_warned">User Warned</option>
                    <option value="user_timeout">User Timeout</option>
                    <option value="user_banned">User Banned</option>
                    <option value="user_unbanned">User Unbanned</option>
                    <option value="user_suspended">User Suspended</option>
                    <option value="user_reactivated">User Reactivated</option>
                    <option value="user_deleted">User Deleted</option>
                    <option value="rate_limit_reset">Rate Limit Reset</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Filter by Target Type
                  </label>
                  <select
                    value={logFilters.targetType}
                    onChange={(e) =>
                      setLogFilters({
                        ...logFilters,
                        targetType: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  >
                    <option value="">All Types</option>
                    <option value="user">User</option>
                    <option value="recipe">Recipe</option>
                    <option value="inventory">Inventory</option>
                    <option value="upload">Upload</option>
                    <option value="system">System</option>
                  </select>
                </div>
              </div>

              {/* Logs List */}
              <div className="space-y-3">
                {logs.map((log) => (
                  <Card
                    key={log.adminLogId}
                    className="admin-card p-4 hover:shadow-md transition-shadow bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge
                            className={`${
                              log.action.includes("banned") ||
                              log.action.includes("deleted")
                                ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                                : log.action.includes("warned") ||
                                  log.action.includes("timeout")
                                ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
                                : log.action.includes("unbanned") ||
                                  log.action.includes("reactivated")
                                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                                : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                            }`}
                          >
                            {log.action.replace(/_/g, " ").toUpperCase()}
                          </Badge>
                          <Badge className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                            {log.targetType}
                          </Badge>
                        </div>
                        <div className="text-sm space-y-1">
                          {log.targetName && (
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              Target: {log.targetName}
                            </p>
                          )}
                          {log.targetEmail && (
                            <p className="text-gray-600 dark:text-gray-300">
                              Email: {log.targetEmail}
                            </p>
                          )}
                          {log.details &&
                            Object.keys(log.details).length > 0 && (
                              <details className="text-gray-600 dark:text-gray-300">
                                <summary className="cursor-pointer hover:text-orange-600">
                                  View Details
                                </summary>
                                <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto">
                                  {JSON.stringify(log.details, null, 2)}
                                </pre>
                              </details>
                            )}
                          <p className="text-xs text-gray-500">
                            {new Date(log.timestamp).toLocaleString()} •{" "}
                            {log.ipAddress && `IP: ${log.ipAddress}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
                {logs.length === 0 && !isLoading && (
                  <div className="text-center py-12 text-gray-500">
                    No logs found matching the current filters.
                  </div>
                )}

                {/* Load More button (visible before infinite scroll trigger) */}
                {hasMoreLogs && logs.length > 0 && !isLoadingMore && (
                  <div className="text-center py-4">
                    <Button
                      onClick={() => loadLogs(true)}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      Load More Logs
                    </Button>
                  </div>
                )}

                {/* Infinite scroll trigger (hidden) */}
                <div ref={logsEndRef} className="h-4" />

                {/* Loading more indicator */}
                {isLoadingMore && (
                  <div className="text-center py-4">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
                    <p className="text-sm text-gray-500 mt-2">
                      Loading more logs...
                    </p>
                  </div>
                )}

                {/* End of results indicator */}
                {!hasMoreLogs && logs.length > 0 && (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    ✓ All logs loaded ({logs.length} total)
                  </div>
                )}
              </div>

              {/* Pagination - Hidden when using infinite scroll, shown as fallback */}
              {totalPages > 1 && false && (
                <div className="flex justify-center gap-2">
                  {Array.from(
                    { length: Math.min(totalPages, 10) },
                    (_, i) => i + 1
                  ).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-4 py-2 rounded-lg ${
                        currentPage === page
                          ? "bg-orange-600 text-white"
                          : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* API Logs Tab */}
          {activeTab === "api-logs" && (
            <div className="space-y-6">
              {/* Statistics Cards */}
              {apiStats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                      Total Requests
                    </div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {apiStats.totalRequests.toLocaleString()}
                    </div>
                  </Card>
                  <Card className="p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                      Success Rate
                    </div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {apiStats.successRate}%
                    </div>
                  </Card>
                  <Card className="p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                      Avg Response
                    </div>
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {apiStats.avgResponseTime}ms
                    </div>
                  </Card>
                  <Card className="p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                      Failed Requests
                    </div>
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {apiStats.failedRequests.toLocaleString()}
                    </div>
                  </Card>
                </div>
              )}

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Search User/Path
                  </label>
                  <Input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    HTTP Method
                  </label>
                  <select
                    value={apiLogFilters.method}
                    onChange={(e) =>
                      setApiLogFilters({
                        ...apiLogFilters,
                        method: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  >
                    <option value="">All Methods</option>
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                    <option value="PATCH">PATCH</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Status Code
                  </label>
                  <select
                    value={apiLogFilters.statusCode}
                    onChange={(e) =>
                      setApiLogFilters({
                        ...apiLogFilters,
                        statusCode: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  >
                    <option value="">All Codes</option>
                    <option value="200">200 OK</option>
                    <option value="201">201 Created</option>
                    <option value="400">400 Bad Request</option>
                    <option value="401">401 Unauthorized</option>
                    <option value="403">403 Forbidden</option>
                    <option value="404">404 Not Found</option>
                    <option value="500">500 Server Error</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Path Filter
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g., /api/recipes"
                    value={apiLogFilters.path}
                    onChange={(e) =>
                      setApiLogFilters({
                        ...apiLogFilters,
                        path: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              {/* API Logs List */}
              <div className="space-y-3">
                {apiLogs.map((log) => (
                  <Card
                    key={log.apiLogId}
                    className="admin-card p-4 hover:shadow-md transition-shadow bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge
                            className={`${
                              log.method === "GET"
                                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                : log.method === "POST"
                                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                                : log.method === "PUT" || log.method === "PATCH"
                                ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
                                : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                            }`}
                          >
                            {log.method}
                          </Badge>
                          <Badge
                            className={`${
                              log.statusCode >= 200 && log.statusCode < 300
                                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                                : log.statusCode >= 400 && log.statusCode < 500
                                ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
                                : log.statusCode >= 500
                                ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                            }`}
                          >
                            {log.statusCode}
                          </Badge>
                          {log.responseTime && (
                            <Badge className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
                              {log.responseTime}ms
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm space-y-1">
                          <p className="font-medium text-gray-900 dark:text-gray-100 font-mono">
                            {log.path}
                          </p>
                          {log.userName && (
                            <p className="text-gray-600 dark:text-gray-300">
                              User: {log.userName} ({log.userEmail})
                            </p>
                          )}
                          {!log.userName && (
                            <p className="text-gray-500 dark:text-gray-500 italic">
                              Unauthenticated request
                            </p>
                          )}
                          {log.errorMessage && (
                            <p className="text-red-600 dark:text-red-400">
                              Error: {log.errorMessage}
                            </p>
                          )}
                          {log.requestBody &&
                            Object.keys(log.requestBody).length > 0 && (
                              <details className="text-gray-600 dark:text-gray-300">
                                <summary className="cursor-pointer hover:text-orange-600">
                                  View Request Body
                                </summary>
                                <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto">
                                  {JSON.stringify(log.requestBody, null, 2)}
                                </pre>
                              </details>
                            )}
                          {log.responseBody &&
                            Object.keys(log.responseBody).length > 0 && (
                              <details className="text-gray-600 dark:text-gray-300">
                                <summary className="cursor-pointer hover:text-orange-600">
                                  View Response Body
                                </summary>
                                <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto">
                                  {JSON.stringify(log.responseBody, null, 2)}
                                </pre>
                              </details>
                            )}
                          <p className="text-xs text-gray-500">
                            {new Date(log.timestamp).toLocaleString()} •{" "}
                            {log.ipAddress && `IP: ${log.ipAddress}`} •{" "}
                            {log.userAgent &&
                              `${log.userAgent.substring(0, 50)}...`}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
                {apiLogs.length === 0 && !isLoading && (
                  <div className="text-center py-12 text-gray-500">
                    No API logs found matching the current filters.
                  </div>
                )}

                {/* Load More button (visible before infinite scroll trigger) */}
                {hasMoreApiLogs && apiLogs.length > 0 && !isLoadingMore && (
                  <div className="text-center py-4">
                    <Button
                      onClick={() => loadApiLogs(true)}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      Load More Logs
                    </Button>
                  </div>
                )}

                {/* Infinite scroll trigger (hidden) */}
                <div ref={apiLogsEndRef} className="h-4" />

                {/* Loading more indicator */}
                {isLoadingMore && (
                  <div className="text-center py-4">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
                    <p className="text-sm text-gray-500 mt-2">
                      Loading more logs...
                    </p>
                  </div>
                )}

                {/* End of results indicator */}
                {!hasMoreApiLogs && apiLogs.length > 0 && (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    ✓ All logs loaded ({apiLogs.length} total)
                  </div>
                )}
              </div>

              {/* Pagination - Hidden when using infinite scroll, shown as fallback */}
              {totalPages > 1 && false && (
                <div className="flex justify-center gap-2">
                  {Array.from(
                    { length: Math.min(totalPages, 10) },
                    (_, i) => i + 1
                  ).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-4 py-2 rounded-lg ${
                        currentPage === page
                          ? "bg-orange-600 text-white"
                          : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Moderation History Modal */}
          {showModerationModal && selectedUser && moderationHistory && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <Card className="max-w-3xl w-full max-h-[80vh] overflow-y-auto p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-2xl font-bold">
                    Moderation History: {selectedUser.name}
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowModerationModal(false);
                      setSelectedUser(null);
                      setModerationHistory(null);
                    }}
                  >
                    Close
                  </Button>
                </div>

                {/* Active Actions */}
                {moderationHistory.activeActions.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold mb-3 text-orange-600">
                      Active Moderation Actions
                    </h4>
                    <div className="space-y-2">
                      {moderationHistory.activeActions.map((action: any) => (
                        <div
                          key={action.moderationActionId}
                          className="p-3 border rounded-lg bg-red-50 dark:bg-red-950/20"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <Badge className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 mb-2">
                                {action.actionType.toUpperCase()}
                              </Badge>
                              {action.reason && (
                                <p className="text-sm mb-1">
                                  <strong>Reason:</strong> {action.reason}
                                </p>
                              )}
                              {action.expiresAt && (
                                <p className="text-sm text-gray-600">
                                  <strong>Expires:</strong>{" "}
                                  {new Date(action.expiresAt).toLocaleString()}
                                </p>
                              )}
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(action.timestamp).toLocaleString()}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleUnbanUser(selectedUser.userId)
                              }
                              className="text-green-600"
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* History */}
                <div>
                  <h4 className="text-lg font-semibold mb-3">Full History</h4>
                  <div className="space-y-2">
                    {moderationHistory.history.map((action: any) => (
                      <div
                        key={action.moderationActionId}
                        className={`p-3 border rounded-lg ${
                          action.isActive
                            ? "bg-yellow-50 dark:bg-yellow-950/20"
                            : "bg-gray-50 dark:bg-gray-900"
                        }`}
                      >
                        <Badge
                          className={`mb-2 ${
                            action.actionType === "warning"
                              ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300"
                              : action.actionType === "timeout"
                              ? "bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300"
                              : "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300"
                          }`}
                        >
                          {action.actionType.toUpperCase()}
                          {!action.isActive && " (EXPIRED)"}
                        </Badge>
                        {action.reason && (
                          <p className="text-sm mb-1">
                            <strong>Reason:</strong> {action.reason}
                          </p>
                        )}
                        {action.adminNote && (
                          <p className="text-sm mb-1 text-gray-600">
                            <strong>Admin Note:</strong> {action.adminNote}
                          </p>
                        )}
                        {action.duration && (
                          <p className="text-sm text-gray-600">
                            <strong>Duration:</strong> {action.duration} hours
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(action.timestamp).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
