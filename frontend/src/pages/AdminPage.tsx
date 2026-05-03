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
import { useTranslation } from "react-i18next";

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalInventoryItems: number;
  totalRecipes: number;
  totalUploads: number;
}

export function AdminPage() {
  const { t } = useTranslation();
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
      setError(err.response?.data?.error || t("admin.errors.loadDashboard"));
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
      setError(err.response?.data?.error || t("admin.errors.loadUsers"));
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
      setError(err.response?.data?.error || t("admin.errors.loadInventory"));
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
      setError(err.response?.data?.error || t("admin.errors.loadRecipes"));
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
      setError(err.response?.data?.error || t("admin.errors.loadUploads"));
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
      setError(err.response?.data?.error || t("admin.errors.loadLogs"));
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
      setError(err.response?.data?.error || t("admin.errors.loadApiLogs"));
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
        err.response?.data?.error || t("admin.errors.loadModerationHistory")
      );
    }
  };

  const handleWarnUser = async (userId: string) => {
    const reason = window.prompt(t("admin.prompts.warningReason"));
    if (reason === null) return;

    const adminNote = window.prompt(t("admin.prompts.adminNoteOptional"));

    confirmDialog({
      title: t("admin.confirm.sendWarningTitle"),
      message: t("admin.confirm.sendWarningMessage"),
      confirmText: t("admin.confirm.sendWarning"),
      cancelText: t("common.cancel"),
      onConfirm: async () => {
        try {
          await apiService.sendWarningToUser(
            userId,
            reason.trim() || undefined,
            adminNote?.trim() || undefined
          );
          setSuccess(t("admin.messages.userWarned"));
          loadUsers();
          setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
          setError(err.response?.data?.error || t("admin.errors.warnUser"));
        }
      },
    });
  };

  const handleTimeoutUser = async (userId: string) => {
    const durationStr = window.prompt(
      t("admin.prompts.timeoutDuration")
    );
    if (durationStr === null) return;

    const duration = parseInt(durationStr);
    if (isNaN(duration) || duration <= 0) {
      setError(t("admin.errors.invalidDuration"));
      return;
    }

    const reason = window.prompt(t("admin.prompts.timeoutReason"));
    if (reason === null) return;

    const adminNote = window.prompt(t("admin.prompts.adminNoteOptional"));

    confirmDialog({
      title: t("admin.confirm.timeoutUserTitle"),
      message: t("admin.confirm.timeoutUserMessage", { duration }),
      confirmText: t("admin.confirm.timeoutUser"),
      cancelText: t("common.cancel"),
      onConfirm: async () => {
        try {
          await apiService.timeoutUser(
            userId,
            duration,
            reason.trim() || undefined,
            adminNote?.trim() || undefined
          );
          setSuccess(t("admin.messages.userTimedOutFor", { duration }));
          loadUsers();
          setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
          setError(err.response?.data?.error || t("admin.errors.timeoutUser"));
        }
      },
    });
  };

  const handleBanUser = async (userId: string) => {
    const isPermanent = window.confirm(
      t("admin.prompts.permanentBanQuestion")
    );

    let duration: number | undefined;
    if (!isPermanent) {
      const durationStr = window.prompt(
        t("admin.prompts.banDuration")
      );
      if (durationStr === null) return;

      duration = parseInt(durationStr);
      if (isNaN(duration) || duration <= 0) {
        setError(t("admin.errors.invalidDuration"));
        return;
      }
    }

    const reason = window.prompt(t("admin.prompts.banReason"));
    if (reason === null) return;

    const adminNote = window.prompt(t("admin.prompts.adminNoteOptional"));

    confirmDialog({
      title: isPermanent
        ? t("admin.confirm.permanentBanTitle")
        : t("admin.confirm.banUserTitle"),
      message: isPermanent
        ? t("admin.confirm.permanentBanMessage")
        : t("admin.confirm.banUserMessage", { duration }),
      confirmText: t("admin.confirm.banUser"),
      cancelText: t("common.cancel"),
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
              ? t("admin.messages.userPermanentlyBanned")
              : t("admin.messages.userBannedFor", { duration })
          );
          loadUsers();
          setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
          setError(err.response?.data?.error || t("admin.errors.banUser"));
        }
      },
    });
  };

  const handleUnbanUser = async (userId: string) => {
    confirmDialog({
      title: t("admin.confirm.unbanUserTitle"),
      message: t("admin.confirm.unbanUserMessage"),
      confirmText: t("admin.confirm.unbanUser"),
      cancelText: t("common.cancel"),
      onConfirm: async () => {
        try {
          await apiService.unbanUser(userId);
          setSuccess(t("admin.messages.userUnbanned"));
          loadUsers();
          setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
          setError(err.response?.data?.error || t("admin.errors.unbanUser"));
        }
      },
    });
  };

  const handleToggleUserRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    confirmDialog({
      title: t("admin.confirm.changeUserRoleTitle"),
      message: t("admin.confirm.changeUserRoleMessage", { newRole }),
      confirmText: t("admin.actions.changeRole"),
      cancelText: t("common.cancel"),
      onConfirm: async () => {
        try {
          await apiService.updateUserRole(userId, newRole);
          setSuccess(t("admin.messages.roleChanged"));
          loadUsers();
          setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
          setError(err.response?.data?.error || t("admin.errors.changeRole"));
        }
      },
    });
  };

  const handleDeleteUser = async (userId: string) => {
    confirmDialog({
      title: t("admin.deleteUserConfirm"),
      message: t("admin.deleteUserMessage"),
      confirmText: t("admin.deleteUserButton"),
      cancelText: t("common.cancel"),
      onConfirm: async () => {
        try {
          await apiService.deleteUser(userId);
          setSuccess(t("admin.messages.userDeletedWithEmail"));
          loadUsers();
          setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
          setError(err.response?.data?.error || t("admin.errors.deleteUser"));
        }
      },
    });
  };

  const handleDeleteInventoryItem = async (itemId: string) => {
    confirmDialog({
      title: t("admin.deleteInventoryConfirm"),
      message: t("admin.deleteInventoryMessage"),
      confirmText: t("common.delete"),
      cancelText: t("common.cancel"),
      onConfirm: async () => {
        try {
          await apiService.deleteAdminInventoryItem(itemId);
          setSuccess(t("admin.messages.inventoryDeleted"));
          loadInventory();
          setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
          setError(
            err.response?.data?.error || t("admin.errors.deleteInventory")
          );
        }
      },
    });
  };

  const handleDeleteRecipe = async (recipeId: string) => {
    confirmDialog({
      title: t("admin.deleteRecipeConfirm"),
      message: t("admin.deleteRecipeMessage"),
      confirmText: t("common.delete"),
      cancelText: t("common.cancel"),
      onConfirm: async () => {
        try {
          await apiService.deleteAdminRecipe(recipeId);
          setSuccess(t("admin.messages.recipeDeleted"));
          loadRecipes();
          setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
          setError(err.response?.data?.error || t("admin.errors.deleteRecipe"));
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
              {t("admin.title")}
            </h1>
          </div>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
            {t("admin.subtitle")}
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
            { key: "dashboard", icon: BarChart3, label: t("admin.tabs.dashboard") },
            { key: "users", icon: Users, label: t("admin.tabs.users") },
            { key: "inventory", icon: ShoppingBag, label: t("admin.tabs.inventory") },
            { key: "recipes", icon: ChefHat, label: t("admin.tabs.recipes") },
            { key: "uploads", icon: Image, label: t("admin.tabs.uploads") },
            { key: "logs", icon: AlertCircle, label: t("admin.tabs.adminLogs") },
            { key: "api-logs", icon: History, label: t("admin.tabs.apiLogs") },
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
                  label: t("admin.stats.totalUsers"),
                  value: stats.totalUsers,
                  icon: Users,
                  color: "blue",
                },
                {
                  label: t("admin.stats.activeUsers"),
                  value: stats.activeUsers,
                  icon: CheckCircle,
                  color: "green",
                },
                {
                  label: t("admin.stats.inventoryItems"),
                  value: stats.totalInventoryItems,
                  icon: ShoppingBag,
                  color: "orange",
                },
                {
                  label: t("admin.stats.recipes"),
                  value: stats.totalRecipes,
                  icon: ChefHat,
                  color: "orange",
                },
                {
                  label: t("admin.stats.totalUploads"),
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
                  placeholder={t("admin.searchUsers")}
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
                              {t("admin.status.admin")}
                            </Badge>
                          )}
                          {user.isActive ? (
                            <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                              {t("admin.status.active")}
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                              {t("admin.status.inactive")}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {user.email}
                        </p>
                        <div className="flex gap-4 mt-2 text-xs text-gray-500">
                          <span>{t("admin.labels.itemsCount", { count: user._count.inventoryItems })}</span>
                          <span>{t("admin.labels.recipesCount", { count: user._count.recipes })}</span>
                          <span>{t("admin.labels.sessionsCount", { count: user._count.sessions })}</span>
                          <span>
                            {t("admin.labels.joined")} {" "}
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
                          title={t("admin.actions.changeRole")}
                        >
                          <UserCog className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleWarnUser(user.userId)}
                          className="text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                          title={t("admin.actions.warn")}
                        >
                          <AlertTriangle className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTimeoutUser(user.userId)}
                          className="text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950"
                          title={t("admin.actions.timeout")}
                        >
                          <Clock className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleBanUser(user.userId)}
                          className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                          title={t("admin.actions.ban")}
                        >
                          <Ban className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewUserModeration(user)}
                          className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                          title={t("admin.actions.viewHistory")}
                        >
                          <History className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteUser(user.userId)}
                          className="text-red-800 hover:bg-red-100 dark:hover:bg-red-950"
                          title={t("admin.deleteAccountPermanently")}
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
                  placeholder={t("admin.searchInventory")}
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
                        {t("admin.labels.expires")} {" "}
                        {new Date(item.expiryDate).toLocaleDateString()}
                      </p>
                      {item.location && <p>{t("admin.labels.location")} {item.location}</p>}
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
                  placeholder={t("admin.searchRecipes")}
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
                            {t("admin.labels.by")} {recipe.user.name}
                          </p>
                        )}
                        <div className="flex gap-2 mt-2">
                          <span className="text-xs text-gray-500">
                            {recipe.calories} {t("admin.labels.cal")}
                          </span>
                          <span className="text-xs text-gray-500">
                            {recipe.servings} {t("admin.labels.servings")}
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
                    {upload.aiService} • {t("admin.labels.itemsDetected", { count: upload.detectedItems.length })}
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
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">
                    {t("admin.filters.filterByAction")}
                  </label>
                  <select
                    value={logFilters.action}
                    onChange={(e) =>
                      setLogFilters({ ...logFilters, action: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-700"
                  >
                    <option value="">{t("admin.filters.allActions")}</option>
                    <option value="user_warned">{t("admin.logActions.user_warned")}</option>
                    <option value="user_timeout">{t("admin.logActions.user_timeout")}</option>
                    <option value="user_banned">{t("admin.logActions.user_banned")}</option>
                    <option value="user_unbanned">{t("admin.logActions.user_unbanned")}</option>
                    <option value="user_suspended">{t("admin.logActions.user_suspended")}</option>
                    <option value="user_reactivated">{t("admin.logActions.user_reactivated")}</option>
                    <option value="user_deleted">{t("admin.logActions.user_deleted")}</option>
                    <option value="rate_limit_reset">{t("admin.logActions.rate_limit_reset")}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">
                    {t("admin.filters.filterByTargetType")}
                  </label>
                  <select
                    value={logFilters.targetType}
                    onChange={(e) =>
                      setLogFilters({
                        ...logFilters,
                        targetType: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-700"
                  >
                    <option value="">{t("admin.filters.allTypes")}</option>
                    <option value="user">{t("admin.targetTypes.user")}</option>
                    <option value="recipe">{t("admin.targetTypes.recipe")}</option>
                    <option value="inventory">{t("admin.targetTypes.inventory")}</option>
                    <option value="upload">{t("admin.targetTypes.upload")}</option>
                    <option value="system">{t("admin.targetTypes.system")}</option>
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
                            {t(`admin.targetTypes.${log.targetType}`, { defaultValue: log.targetType })}
                          </Badge>
                        </div>
                        <div className="text-sm space-y-1">
                          {log.targetName && (
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {t("admin.labels.target")} {log.targetName}
                            </p>
                          )}
                          {log.targetEmail && (
                            <p className="text-gray-600 dark:text-gray-300">
                              {t("admin.labels.email")} {log.targetEmail}
                            </p>
                          )}
                          {log.details &&
                            Object.keys(log.details).length > 0 && (
                              <details className="text-gray-600 dark:text-gray-300">
                                <summary className="cursor-pointer hover:text-orange-600">
                                  {t("admin.labels.viewDetails")}
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
                    {t("admin.messages.noLogsFound")}
                  </div>
                )}

                {/* Load More button (visible before infinite scroll trigger) */}
                {hasMoreLogs && logs.length > 0 && !isLoadingMore && (
                  <div className="text-center py-4">
                    <Button
                      onClick={() => loadLogs(true)}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      {t("admin.actions.loadMore")}
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
                      {t("admin.messages.loadingMoreLogs")}
                    </p>
                  </div>
                )}

                {/* End of results indicator */}
                {!hasMoreLogs && logs.length > 0 && (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    ✓ {t("admin.messages.allLogsLoadedCount", { count: logs.length })}
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
                      {t("admin.apiStats.totalRequests")}
                    </div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {apiStats.totalRequests.toLocaleString()}
                    </div>
                  </Card>
                  <Card className="p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                      {t("admin.apiStats.successRate")}
                    </div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {apiStats.successRate}%
                    </div>
                  </Card>
                  <Card className="p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                      {t("admin.apiStats.avgResponse")}
                    </div>
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {apiStats.avgResponseTime}ms
                    </div>
                  </Card>
                  <Card className="p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                      {t("admin.apiStats.failedRequests")}
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
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">
                    {t("admin.filters.searchUserPath")}
                  </label>
                  <Input
                    type="text"
                    placeholder={t("admin.searchLogs")}
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">
                    {t("admin.filters.httpMethod")}
                  </label>
                  <select
                    value={apiLogFilters.method}
                    onChange={(e) =>
                      setApiLogFilters({
                        ...apiLogFilters,
                        method: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-700"
                  >
                    <option value="">{t("admin.filters.allMethods")}</option>
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                    <option value="PATCH">PATCH</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">
                    {t("admin.filters.statusCode")}
                  </label>
                  <select
                    value={apiLogFilters.statusCode}
                    onChange={(e) =>
                      setApiLogFilters({
                        ...apiLogFilters,
                        statusCode: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-700"
                  >
                    <option value="">{t("admin.filters.allCodes")}</option>
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
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">
                    {t("admin.filters.pathFilter")}
                  </label>
                  <Input
                    type="text"
                    placeholder={t("admin.pathFilterPlaceholder")}
                    value={apiLogFilters.path}
                    onChange={(e) =>
                      setApiLogFilters({
                        ...apiLogFilters,
                        path: e.target.value,
                      })
                    }
                    className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-700"
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
                              {t("admin.status.user")}: {log.userName} ({log.userEmail})
                            </p>
                          )}
                          {!log.userName && (
                            <p className="text-gray-500 dark:text-gray-500 italic">
                              {t("admin.labels.unauthenticatedRequest")}
                            </p>
                          )}
                          {log.errorMessage && (
                            <p className="text-red-600 dark:text-red-400">
                              {t("common.error")}: {log.errorMessage}
                            </p>
                          )}
                          {log.requestBody &&
                            Object.keys(log.requestBody).length > 0 && (
                              <details className="text-gray-600 dark:text-gray-300">
                                <summary className="cursor-pointer hover:text-orange-600">
                                  {t("admin.labels.viewRequestBody")}
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
                                  {t("admin.labels.viewResponseBody")}
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
                    {t("admin.messages.noApiLogsFound")}
                  </div>
                )}

                {/* Load More button (visible before infinite scroll trigger) */}
                {hasMoreApiLogs && apiLogs.length > 0 && !isLoadingMore && (
                  <div className="text-center py-4">
                    <Button
                      onClick={() => loadApiLogs(true)}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      {t("admin.actions.loadMore")}
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
                      {t("admin.messages.loadingMoreLogs")}
                    </p>
                  </div>
                )}

                {/* End of results indicator */}
                {!hasMoreApiLogs && apiLogs.length > 0 && (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    ✓ {t("admin.messages.allLogsLoadedCount", { count: apiLogs.length })}
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
                    {t("admin.labels.moderationHistory")}: {selectedUser.name}
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
                    {t("common.close")}
                  </Button>
                </div>

                {/* Active Actions */}
                {moderationHistory.activeActions.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold mb-3 text-orange-600">
                      {t("admin.labels.activeModerationActions")}
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
                                  <strong>{t("admin.labels.reason")}</strong> {action.reason}
                                </p>
                              )}
                              {action.expiresAt && (
                                <p className="text-sm text-gray-600">
                                  <strong>{t("admin.labels.expires")}</strong>{" "}
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
                              {t("admin.actions.unban")}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* History */}
                <div>
                  <h4 className="text-lg font-semibold mb-3">{t("admin.fullHistory")}</h4>
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
                          {!action.isActive && ` (${t("admin.labels.expired")})`}
                        </Badge>
                        {action.reason && (
                          <p className="text-sm mb-1">
                            <strong>{t("admin.labels.reason")}</strong> {action.reason}
                          </p>
                        )}
                        {action.adminNote && (
                          <p className="text-sm mb-1 text-gray-600">
                            <strong>{t("admin.labels.adminNote")}</strong> {action.adminNote}
                          </p>
                        )}
                        {action.duration && (
                          <p className="text-sm text-gray-600">
                            <strong>{t("admin.labels.duration")}</strong> {action.duration} {t("admin.labels.hours")}
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
