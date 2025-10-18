import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { PhotoUpload } from "../components/inventory/PhotoUpload";
import { AIDetectionReview } from "../components/inventory/AIDetectionReview";
import { ManualItemForm } from "../components/inventory/ManualItemForm";
import { apiService } from "../services/api";
import type {
  DetectionResult,
  InventoryAnalytics,
  InventoryItem,
} from "../types";

type ViewMode = "grid" | "list";
type LocationFilter = "all" | "fridge" | "pantry" | "freezer";

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
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadInventoryData();
  }, []);

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
      setError(err.response?.data?.error || "Failed to load inventory data");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoUpload = async (file: File) => {
    setError(null);
    try {
      const result = await apiService.uploadInventoryImage(file);
      setDetectionResult(result);
      setShowPhotoUpload(false);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to analyze image");
    }
  };

  const handleConfirmItems = async (
    uploadId: string,
    selectedItems: DetectionResult["detectedItems"]
  ) => {
    setError(null);
    try {
      await apiService.confirmDetectedItems(uploadId, selectedItems);
      setSuccessMessage(`Successfully added ${selectedItems.length} items!`);
      setDetectionResult(null);
      await loadInventoryData();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to add items");
    }
  };

  const handleAddManualItem = async (itemData: {
    name: string;
    quantity: number;
    unit: string;
    location: string;
    expiryDate?: string;
    category?: string;
  }) => {
    setError(null);
    try {
      await apiService.addManualInventoryItem({
        ingredientName: itemData.name,
        quantity: itemData.quantity,
        unit: itemData.unit,
        location: itemData.location,
        expiryDate: itemData.expiryDate,
        category: itemData.category,
      });
      setSuccessMessage("Item added successfully!");
      setShowManualForm(false);
      await loadInventoryData();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      throw err;
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

  const getExpiryStatus = (expiryDate: string | null) => {
    if (!expiryDate)
      return { text: "No expiry", color: "bg-gray-100 text-gray-600" };

    const days = Math.floor(
      (new Date(expiryDate).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24)
    );

    if (days < 0) return { text: "Expired", color: "bg-red-100 text-red-700" };
    if (days === 0) return { text: "Today", color: "bg-red-100 text-red-700" };
    if (days <= 3)
      return { text: `${days}d left`, color: "bg-orange-100 text-orange-700" };
    if (days <= 7)
      return { text: `${days}d left`, color: "bg-yellow-100 text-yellow-700" };
    return { text: `${days}d left`, color: "bg-green-100 text-green-700" };
  };

  const filteredItems = allItems.filter((item) => {
    const matchesLocation =
      locationFilter === "all" || item.location === locationFilter;
    const matchesSearch = (item.ingredient?.name || "")
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesLocation && matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pb-20 md:pb-0 md:pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Smart Inventory
            </h1>
            <p className="text-gray-600 mt-2">
              Track your ingredients with AI-powered detection
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setShowManualForm(!showManualForm)}
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              + Add Manually
            </Button>
            <Button
              onClick={() => setShowPhotoUpload(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Camera className="w-5 h-5 mr-2" />
              Scan Fridge
            </Button>
          </div>
        </motion.div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 animate-in slide-in-from-top">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 animate-in slide-in-from-top">
            <TrendingUp className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-green-700">{successMessage}</p>
          </div>
        )}

        {/* Manual Item Form */}
        {showManualForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="mb-8"
          >
            <ManualItemForm
              onSubmit={handleAddManualItem}
              onCancel={() => setShowManualForm(false)}
            />
          </motion.div>
        )}

        {/* Analytics Cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {[
            {
              icon: Package,
              title: "Total Items",
              value: analytics?.totalItems || 0,
              subtitle: `${analytics?.aiDetectionPercentage || 0}% AI detected`,
              bgColor: "bg-blue-100",
              borderColor: "border-blue-100",
              iconColor: "text-blue-600",
              delay: 0,
            },
            {
              icon: Calendar,
              title: "Expiring Soon",
              value: analytics?.expiringItems || 0,
              subtitle: "Next 7 days",
              bgColor: "bg-orange-100",
              borderColor: "border-orange-100",
              iconColor: "text-orange-600",
              delay: 0.1,
            },
            {
              icon: Refrigerator,
              title: "In Fridge",
              value: analytics?.byLocation.fridge || 0,
              subtitle: `Pantry: ${
                analytics?.byLocation.pantry || 0
              } | Freezer: ${analytics?.byLocation.freezer || 0}`,
              bgColor: "bg-green-100",
              borderColor: "border-green-100",
              iconColor: "text-green-600",
              delay: 0.2,
            },
          ].map((card, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.15 + card.delay }}
            >
              <Card
                className={`p-6 bg-white ${card.borderColor} hover:shadow-lg transition-shadow duration-200`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 ${card.bgColor} rounded-lg`}>
                    <card.icon className={`w-6 h-6 ${card.iconColor}`} />
                  </div>
                  <BarChart3 className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                <p className="text-sm text-gray-600 mt-1">{card.title}</p>
                <p className="text-xs text-gray-500 mt-2">{card.subtitle}</p>
              </Card>
            </motion.div>
          ))}

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.45 }}
          >
            <Card className="p-6 bg-gradient-to-br from-blue-600 to-purple-600 text-white hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold">AI Powered</p>
              <p className="text-sm text-blue-100 mt-1">Automatic Detection</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 bg-white/10 border-white/20 text-white hover:bg-white/20"
                onClick={() => setShowPhotoUpload(true)}
              >
                <Camera className="w-4 h-4 mr-2" />
                Scan Now
              </Button>
            </Card>
          </motion.div>
        </motion.div>

        {/* Expiring Items Alert */}
        {expiringItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="p-6 mb-8 bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Items Expiring Soon
                  </h3>
                  <div className="space-y-2">
                    {expiringItems.slice(0, 3).map((item, index) => {
                      const expiry = getExpiryStatus(item.expiryDate);
                      return (
                        <motion.div
                          key={item.inventoryItemId}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{
                            duration: 0.3,
                            delay: 0.25 + index * 0.1,
                          }}
                          className="flex items-center justify-between bg-white/60 backdrop-blur-sm p-3 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            {getLocationIcon(item.location)}
                            <div>
                              <p className="font-medium text-gray-900">
                                {item.ingredient?.name}
                              </p>
                              <p className="text-sm text-gray-600">
                                {item.quantity} {item.unit} • {item.location}
                              </p>
                            </div>
                          </div>
                          <Badge className={expiry.color}>{expiry.text}</Badge>
                        </motion.div>
                      );
                    })}
                  </div>
                  {expiringItems.length > 3 && (
                    <p className="text-sm text-gray-600 mt-3">
                      +{expiringItems.length - 3} more items expiring soon
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Filters and View Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={locationFilter}
              onChange={(e) =>
                setLocationFilter(e.target.value as LocationFilter)
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Locations</option>
              <option value="fridge">🧊 Fridge</option>
              <option value="pantry">📦 Pantry</option>
              <option value="freezer">❄️ Freezer</option>
            </select>

            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={`px-3 py-2 ${
                  viewMode === "grid"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Grid3x3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-3 py-2 ${
                  viewMode === "list"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Items Display */}
        {filteredItems.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No items found
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || locationFilter !== "all"
                ? "Try adjusting your filters"
                : "Start by scanning your fridge!"}
            </p>
            {!searchQuery && locationFilter === "all" && (
              <Button
                onClick={() => setShowPhotoUpload(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
              >
                <Camera className="w-5 h-5 mr-2" />
                Scan Fridge
              </Button>
            )}
          </Card>
        ) : viewMode === "grid" ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {filteredItems.map((item, index) => {
              const expiry = getExpiryStatus(item.expiryDate);
              return (
                <motion.div
                  key={item.inventoryItemId}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.05 + index * 0.05 }}
                  whileHover={{ scale: 1.02, y: -4 }}
                >
                  <Card className="p-4 hover:shadow-lg transition-all duration-200 bg-white">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getLocationIcon(item.location)}
                        <span className="text-sm text-gray-600 capitalize">
                          {item.location}
                        </span>
                      </div>
                      {item.aiDetected && (
                        <Badge className="bg-purple-100 text-purple-700 text-xs">
                          AI
                        </Badge>
                      )}
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {item.ingredient?.name}
                    </h3>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Quantity</span>
                        <span className="font-medium text-gray-900">
                          {item.quantity} {item.unit}
                        </span>
                      </div>
                      {item.expiryDate && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Expires</span>
                          <Badge className={expiry.color}>{expiry.text}</Badge>
                        </div>
                      )}
                      {item.ingredient?.category && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Category</span>
                          <span className="font-medium text-gray-900 capitalize">
                            {item.ingredient.category}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-3 border-t border-gray-100">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Edit2 className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Expiry
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredItems.map((item) => {
                      const expiry = getExpiryStatus(item.expiryDate);
                      return (
                        <tr
                          key={item.inventoryItemId}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">
                                {item.ingredient?.name}
                              </span>
                              {item.aiDetected && (
                                <Badge className="bg-purple-100 text-purple-700 text-xs">
                                  AI
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {getLocationIcon(item.location)}
                              <span className="text-sm text-gray-900 capitalize">
                                {item.location}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.quantity} {item.unit}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                            {item.ingredient?.category || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {item.expiryDate ? (
                              <Badge className={expiry.color}>
                                {expiry.text}
                              </Badge>
                            ) : (
                              <span className="text-sm text-gray-500">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm">
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:bg-red-50"
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
          </motion.div>
        )}

        {/* Results Summary */}
        {filteredItems.length > 0 && (
          <div className="mt-6 text-center text-sm text-gray-600">
            Showing {filteredItems.length} of {allItems.length} items
          </div>
        )}
      </div>

      {/* Photo Upload Modal */}
      {showPhotoUpload && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                Scan Your Fridge
              </h2>
              <p className="text-gray-600 mt-1">
                Upload a photo and let AI detect your ingredients
              </p>
            </div>
            <div className="p-6">
              <PhotoUpload
                onUpload={handlePhotoUpload}
                onCancel={() => setShowPhotoUpload(false)}
              />
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* AI Detection Review Modal */}
      {detectionResult && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                Review Detected Items
              </h2>
              <p className="text-gray-600 mt-1">
                Found {detectionResult.detectedItems.length} items • Edit and
                confirm to add
              </p>
            </div>
            <div className="p-6">
              <AIDetectionReview
                detectionResult={detectionResult}
                onConfirm={(items) =>
                  handleConfirmItems(detectionResult.uploadId, items)
                }
                onCancel={() => setDetectionResult(null)}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
