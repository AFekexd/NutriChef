import React, { useState, useEffect } from "react";
import { Search, CheckCircle, Loader2, X } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import type { OpenRouterModel } from "../types";
import { apiService } from "../services/api";
import { toast } from "sonner";

interface OpenRouterModelSelectorProps {
  open: boolean;
  onClose: () => void;
  currentModelId?: string | null;
  onModelSelected: (modelId: string) => void;
}

export const OpenRouterModelSelector: React.FC<
  OpenRouterModelSelectorProps
> = ({ open, onClose, currentModelId, onModelSelected }) => {
  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [filteredModels, setFilteredModels] = useState<OpenRouterModel[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(
    currentModelId || null
  );

  useEffect(() => {
    if (open) {
      fetchModels();
    }
  }, [open]);

  useEffect(() => {
    setSelectedModelId(currentModelId || null);
  }, [currentModelId]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredModels(models);
    } else {
      const lowerQuery = searchQuery.toLowerCase();
      const filtered = models.filter(
        (model) =>
          model.id.toLowerCase().includes(lowerQuery) ||
          model.name.toLowerCase().includes(lowerQuery) ||
          model.description?.toLowerCase().includes(lowerQuery)
      );
      setFilteredModels(filtered);
    }
  }, [searchQuery, models]);

  const fetchModels = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.getOpenRouterModels();
      setModels(response.models);
      setFilteredModels(response.models);
    } catch (error: any) {
      console.error("Failed to fetch models:", error);
      toast.error("Failed to load available models");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectModel = (modelId: string) => {
    setSelectedModelId(modelId);
  };

  const handleConfirm = async () => {
    if (!selectedModelId) {
      toast.error("Please select a model");
      return;
    }

    try {
      await apiService.saveOpenRouterModel(selectedModelId);
      toast.success("Model selected successfully");
      onModelSelected(selectedModelId);
      onClose();
    } catch (error: any) {
      console.error("Failed to save model:", error);
      toast.error("Failed to save selected model");
    }
  };

  const formatPrice = (price: number) => {
    return `$${(price * 1000000).toFixed(2)}/1M tokens`;
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Select OpenRouter Model
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Choose an AI model for your requests. Prices shown are per 1M
                tokens.
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search models by name, ID, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Models List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : filteredModels.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                {searchQuery ? "No models found" : "No models available"}
              </div>
            ) : (
              filteredModels.map((model) => (
                <button
                  key={model.id}
                  onClick={() => handleSelectModel(model.id)}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${
                    selectedModelId === model.id
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {model.name}
                        </h3>
                        {selectedModelId === model.id && (
                          <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mb-2 truncate">
                        {model.id}
                      </p>
                      {model.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                          {model.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-3 mt-3 text-xs">
                        <span className="text-gray-600 dark:text-gray-400">
                          Context: {model.context_length.toLocaleString()}{" "}
                          tokens
                        </span>
                        {model.architecture?.modality && (
                          <span className="text-gray-600 dark:text-gray-400">
                            {model.architecture.modality}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Pricing
                      </div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {formatPrice(model.pricing.prompt)}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Input
                      </div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1">
                        {formatPrice(model.pricing.completion)}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Output
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {filteredModels.length} model
              {filteredModels.length !== 1 ? "s" : ""}
              {searchQuery && " found"}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={!selectedModelId}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              >
                Confirm Selection
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
