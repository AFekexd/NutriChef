import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Check,
  X,
  Edit2,
  Plus,
  Minus,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import type { DetectedItem, DetectionResult } from "../../types";

interface AIDetectionReviewProps {
  detectionResult: DetectionResult;
  onConfirm: (items: DetectedItem[]) => Promise<void>;
  onCancel: () => void;
}

export function AIDetectionReview({
  detectionResult,
  onConfirm,
  onCancel,
}: AIDetectionReviewProps) {
  const { t } = useTranslation();
  const [items, setItems] = useState<DetectedItem[]>(
    detectionResult.detectedItems
  );
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return "bg-green-500";
    if (confidence >= 70) return "bg-yellow-500";
    return "bg-orange-500";
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 90) return t("inventory.aiDetection.confidence.high");
    if (confidence >= 70) return t("inventory.aiDetection.confidence.medium");
    return t("inventory.aiDetection.confidence.low");
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleEditItem = (
    index: number,
    field: keyof DetectedItem,
    value: any
  ) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm(items);
    } catch (error) {
      console.error("Failed to confirm items:", error);
    } finally {
      setIsConfirming(false);
    }
  };

  const categoryIcons: Record<string, string> = {
    fruit: "🍎",
    vegetable: "🥬",
    dairy: "🥛",
    meat: "🥩",
    grains: "🌾",
    beverage: "🥤",
    condiment: "🧂",
    bakery: "🍞",
    other: "📦",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>
            <strong>{items.length}</strong>{" "}
            {t("inventory.aiDetection.itemsDetected")}
          </span>
          <span>•</span>
          <span>
            {t("inventory.aiDetection.processedIn")}{" "}
            <strong>{detectionResult.processingTime.toFixed(1)}s</strong>
          </span>
          <span>•</span>
          <Badge variant="outline" className="capitalize">
            {detectionResult.aiService}
          </Badge>
        </div>
      </div>

      {/* Items Grid */}
      {items.length === 0 ? (
        <div className="text-center py-12">
          <AlertCircle className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {t("inventory.aiDetection.noItems")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((item, index) => (
            <Card
              key={index}
              className="p-4 border-2 hover:border-blue-500 transition-colors relative dark:bg-gray-800"
            >
              {/* Remove button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8"
                onClick={() => handleRemoveItem(index)}
              >
                <X className="h-4 w-4" />
              </Button>

              <div className="space-y-3">
                {/* Header with icon and confidence */}
                <div className="flex items-start gap-3">
                  <span className="text-3xl">
                    {categoryIcons[item.category] || "📦"}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {editingIndex === index ? (
                        <Input
                          value={item.name}
                          onChange={(e) =>
                            handleEditItem(index, "name", e.target.value)
                          }
                          className="h-8 text-lg font-semibold"
                          autoFocus
                        />
                      ) : (
                        <h3 className="text-lg font-semibold dark:text-white">
                          {item.name}
                        </h3>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() =>
                          setEditingIndex(editingIndex === index ? null : index)
                        }
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <Badge
                      className={`${getConfidenceColor(
                        item.confidence
                      )} text-white text-xs`}
                    >
                      {getConfidenceLabel(item.confidence)} ({item.confidence}%)
                    </Badge>
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">
                      {t("inventory.quantityLabel")}
                    </span>
                    <div className="flex items-center gap-1 mt-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() =>
                          handleEditItem(
                            index,
                            "quantity",
                            Math.max(0, item.quantity - 1)
                          )
                        }
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          handleEditItem(
                            index,
                            "quantity",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="h-7 w-16 text-center"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() =>
                          handleEditItem(index, "quantity", item.quantity + 1)
                        }
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <span className="text-gray-500">
                      {t("inventory.unitLabel")}
                    </span>
                    <Input
                      value={item.unit}
                      onChange={(e) =>
                        handleEditItem(index, "unit", e.target.value)
                      }
                      className="h-7 mt-1"
                    />
                  </div>

                  <div>
                    <span className="text-gray-500">
                      {t("inventory.expiresInLabel")}
                    </span>
                    <div className="flex items-center gap-1 mt-1">
                      <Input
                        type="number"
                        value={item.estimatedExpiry}
                        onChange={(e) =>
                          handleEditItem(
                            index,
                            "estimatedExpiry",
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="h-7"
                      />
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {t("inventory.daysLabel")}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-gray-500">
                      {t("inventory.locationLabel")}
                    </span>
                    <select
                      value={item.location}
                      onChange={(e) =>
                        handleEditItem(index, "location", e.target.value)
                      }
                      className="h-7 w-full mt-1 px-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
                    >
                      <option value="fridge">
                        {t("inventory.locations.fridge")}
                      </option>
                      <option value="pantry">
                        {t("inventory.locations.pantry")}
                      </option>
                      <option value="freezer">
                        {t("inventory.locations.freezer")}
                      </option>
                    </select>
                  </div>
                </div>

                {/* Category */}
                <div className="text-xs text-gray-500 capitalize">
                  {t("inventory.categoryLabel")} {item.category}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-800">
        <Button
          onClick={onCancel}
          variant="outline"
          className="flex-1"
          disabled={isConfirming}
        >
          {t("common.cancel")}
        </Button>
        <Button
          onClick={handleConfirm}
          className="flex-1 bg-green-600 hover:bg-green-700"
          disabled={items.length === 0 || isConfirming}
        >
          {isConfirming ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t("inventory.aiDetection.addingToInventory")}
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" />
              {t("inventory.aiDetection.addItemsToInventory", {
                count: items.length,
              })}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
