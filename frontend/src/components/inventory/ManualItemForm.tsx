import { useState, useRef, useEffect } from "react";
import { gsap } from "gsap";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";

interface ManualItemFormProps {
  onSubmit: (item: {
    name: string;
    quantity: number;
    unit: string;
    location: string;
    expiryDate?: string;
    category?: string;
  }) => Promise<void>;
  onCancel: () => void;
  initialData?: {
    name: string;
    quantity: number;
    unit: string;
    location: string;
    expiryDate?: string;
    category?: string;
  };
  isEditMode?: boolean;
}

export function ManualItemForm({
  onSubmit,
  onCancel,
  initialData,
  isEditMode = false,
}: ManualItemFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    quantity: initialData?.quantity || 1,
    unit: initialData?.unit || "kg",
    location: initialData?.location || "fridge",
    expiryDate: initialData?.expiryDate || "",
    category: initialData?.category || "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (formRef.current) {
      gsap.fromTo(
        formRef.current,
        { opacity: 0, scale: 0.95 },
        { opacity: 1, scale: 1, duration: 0.3, ease: "power2.out" }
      );
    }
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "quantity" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError("Item name is required");
      return;
    }

    if (formData.quantity <= 0) {
      setError("Quantity must be greater than 0");
      return;
    }

    try {
      setIsLoading(true);
      await onSubmit(formData);
    } catch (err: any) {
      setError(err.message || "Failed to add item");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div ref={formRef}>
      <Card className="p-6 bg-white dark:bg-gray-900 border-green-100 dark:border-green-800">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {isEditMode
              ? t("inventory.editItem") || "Edit Item"
              : t("inventory.manualAdd")}
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Item Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("inventory.itemName")} *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Tomato, Milk, Cheese"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={isLoading || isEditMode}
              readOnly={isEditMode}
            />
          </div>

          {/* Quantity and Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("inventory.quantity")} *
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                min="0.1"
                step="0.1"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("inventory.unit")} *
              </label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                disabled={isLoading}
              >
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="l">l</option>
                <option value="ml">ml</option>
                <option value="piece">piece</option>
                <option value="box">box</option>
                <option value="pack">pack</option>
                <option value="cup">cup</option>
                <option value="tbsp">tbsp</option>
              </select>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("inventory.location")} *
            </label>
            <select
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              disabled={isLoading}
            >
              <option value="fridge">🧊 {t("inventory.fridge")}</option>
              <option value="pantry">📦 {t("inventory.pantry")}</option>
              <option value="freezer">❄️ {t("inventory.freezer")}</option>
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("inventory.category")}
            </label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              placeholder="e.g., Vegetables, Dairy, Frozen"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={isLoading || isEditMode}
              readOnly={isEditMode}
            />
          </div>

          {/* Expiry Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("inventory.expiryDate")}
            </label>
            <input
              type="date"
              name="expiryDate"
              value={formData.expiryDate}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              disabled={isLoading}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-green-600 to-green-300 text-white hover:from-green-700 hover:to-blue-700 disabled:opacity-50"
            >
              {isLoading
                ? t("common.loading")
                : isEditMode
                ? t("common.update") || "Update"
                : t("common.add")}
            </Button>
            <Button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              variant="outline"
              className="flex-1 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              {t("common.cancel")}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
