import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Camera,
  AlertCircle,
  TrendingUp,
  Package,
  Calendar,
  Loader2,
  Refrigerator,
  Archive,
  Snowflake,
  Search,
  Grid3x3,
  List,
  BarChart3,
  Trash2,
  Edit2,
  X,
  Download,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Alert, AlertDescription } from "../components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { PhotoUpload } from "../components/inventory/PhotoUpload";
import { AIDetectionReview } from "../components/inventory/AIDetectionReview";
import { EnhancedManualItemForm } from "../components/inventory/EnhancedManualItemForm";
import { ScrollToTop } from "../components/ScrollToTop";
import { confirmDialog } from "../utils/confirmDialog";
import { PullToRefreshIndicator } from "../components/PullToRefreshIndicator";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { usePullToRefresh } from "../hooks/usePullToRefresh";
import { apiService } from "../services/api";
import type {
  DetectionResult,
  InventoryAnalytics,
  InventoryItem,
} from "../types";

type ViewMode = "grid" | "list";
type LocationFilter = "all" | "fridge" | "pantry" | "freezer";
type StockFilter = "all" | "low" | "normal" | "expiring";

export function InventoryPage() {
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [detectionResult, setDetectionResult] =
    useState<DetectionResult | null>(null);
  const [analytics, setAnalytics] = useState<InventoryAnalytics | null>(null);
  const [expiringItems, setExpiringItems] = useState<InventoryItem[]>([]);
  const [allItems, setAllItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [locationFilter, setLocationFilter] = useState<LocationFilter>("all");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const { t, i18n } = useTranslation();

  // GSAP refs
  const headerRef = useRef<HTMLDivElement>(null);
  const analyticsRef = useRef<HTMLDivElement>(null);
  const expiringRef = useRef<HTMLDivElement>(null);
  const itemsGridRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Pull to refresh
  const { isRefreshing, pullDistance } = usePullToRefresh({
    onRefresh: async () => {
      await loadInventoryData();
      toast.success(t("inventory.messages.inventoryRefreshed"));
    },
    threshold: 80,
  });

  useEffect(() => {
    loadInventoryData();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case "f":
            e.preventDefault();
            document.getElementById("search-inventory")?.focus();
            break;
          case "n":
            e.preventDefault();
            setShowManualForm(true);
            toast.info(t("inventory.messages.openingManualForm"));
            break;
          case "g":
            e.preventDefault();
            setViewMode((prev) => (prev === "grid" ? "list" : "grid"));
            toast.info(
              t("inventory.messages.switchedView", {
                view:
                  viewMode === "grid"
                    ? t("inventory.messages.listView")
                    : t("inventory.messages.gridView"),
              })
            );
            break;
        }
      } else if (e.key === "Escape") {
        if (showPhotoUpload) setShowPhotoUpload(false);
        if (showManualForm) setShowManualForm(false);
        if (showEditModal) setShowEditModal(false);
        if (detectionResult) setDetectionResult(null);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [
    viewMode,
    showPhotoUpload,
    showManualForm,
    showEditModal,
    detectionResult,
  ]);

  // GSAP animations on mount
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
    if (!isLoading && analyticsRef.current) {
      const cards = analyticsRef.current.querySelectorAll(".analytics-card");
      gsap.fromTo(
        cards,
        { opacity: 0, scale: 0.9 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.4,
          stagger: 0.1,
          ease: "back.out(1.2)",
        }
      );
    }
  }, [isLoading, analytics]);

  useEffect(() => {
    if (expiringItems.length > 0 && expiringRef.current) {
      gsap.fromTo(
        expiringRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, delay: 0.2, ease: "power2.out" }
      );
    }
  }, [expiringItems]);

  useEffect(() => {
    if (!isLoading && itemsGridRef.current) {
      const items = itemsGridRef.current.querySelectorAll(".item-card");
      if (items.length > 0) {
        gsap.fromTo(
          items,
          { opacity: 0, scale: 0.9 },
          {
            opacity: 1,
            scale: 1,
            duration: 0.3,
            stagger: 0.05,
            ease: "power2.out",
          }
        );
      }
    }
  }, [allItems, locationFilter, searchQuery, viewMode, isLoading]);

  useEffect(() => {
    if (showPhotoUpload && modalRef.current) {
      gsap.fromTo(
        modalRef.current,
        { opacity: 0, scale: 0.9 },
        { opacity: 1, scale: 1, duration: 0.3, ease: "power2.out" }
      );
    }
  }, [showPhotoUpload, detectionResult]);

  const loadInventoryData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [analyticsData, expiringData] = await Promise.all([
        apiService.getInventoryAnalytics(),
        apiService.getExpiringItems(7),
      ]);
      setAnalytics(analyticsData);
      setExpiringItems(expiringData.items);

      // Load all items
      const allItemsData = await apiService.getAllInventoryItems();
      setAllItems(allItemsData);
    } catch (err: any) {
      setError(err.response?.data?.error || t("inventory.messages.loadFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoUpload = async (file: File) => {
    setError(null);
    try {
      const result = await apiService.uploadInventoryImage(file, i18n.language);
      setDetectionResult(result);
      setShowPhotoUpload(false);
    } catch (err: any) {
      // Handle rate limit errors specifically
      if (err.response?.status === 429) {
        const errorData = err.response?.data;
        const resetInHours = errorData?.resetInHours || "24";
        const errorMessage = t("inventory.messages.aiImageLimitReached", {
          hours: resetInHours,
        });
        setError(errorMessage);
        toast.error(errorMessage, { duration: 5000 });
      } else {
        setError(err.response?.data?.error || t("inventory.messages.analyzeFailed"));
      }
    }
  };

  const handleConfirmItems = async (
    uploadId: string,
    selectedItems: DetectionResult["detectedItems"]
  ) => {
    setError(null);
    try {
      await apiService.confirmDetectedItems(uploadId, selectedItems);
      setSuccessMessage(
        t("inventory.messages.itemsAdded", { count: selectedItems.length })
      );
      setDetectionResult(null);
      await loadInventoryData();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || t("inventory.messages.addItemsFailed"));
    }
  };

  const handleAddManualItem = async (
    items: Array<{
      name: string;
      quantity: number;
      unit: string;
      location: string;
      expiryDate?: string;
      category?: string;
      tags?: string[];
      image?: string;
    }>
  ) => {
    setError(null);
    try {
      // Add all items
      for (const itemData of items) {
        await apiService.addManualInventoryItem({
          ingredientName: itemData.name,
          quantity: itemData.quantity,
          unit: itemData.unit,
          location: itemData.location,
          expiryDate: itemData.expiryDate,
          category: itemData.category,
        });
      }
      setSuccessMessage(
        t("inventory.messages.itemsAdded", { count: items.length })
      );
      setShowManualForm(false);
      await loadInventoryData();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      throw err;
    }
  };

  const handleExportCSV = () => {
    if (filteredItems.length === 0) {
      toast.error(t("inventory.noItemsToExport"));
      return;
    }

    // Create CSV content
    const headers = [
      "Name",
      "Quantity",
      "Unit",
      "Location",
      "Expiry Date",
      "Added Date",
    ];
    const rows = filteredItems.map((item) => [
      item.ingredient?.name || "Unknown",
      item.quantity.toString(),
      item.unit,
      item.location,
      item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : "N/A",
      item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "N/A",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `inventory_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(t("inventory.messages.exportedToCsv", { count: filteredItems.length }));
  };

  const handleDeleteItem = async (itemId: string) => {
    confirmDialog({
      title: t("inventory.confirmDelete") || "Delete Item?",
      message:
        t("inventory.confirmDeleteMessage") ||
        "Are you sure you want to delete this item? This action cannot be undone.",
      confirmText: t("common.delete") || "Delete",
      cancelText: t("common.cancel") || "Cancel",
      onConfirm: async () => {
        setError(null);
        try {
          await apiService.deleteInventoryItem(itemId);

          // Update local state without reloading
          setAllItems((prevItems) =>
            prevItems.filter((item) => item.inventoryItemId !== itemId)
          );
          setExpiringItems((prevItems) =>
            prevItems.filter((item) => item.inventoryItemId !== itemId)
          );

          // Update analytics
          if (analytics) {
            setAnalytics({
              ...analytics,
              totalItems: analytics.totalItems - 1,
            });
          }

          toast.success(
            t("inventory.itemDeleted") || "Item deleted successfully!"
          );
        } catch (err: any) {
          setError(err.response?.data?.error || t("inventory.messages.deleteFailed"));
          toast.error(err.response?.data?.error || t("inventory.messages.deleteFailed"));
        }
      },
    });
  };

  const handleDeleteExpiredItems = async () => {
    const expiredItems = allItems.filter((item) => {
      if (!item.expiryDate) return false;
      const expiryDate = new Date(item.expiryDate);
      return expiryDate < new Date();
    });

    if (expiredItems.length === 0) {
      toast.info(t("inventory.noExpiredItems"));
      return;
    }

    confirmDialog({
      title: t("inventory.confirmDeleteExpired"),
      message: t("inventory.messages.deleteExpiredConfirmMessage", {
        count: expiredItems.length,
      }),
      confirmText: t("inventory.messages.deleteAll"),
      cancelText: t("common.cancel"),
      onConfirm: async () => {
        setError(null);
        let deletedCount = 0;
        let failedCount = 0;

        try {
          // Delete all expired items
          for (const item of expiredItems) {
            try {
              await apiService.deleteInventoryItem(item.inventoryItemId);
              deletedCount++;
            } catch (err) {
              failedCount++;
              console.error(
                `Failed to delete item ${item.inventoryItemId}:`,
                err
              );
            }
          }

          // Update local state
          const expiredIds = expiredItems.map((item) => item.inventoryItemId);
          setAllItems((prevItems) =>
            prevItems.filter(
              (item) => !expiredIds.includes(item.inventoryItemId)
            )
          );
          setExpiringItems((prevItems) =>
            prevItems.filter(
              (item) => !expiredIds.includes(item.inventoryItemId)
            )
          );

          // Update analytics
          if (analytics) {
            setAnalytics({
              ...analytics,
              totalItems: analytics.totalItems - deletedCount,
            });
          }

          if (deletedCount > 0) {
            toast.success(
              t("inventory.messages.deleteExpiredSuccess", {
                deleted: deletedCount,
                failed: failedCount,
              })
            );
          }
          if (failedCount > 0 && deletedCount === 0) {
            toast.error(t("inventory.messages.deleteExpiredFailedCount", { count: failedCount }));
          }
        } catch (err: any) {
          setError(
            err.response?.data?.error || t("inventory.messages.deleteExpiredFailed")
          );
          toast.error(
            err.response?.data?.error || t("inventory.messages.deleteExpiredFailed")
          );
        }
      },
    });
  };

  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setShowEditModal(true);
  };

  const handleUpdateItem = async (itemData: {
    quantity: number;
    unit: string;
    location: string;
    expiryDate?: string;
  }) => {
    if (!editingItem) return;

    setError(null);
    try {
      await apiService.updateInventoryItem(
        editingItem.inventoryItemId,
        itemData
      );
      setSuccessMessage(
        t("inventory.itemUpdated") || "Item updated successfully!"
      );
      setShowEditModal(false);
      setEditingItem(null);
      await loadInventoryData();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || t("inventory.messages.updateFailed"));
    }
  };

  const getLocationIcon = (location: string | undefined) => {
    switch (location) {
      case "fridge":
        return <Refrigerator className="w-4 h-4" />;
      case "freezer":
        return <Snowflake className="w-4 h-4" />;
      case "pantry":
        return <Archive className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const getLocationLabel = (location: string | undefined) => {
    switch (location) {
      case "fridge":
        return t("inventory.locations.fridge") || "Fridge";
      case "freezer":
        return t("inventory.locations.freezer") || "Freezer";
      case "pantry":
        return t("inventory.locations.pantry") || "Pantry";
      default:
        return t("inventory.locations.other") || "Other";
    }
  };

  const getExpiryStatus = (expiryDate: string | null) => {
    if (!expiryDate)
      return { text: t("inventory.noExpiry"), color: "bg-gray-100 text-gray-600" };

    const days = Math.floor(
      (new Date(expiryDate).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24)
    );

    if (days < 0) return { text: t("inventory.expired"), color: "bg-red-100 text-red-700" };
    if (days === 0) return { text: t("inventory.messages.today"), color: "bg-red-100 text-red-700" };
    if (days <= 3)
      return { text: t("inventory.messages.daysLeft", { days }), color: "bg-orange-100 text-orange-700" };
    if (days <= 7)
      return { text: t("inventory.messages.daysLeft", { days }), color: "bg-yellow-100 text-yellow-700" };
    return { text: t("inventory.messages.daysLeft", { days }), color: "bg-green-100 text-green-700" };
  };

  const filteredItems = allItems.filter((item) => {
    const matchesLocation =
      locationFilter === "all" || item.location === locationFilter;
    const matchesSearch = (item.ingredient?.name || "")
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    let matchesStock = true;
    if (stockFilter === "low") {
      matchesStock = item.quantity < 3; // Low stock threshold
    } else if (stockFilter === "expiring") {
      if (item.expiryDate) {
        const expiryDate = new Date(item.expiryDate);
        const daysUntilExpiry = Math.ceil(
          (expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
        matchesStock = daysUntilExpiry <= 7;
      } else {
        matchesStock = false;
      }
    } else if (stockFilter === "normal") {
      matchesStock = item.quantity >= 3;
    }

    return matchesLocation && matchesSearch && matchesStock;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-green-600 dark:text-green-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 md:pb-8 pt-0 md:pt-20">
      {/* Pull to Refresh Indicator */}
      <PullToRefreshIndicator
        pullDistance={pullDistance}
        isRefreshing={isRefreshing}
        threshold={80}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* Breadcrumbs */}
        <Breadcrumbs />

        {/* Header */}
        <div
          ref={headerRef}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 md:mb-8 gap-4"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-600 to-green-300 dark:from-green-400 dark:to-green-600 bg-clip-text text-transparent">
              {t("inventory.title")}
            </h1>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 mt-2">
              {t("inventory.subtitle")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 md:gap-3">
            <Button
              onClick={() => setShowManualForm(!showManualForm)}
              variant="outline"
              className="border-green-600 dark:border-green-500 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950"
            >
              + {t("inventory.manualAdd")}
            </Button>
            <Button
              onClick={handleDeleteExpiredItems}
              variant="outline"
              disabled={
                allItems.filter(
                  (item) =>
                    item.expiryDate && new Date(item.expiryDate) < new Date()
                ).length === 0
              }
              className="border-red-600 dark:border-red-500 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {t("inventory.deleteExpired")}
            </Button>
            <Button
              onClick={handleExportCSV}
              variant="outline"
              disabled={allItems.length === 0}
              className="border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button
              onClick={() => setShowPhotoUpload(true)}
              className="bg-gradient-to-r from-green-600 to-green-300 text-white hover:from-green-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Camera className="w-5 h-5 mr-2" />
              {t("inventory.scanPhoto")}
            </Button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="w-5 h-5" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {successMessage && (
          <Alert className="mb-6 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-700 dark:text-green-300">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Manual Item Form */}
        {showManualForm && (
          <div className="mb-8">
            <EnhancedManualItemForm
              onSubmit={handleAddManualItem}
              onCancel={() => setShowManualForm(false)}
              enableBatchMode={true}
            />
          </div>
        )}

        {/* Analytics Cards */}
        <div
          ref={analyticsRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8"
        >
          {[
            {
              icon: Package,
              title: t("dashboard.totalItems"),
              value: analytics?.totalItems || 0,
              subtitle: `${analytics?.aiDetectionPercentage || 0}% ${t(
                "inventory.detectedByAI"
              )}`,
              bgColor: "bg-green-100 dark:bg-green-950/50",
              borderColor: "border-green-100 dark:border-green-800",
              iconColor: "text-green-600 dark:text-green-400",
              delay: 0,
            },
            {
              icon: Calendar,
              title: t("dashboard.expiringItems"),
              value: analytics?.expiringItems || 0,
              subtitle: `${t("dashboard.inNext7Days")}`,
              bgColor: "bg-orange-100 dark:bg-orange-950/50",
              borderColor: "border-orange-100 dark:border-orange-800",
              iconColor: "text-orange-600 dark:text-orange-400",
              delay: 0.1,
            },
            {
              icon: Refrigerator,
              title: `In ${t("inventory.fridge")}`,
              value: analytics?.byLocation.fridge || 0,
              subtitle: `${t("inventory.pantry")}: ${
                analytics?.byLocation.pantry || 0
              } | ${t("inventory.freezer")}: ${
                analytics?.byLocation.freezer || 0
              }`,
              bgColor: "bg-blue-100 dark:bg-blue-950/50",
              borderColor: "border-blue-100 dark:border-blue-800",
              iconColor: "text-blue-600 dark:text-blue-400",
              delay: 0.2,
            },
          ].map((card, index) => (
            <div key={index} className="analytics-card">
              <Card
                className={`p-4 sm:p-6 bg-white dark:bg-gray-900 ${card.borderColor} hover:shadow-lg transition-shadow duration-200`}
              >
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className={`p-2 sm:p-3 ${card.bgColor} rounded-lg`}>
                    <card.icon
                      className={`w-5 h-5 sm:w-6 sm:h-6 ${card.iconColor}`}
                    />
                  </div>
                  <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {card.value}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {card.title}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {card.subtitle}
                </p>
              </Card>
            </div>
          ))}

          <div className="analytics-card">
            <Card className="p-6 bg-gradient-to-br from-green-600 to-green-300 text-white hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold">{t("inventory.aiPowered")}</p>
              <p className="text-sm text-blue-100 mt-1">
                {t("inventory.automaticDetection")}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 bg-white/10 border-white/20 text-white hover:bg-white/20"
                onClick={() => setShowPhotoUpload(true)}
              >
                <Camera className="w-4 h-4 mr-2" />
                {t("inventory.scanPhoto")}
              </Button>
            </Card>
          </div>
        </div>

        {/* Expiring Items Alert */}
        {expiringItems.length > 0 && (
          <div ref={expiringRef}>
            <Card className="p-6 mb-8 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 border-orange-200 dark:border-orange-800">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {t("dashboard.expiringItems")}
                  </h3>
                  <div className="space-y-2">
                    {expiringItems.slice(0, 3).map((item) => {
                      const expiry = getExpiryStatus(item.expiryDate);
                      return (
                        <div
                          key={item.inventoryItemId}
                          className="flex items-center justify-between bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm p-3 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            {getLocationIcon(item.location)}
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-100">
                                {item.ingredient?.name}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {item.quantity} {item.unit} • {item.location}
                              </p>
                            </div>
                          </div>
                          <Badge className={expiry.color}>{expiry.text}</Badge>
                        </div>
                      );
                    })}
                  </div>
                  {expiringItems.length > 3 && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
                      +{expiringItems.length - 3} more items expiring soon
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Filters and View Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
            <input
              id="search-inventory"
              type="text"
              placeholder={t("inventory.search") + "... (Ctrl+F)"}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-2">
            <Select
              value={locationFilter}
              onValueChange={(value) =>
                setLocationFilter(value as LocationFilter)
              }
            >
              <SelectTrigger className="w-[180px] bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700">
                <SelectValue placeholder={t("inventory.all")} />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100">
                <SelectItem
                  value="all"
                  className="text-gray-900 dark:text-gray-100"
                >
                  {t("inventory.all")}
                </SelectItem>
                <SelectItem
                  value="fridge"
                  className="text-gray-900 dark:text-gray-100"
                >
                  🧊 {t("inventory.fridge")}
                </SelectItem>
                <SelectItem
                  value="pantry"
                  className="text-gray-900 dark:text-gray-100"
                >
                  📦 {t("inventory.pantry")}
                </SelectItem>
                <SelectItem
                  value="freezer"
                  className="text-gray-900 dark:text-gray-100"
                >
                  ❄️ {t("inventory.freezer")}
                </SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={stockFilter}
              onValueChange={(value) => setStockFilter(value as StockFilter)}
            >
              <SelectTrigger className="w-[180px] bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700">
                <SelectValue placeholder={t("inventory.all")} />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100">
                <SelectItem
                  value="all"
                  className="text-gray-900 dark:text-gray-100"
                >
                  🔍 {t("inventory.all")}
                </SelectItem>
                <SelectItem
                  value="low"
                  className="text-gray-900 dark:text-gray-100"
                >
                  ⚠️ {t("inventory.low")}
                </SelectItem>
                <SelectItem
                  value="normal"
                  className="text-gray-900 dark:text-gray-100"
                >
                  ✅ {t("inventory.normal")}
                </SelectItem>
                <SelectItem
                  value="expiring"
                  className="text-gray-900 dark:text-gray-100"
                >
                  ⏰ {t("inventory.expiring")}
                </SelectItem>
              </SelectContent>
            </Select>

            <div className="flex border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={`px-3 py-2 ${
                  viewMode === "grid"
                    ? "bg-green-600 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                <Grid3x3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-3 py-2 ${
                  viewMode === "list"
                    ? "bg-green-600 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Items Display */}
        {filteredItems.length === 0 ? (
          <Card className="p-12 text-center bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <Package className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {t("inventory.emptyState")}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchQuery || locationFilter !== "all"
                ? "Try adjusting your filters"
                : t("inventory.emptyStateDesc")}
            </p>
            {!searchQuery && locationFilter === "all" && (
              <Button
                onClick={() => setShowPhotoUpload(true)}
                className="bg-gradient-to-r from-green-600 to-green-300 text-white"
              >
                <Camera className="w-5 h-5 mr-2" />
                {t("inventory.scanPhoto")}
              </Button>
            )}
          </Card>
        ) : viewMode === "grid" ? (
          <div
            ref={itemsGridRef}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {filteredItems.map((item) => {
              const expiry = getExpiryStatus(item.expiryDate);
              return (
                <div key={item.inventoryItemId} className="item-card">
                  <Card className="p-4 hover:shadow-lg transition-all duration-200 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2 dark:text-white">
                        {getLocationIcon(item.location)}
                        <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                          {getLocationLabel(item.location)}
                        </span>
                      </div>
                      {item.aiDetected ? (
                        <Badge className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs">
                          AI
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs">
                          Manual
                        </Badge>
                      )}
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      {item.ingredient?.name}
                    </h3>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          {t("inventory.quantity")}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {item.quantity} {item.unit}
                        </span>
                      </div>
                      {item.expiryDate && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">
                            Expires
                          </span>
                          <Badge className={expiry.color}>{expiry.text}</Badge>
                        </div>
                      )}
                      {item.ingredient?.category && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">
                            {t("inventory.category")}
                          </span>
                          <span className="font-medium text-gray-900 dark:text-gray-100 capitalize">
                            {item.ingredient.category}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 dark:border-gray-700 dark:hover:bg-gray-800 dark:text-gray-100 hover:cursor-pointer"
                        onClick={() => handleEditItem(item)}
                      >
                        <Edit2 className="w-4 h-4 mr-1" />
                        {t("common.edit")}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 dark:border-gray-700 dark:hover:border-red-600 hover:cursor-pointer"
                        onClick={() => handleDeleteItem(item.inventoryItemId)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
        ) : (
          <div>
            <Card className="overflow-hidden bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t("inventory.itemName")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t("inventory.location")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t("inventory.quantity")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t("inventory.category")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Expiry
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                    {filteredItems.map((item) => {
                      const expiry = getExpiryStatus(item.expiryDate);
                      return (
                        <tr
                          key={item.inventoryItemId}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {item.ingredient?.name}
                              </span>
                              {item.aiDetected && (
                                <Badge className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs">
                                  AI
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {getLocationIcon(item.location)}
                              <span className="text-sm text-gray-900 dark:text-gray-100 capitalize">
                                {item.location}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {item.quantity} {item.unit}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 capitalize">
                            {item.ingredient?.category || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {item.expiryDate ? (
                              <Badge className={expiry.color}>
                                {expiry.text}
                              </Badge>
                            ) : (
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                -
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="dark:hover:bg-gray-800"
                                onClick={() => handleEditItem(item)}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950"
                                onClick={() =>
                                  handleDeleteItem(item.inventoryItemId)
                                }
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* Results Summary */}
        {filteredItems.length > 0 && (
          <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            {t("inventory.showingResults", {
              count: filteredItems.length,
            })}
          </div>
        )}
      </div>

      {/* Photo Upload Modal */}
      {showPhotoUpload && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            ref={modalRef}
            className="bg-white dark:bg-gray-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-800"
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {t("inventory.scanPhoto")}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {t("inventory.photoUpload.modalSubtitle")}
              </p>

              <button
                onClick={() => setShowPhotoUpload(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <PhotoUpload
                onUpload={handlePhotoUpload}
                onCancel={() => setShowPhotoUpload(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* AI Detection Review Modal */}
      {detectionResult && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            ref={modalRef}
            className="bg-white dark:bg-gray-900 rounded-xl max-w-7xl w-full max-h-[95vh] overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col"
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Review Detected Items
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Found {detectionResult.detectedItems.length} items • Edit and
                confirm to add
              </p>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <AIDetectionReview
                detectionResult={detectionResult}
                onConfirm={(items) =>
                  handleConfirmItems(detectionResult.uploadId, items)
                }
                onCancel={() => setDetectionResult(null)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {showEditModal && editingItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-800">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {t("inventory.editItem") || "Edit Item"}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {editingItem.ingredient?.name}
              </p>
            </div>
            <div className="p-6">
              <EnhancedManualItemForm
                initialData={{
                  name: editingItem.ingredient?.name || "",
                  quantity: editingItem.quantity,
                  unit: editingItem.unit,
                  location: editingItem.location || "fridge",
                  expiryDate: editingItem.expiryDate
                    ? new Date(editingItem.expiryDate)
                        .toISOString()
                        .split("T")[0]
                    : undefined,
                  category: editingItem.ingredient?.category || "",
                  tags: [],
                }}
                onSubmit={(items) => {
                  const data = items[0]; // Edit mode always sends single item
                  return handleUpdateItem({
                    quantity: data.quantity,
                    unit: data.unit,
                    location: data.location,
                    expiryDate: data.expiryDate,
                  });
                }}
                onCancel={() => {
                  setShowEditModal(false);
                  setEditingItem(null);
                }}
                isEditMode={true}
                enableBatchMode={false}
              />
            </div>
          </div>
        </div>
      )}

      {/* Scroll to Top Button */}
      <ScrollToTop />
    </div>
  );
}
