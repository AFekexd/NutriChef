import { useState, useRef, useEffect } from "react";
import { gsap } from "gsap";
import { useTranslation } from "react-i18next";
import {
  X,
  Search,
  Plus,
  Trash2,
  Tag,
  AlertCircle,
  Calendar,
  Package,
  Refrigerator,
  Archive,
  Snowflake,
  Sparkles,
  Copy,
  Camera,
  Mic,
  ScanLine,
} from "lucide-react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { apiService } from "../../services/api";

interface EnhancedItemData {
  name: string;
  quantity: number;
  unit: string;
  location: string;
  expiryDate?: string;
  category?: string;
  tags?: string[];
  image?: string;
}

interface EnhancedManualItemFormProps {
  onSubmit: (items: EnhancedItemData[]) => Promise<void>;
  onCancel: () => void;
  initialData?: EnhancedItemData;
  isEditMode?: boolean;
  enableBatchMode?: boolean;
}

// Predefined expiry suggestions (days from now)
const EXPIRY_PRESETS = {
  Vegetables: 7,
  Fruits: 7,
  Dairy: 7,
  Meat: 3,
  Fish: 2,
  Bread: 5,
  Eggs: 21,
  Grains: 365,
  Oils: 180,
  Frozen: 90,
};

// Smart unit suggestions based on item category
const UNIT_SUGGESTIONS: Record<string, string[]> = {
  Vegetables: ["kg", "g", "piece"],
  Fruits: ["kg", "g", "piece"],
  Dairy: ["l", "ml", "g", "piece"],
  Meat: ["kg", "g", "piece"],
  Fish: ["kg", "g", "piece"],
  Bread: ["piece", "g"],
  Eggs: ["piece", "dozen"],
  Grains: ["kg", "g", "cup"],
  Oils: ["l", "ml", "bottle"],
  Beverages: ["l", "ml", "bottle", "can"],
};

// Default locations by category
const DEFAULT_LOCATIONS: Record<string, string> = {
  Vegetables: "fridge",
  Fruits: "fridge",
  Dairy: "fridge",
  Meat: "fridge",
  Fish: "fridge",
  Bread: "pantry",
  Eggs: "fridge",
  Grains: "pantry",
  Oils: "pantry",
  Frozen: "freezer",
  Beverages: "fridge",
};

// Common tags
const COMMON_TAGS = [
  "organic",
  "gluten-free",
  "vegan",
  "vegetarian",
  "low-carb",
  "high-protein",
  "dairy-free",
  "nut-free",
  "local",
  "imported",
];

export function EnhancedManualItemForm({
  onSubmit,
  onCancel,
  initialData,
  isEditMode = false,
  enableBatchMode = true,
}: EnhancedManualItemFormProps) {
  const [batchMode, setBatchMode] = useState(false);
  const [items, setItems] = useState<EnhancedItemData[]>(
    initialData ? [initialData] : []
  );
  const [currentItem, setCurrentItem] = useState<EnhancedItemData>({
    name: "",
    quantity: 1,
    unit: "kg",
    location: "fridge",
    expiryDate: "",
    category: "",
    tags: [],
  });

  const [ingredientSuggestions, setIngredientSuggestions] = useState<string[]>(
    []
  );
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newTag, setNewTag] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);
  const [recentItems, setRecentItems] = useState<string[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");

  const formRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const recognitionRef = useRef<any>(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (formRef.current) {
      gsap.fromTo(
        formRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
      );
    }
    loadRecentItems();

    // Cleanup function
    return () => {
      // Stop camera when component unmounts
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
      // Stop voice recognition
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Load recent items from localStorage
  const loadRecentItems = () => {
    try {
      const recent = localStorage.getItem("nutrichef_recent_ingredients");
      if (recent) {
        setRecentItems(JSON.parse(recent).slice(0, 10));
      }
    } catch (err) {
      console.error("Failed to load recent items:", err);
    }
  };

  // Save to recent items
  const saveToRecent = (itemName: string) => {
    try {
      const recent = recentItems.filter((r) => r !== itemName);
      recent.unshift(itemName);
      const updated = recent.slice(0, 10);
      localStorage.setItem(
        "nutrichef_recent_ingredients",
        JSON.stringify(updated)
      );
      setRecentItems(updated);
    } catch (err) {
      console.error("Failed to save recent item:", err);
    }
  };

  // Fetch ingredient suggestions from backend
  const fetchSuggestions = async (query: string) => {
    if (query.length < 2) {
      setIngredientSuggestions([]);
      return;
    }

    try {
      const response = await apiService.searchIngredients(query);
      setIngredientSuggestions(response.map((ing: any) => ing.name));
    } catch (err) {
      console.error("Failed to fetch suggestions:", err);
    }
  };

  // Smart defaults when ingredient name or category changes
  useEffect(() => {
    if (currentItem.category) {
      // Auto-suggest expiry date
      if (!currentItem.expiryDate) {
        const days =
          EXPIRY_PRESETS[currentItem.category as keyof typeof EXPIRY_PRESETS];
        if (days) {
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + days);
          setCurrentItem((prev) => ({
            ...prev,
            expiryDate: expiryDate.toISOString().split("T")[0],
          }));
        }
      }

      // Auto-suggest location
      const defaultLocation =
        DEFAULT_LOCATIONS[currentItem.category] || "fridge";
      if (currentItem.location === "fridge" && defaultLocation !== "fridge") {
        setCurrentItem((prev) => ({ ...prev, location: defaultLocation }));
      }
    }
  }, [currentItem.category]);

  const handleNameChange = (value: string) => {
    setCurrentItem((prev) => ({ ...prev, name: value }));
    fetchSuggestions(value);
    setShowSuggestions(true);
  };

  const selectSuggestion = (name: string) => {
    setCurrentItem((prev) => ({ ...prev, name }));
    setShowSuggestions(false);
    // Try to guess category from name
    guessCategory(name);
  };

  const guessCategory = (name: string) => {
    const lowerName = name.toLowerCase();
    if (
      lowerName.includes("milk") ||
      lowerName.includes("cheese") ||
      lowerName.includes("yogurt")
    ) {
      setCurrentItem((prev) => ({ ...prev, category: "Dairy" }));
    } else if (
      lowerName.includes("chicken") ||
      lowerName.includes("beef") ||
      lowerName.includes("pork")
    ) {
      setCurrentItem((prev) => ({ ...prev, category: "Meat" }));
    } else if (
      lowerName.includes("tomato") ||
      lowerName.includes("lettuce") ||
      lowerName.includes("carrot")
    ) {
      setCurrentItem((prev) => ({ ...prev, category: "Vegetables" }));
    } else if (
      lowerName.includes("apple") ||
      lowerName.includes("banana") ||
      lowerName.includes("orange")
    ) {
      setCurrentItem((prev) => ({ ...prev, category: "Fruits" }));
    }
  };

  const addTag = (tag: string) => {
    if (tag && !currentItem.tags?.includes(tag)) {
      setCurrentItem((prev) => ({
        ...prev,
        tags: [...(prev.tags || []), tag],
      }));
    }
    setNewTag("");
    setShowTagInput(false);
  };

  const removeTag = (tagToRemove: string) => {
    setCurrentItem((prev) => ({
      ...prev,
      tags: prev.tags?.filter((t) => t !== tagToRemove),
    }));
  };

  const addItemToBatch = () => {
    if (!currentItem.name.trim()) {
      setError(t("inventory.itemNameRequired"));
      return;
    }

    if (currentItem.quantity <= 0) {
      setError(t("inventory.quantityMustBePositive"));
      return;
    }

    setItems([...items, { ...currentItem }]);
    saveToRecent(currentItem.name);

    // Reset form for next item
    setCurrentItem({
      name: "",
      quantity: 1,
      unit: currentItem.unit, // Keep same unit
      location: currentItem.location, // Keep same location
      expiryDate: "",
      category: "",
      tags: [],
    });
    setError(null);
    nameInputRef.current?.focus();
  };

  const removeItemFromBatch = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let itemsToSubmit: EnhancedItemData[];

    if (batchMode) {
      // Add current item if it has a name
      if (currentItem.name.trim()) {
        itemsToSubmit = [...items, currentItem];
      } else {
        itemsToSubmit = items;
      }
    } else {
      if (!currentItem.name.trim()) {
        setError(t("inventory.itemNameRequired"));
        return;
      }
      if (currentItem.quantity <= 0) {
        setError(t("inventory.quantityMustBePositive"));
        return;
      }
      itemsToSubmit = [currentItem];
    }

    if (itemsToSubmit.length === 0) {
      setError(t("inventory.addAtLeastOneItem"));
      return;
    }

    try {
      setIsLoading(true);
      await onSubmit(itemsToSubmit);
      itemsToSubmit.forEach((item) => saveToRecent(item.name));
    } catch (err: any) {
      setError(err.message || "Failed to add items");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasteList = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const lines = text.split("\n").filter((line) => line.trim());

      const parsedItems: EnhancedItemData[] = [];
      lines.forEach((line) => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return;

        // Try multiple patterns:
        // Pattern 1: "2 kg tomatoes" or "tomatoes 2 kg"
        // Pattern 2: "3 apples" or "apples 3"
        // Pattern 3: "milk 1l" or "1l milk"

        // Match: quantity unit name OR name quantity unit
        let match = trimmedLine.match(
          /^(\d+\.?\d*)\s*(kg|g|l|ml|piece|pieces|pcs|box|pack|cup|tbsp|dozen)?\s+(.+)$/i
        );

        if (match) {
          // Format: "2 kg tomatoes"
          const quantity = parseFloat(match[1]);
          const unit = match[2]?.toLowerCase() || "piece";
          const name = match[3].trim();

          parsedItems.push({
            name: name,
            quantity: quantity,
            unit: unit === "pieces" || unit === "pcs" ? "piece" : unit,
            location: "fridge",
            category: "",
            tags: [],
          });
        } else {
          // Try reverse: "tomatoes 2 kg"
          match = trimmedLine.match(
            /^(.+?)\s+(\d+\.?\d*)\s*(kg|g|l|ml|piece|pieces|pcs|box|pack|cup|tbsp|dozen)?$/i
          );

          if (match) {
            const name = match[1].trim();
            const quantity = parseFloat(match[2]);
            const unit = match[3]?.toLowerCase() || "piece";

            parsedItems.push({
              name: name,
              quantity: quantity,
              unit: unit === "pieces" || unit === "pcs" ? "piece" : unit,
              location: "fridge",
              category: "",
              tags: [],
            });
          } else {
            // Just a name, default to 1 piece
            parsedItems.push({
              name: trimmedLine,
              quantity: 1,
              unit: "piece",
              location: "fridge",
              category: "",
              tags: [],
            });
          }
        }
      });

      if (parsedItems.length > 0) {
        setItems([...items, ...parsedItems]);
        setBatchMode(true);
      } else {
        setError(t("inventory.noItemsFoundInPaste"));
      }
    } catch (err) {
      setError(t("inventory.clipboardPermissionError"));
    }
  };

  // Voice Recognition
  const startVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError(t("inventory.voiceNotSupported"));
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      setVoiceTranscript(t("inventory.listening"));
      setError(null);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setVoiceTranscript(transcript);
      parseVoiceInput(transcript);
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error("Voice recognition error:", event.error);
      setError(`Voice recognition error: ${event.error}`);
      setIsListening(false);
      setVoiceTranscript("");
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const parseVoiceInput = (transcript: string) => {
    // Parse voice input like "two kilograms of tomatoes" or "add milk one liter"
    const lowerTranscript = transcript.toLowerCase();

    // Remove "add" prefix if present
    const cleaned = lowerTranscript.replace(/^(add|get|buy)\s+/i, "");

    // Try to extract quantity, unit, and name
    // Pattern: "number unit name" or "number name"
    const patterns = [
      /(\d+\.?\d*|\w+)\s+(kg|kilograms?|g|grams?|l|liters?|ml|milliliters?|pieces?|pcs)\s+(?:of\s+)?(.+)/i,
      /(\d+\.?\d*|\w+)\s+(.+)/i,
    ];

    for (const pattern of patterns) {
      const match = cleaned.match(pattern);
      if (match) {
        let quantity = 1;
        let unit = "piece";
        let name = "";

        if (match.length === 4) {
          // Has unit
          quantity = parseNumberWord(match[1]);
          unit = normalizeUnit(match[2]);
          name = match[3].trim();
        } else if (match.length === 3) {
          // No unit
          quantity = parseNumberWord(match[1]);
          name = match[2].trim();
        }

        if (name) {
          setCurrentItem((prev) => ({
            ...prev,
            name: name,
            quantity: quantity,
            unit: unit,
          }));
          guessCategory(name);
          nameInputRef.current?.focus();
          return;
        }
      }
    }

    // Fallback: just set the name
    setCurrentItem((prev) => ({ ...prev, name: cleaned }));
    guessCategory(cleaned);
    nameInputRef.current?.focus();
  };

  const parseNumberWord = (word: string): number => {
    const numbers: Record<string, number> = {
      one: 1,
      two: 2,
      three: 3,
      four: 4,
      five: 5,
      six: 6,
      seven: 7,
      eight: 8,
      nine: 9,
      ten: 10,
      half: 0.5,
      quarter: 0.25,
    };
    return numbers[word.toLowerCase()] || parseFloat(word) || 1;
  };

  const normalizeUnit = (unit: string): string => {
    const unitMap: Record<string, string> = {
      kilogram: "kg",
      kilograms: "kg",
      gram: "g",
      grams: "g",
      liter: "l",
      liters: "l",
      litre: "l",
      litres: "l",
      milliliter: "ml",
      milliliters: "ml",
      millilitre: "ml",
      millilitres: "ml",
      piece: "piece",
      pieces: "piece",
      pcs: "piece",
    };
    return unitMap[unit.toLowerCase()] || unit.toLowerCase();
  };

  // Camera/Barcode Scanner
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // Use back camera on mobile
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setShowCamera(true);
        setError(null);
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setError(t("inventory.cameraAccessError"));
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setShowCamera(false);
  };

  const captureImage = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      // In a real implementation, you would:
      // 1. Send image to backend OCR/barcode API
      // 2. Get product details back
      // 3. Auto-fill the form

      // For now, just show a placeholder message
      setError(t("inventory.cameraCaptureSuccess"));
      stopCamera();
    }
  };

  const getLocationIcon = (location: string) => {
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

  const suggestedUnits = currentItem.category
    ? UNIT_SUGGESTIONS[currentItem.category] || ["kg", "g", "l", "ml", "piece"]
    : ["kg", "g", "l", "ml", "piece"];

  return (
    <div ref={formRef}>
      <Card className="p-6 bg-white dark:bg-gray-900 border-green-200 dark:border-green-800 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-green-600 dark:text-green-400" />
              {isEditMode
                ? t("inventory.editItem")
                : t("inventory.smartAddItems")}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {batchMode
                ? t("inventory.itemsInQueue", { count: items.length })
                : t("inventory.addIngredientsWithSmartSuggestions")}
            </p>
          </div>
          <div className="flex items-center gap-2 dark:text-white hover:dark:text-gray-300">
            {enableBatchMode && !isEditMode && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setBatchMode(!batchMode)}
                className="dark:border-gray-700"
              >
                {batchMode
                  ? t("inventory.singleMode")
                  : t("inventory.batchMode")}
              </Button>
            )}
            <button
              onClick={onCancel}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-red-700 dark:text-red-400">
                {error}
              </span>
            </div>
          )}

          {/* Quick Actions Bar */}
          <div className="flex gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg dark:text-white">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePasteList}
              className="flex-1 dark:border-gray-700"
            >
              <Copy className="w-4 h-4 mr-2" />
              {t("inventory.pasteList")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={startCamera}
              className="flex-1 dark:border-gray-700"
            >
              <Camera className="w-4 h-4 mr-2" />
              {showCamera ? t("inventory.cancel") : t("inventory.camera")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={startVoiceInput}
              disabled={isListening}
              className="flex-1 dark:border-gray-700"
            >
              <Mic
                className={`w-4 h-4 mr-2 ${isListening ? "animate-pulse" : ""}`}
              />
              {isListening ? t("inventory.listening") : t("inventory.voice")}
            </Button>
          </div>

          {/* Voice Transcript Display */}
          {voiceTranscript && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <Mic className="w-4 h-4 inline mr-2" />
                {voiceTranscript}
              </p>
            </div>
          )}

          {/* Camera View */}
          {showCamera && (
            <div className="relative border-2 border-green-500 rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-lg"
              />
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
                <Button
                  type="button"
                  onClick={captureImage}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <ScanLine className="w-4 h-4 mr-2" />
                  {t("inventory.scanBarcode")}
                </Button>
                <Button
                  type="button"
                  onClick={stopCamera}
                  variant="outline"
                  className="bg-white dark:bg-gray-800"
                >
                  {t("common.cancel")}
                </Button>
              </div>
            </div>
          )}

          {/* Recent Items Quick Add */}
          {recentItems.length > 0 && !isEditMode && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("inventory.recentlyAdded")}
              </label>
              <div className="flex flex-wrap gap-2">
                {recentItems.slice(0, 5).map((item, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => selectSuggestion(item)}
                    className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full text-sm hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                  >
                    + {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Item Name with Autocomplete */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Search className="w-4 h-4 inline mr-1" />
              {t("inventory.itemName")} *
            </label>
            <input
              ref={nameInputRef}
              type="text"
              value={currentItem.name}
              onChange={(e) => handleNameChange(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder={t("inventory.startTypingIngredientName")}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              disabled={isLoading || isEditMode}
              readOnly={isEditMode}
              autoComplete="off"
            />

            {/* Autocomplete Dropdown */}
            {showSuggestions && ingredientSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {ingredientSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => selectSuggestion(suggestion)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-900 dark:text-gray-100"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Category with Visual Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("inventory.category")}
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
              {Object.keys(EXPIRY_PRESETS).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() =>
                    setCurrentItem((prev) => ({ ...prev, category: cat }))
                  }
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    currentItem.category === cat
                      ? "bg-green-600 text-white ring-2 ring-green-400"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                  disabled={isLoading || isEditMode}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity, Unit, Location Row */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("inventory.quantity")} *
              </label>
              <input
                type="number"
                value={currentItem.quantity}
                onChange={(e) =>
                  setCurrentItem((prev) => ({
                    ...prev,
                    quantity: parseFloat(e.target.value) || 0,
                  }))
                }
                min="0.1"
                step="0.1"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("inventory.unit")} *
              </label>
              <select
                value={currentItem.unit}
                onChange={(e) =>
                  setCurrentItem((prev) => ({ ...prev, unit: e.target.value }))
                }
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                disabled={isLoading}
              >
                {suggestedUnits.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("inventory.location")} *
              </label>
              <select
                value={currentItem.location}
                onChange={(e) =>
                  setCurrentItem((prev) => ({
                    ...prev,
                    location: e.target.value,
                  }))
                }
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                disabled={isLoading}
              >
                <option value="fridge">🧊 {t("inventory.fridge")}</option>
                <option value="pantry">📦 {t("inventory.pantry")}</option>
                <option value="freezer">❄️ {t("inventory.freezer")}</option>
              </select>
            </div>
          </div>

          {/* Expiry Date with Smart Suggestions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              {t("inventory.expiryDate")}
              {currentItem.category &&
                EXPIRY_PRESETS[
                  currentItem.category as keyof typeof EXPIRY_PRESETS
                ] && (
                  <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
                    (
                    {t("inventory.suggestedDays", {
                      days: EXPIRY_PRESETS[
                        currentItem.category as keyof typeof EXPIRY_PRESETS
                      ],
                    })}
                    )
                  </span>
                )}
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={currentItem.expiryDate}
                onChange={(e) =>
                  setCurrentItem((prev) => ({
                    ...prev,
                    expiryDate: e.target.value,
                  }))
                }
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                disabled={isLoading}
              />
              {currentItem.category &&
                EXPIRY_PRESETS[
                  currentItem.category as keyof typeof EXPIRY_PRESETS
                ] && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const days =
                        EXPIRY_PRESETS[
                          currentItem.category as keyof typeof EXPIRY_PRESETS
                        ];
                      const expiryDate = new Date();
                      expiryDate.setDate(expiryDate.getDate() + days);
                      setCurrentItem((prev) => ({
                        ...prev,
                        expiryDate: expiryDate.toISOString().split("T")[0],
                      }));
                    }}
                    className="whitespace-nowrap border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950"
                    disabled={isLoading}
                  >
                    <Sparkles className="w-4 h-4 mr-1" />
                    {t("inventory.useSuggested")}
                  </Button>
                )}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Tag className="w-4 h-4 inline mr-1" />
              {t("inventory.tagsOptional")}
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {currentItem.tags?.map((tag, index) => (
                <Badge
                  key={index}
                  className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 flex items-center gap-1"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:text-purple-900 dark:hover:text-purple-100"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
              <button
                type="button"
                onClick={() => setShowTagInput(!showTagInput)}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <Plus className="w-3 h-3 inline" /> {t("inventory.addTag")}
              </button>
            </div>

            {showTagInput && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addTag(newTag)}
                    placeholder={t("inventory.enterCustomTag")}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  />
                  <Button
                    type="button"
                    onClick={() => addTag(newTag)}
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {t("common.add")}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {COMMON_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => addTag(tag)}
                      disabled={currentItem.tags?.includes(tag)}
                      className="px-2 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded text-xs hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors disabled:opacity-50"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Batch Mode: Added Items List */}
          {batchMode && items.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                {t("inventory.itemsToAdd", { count: items.length })}
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-3 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {getLocationIcon(item.location)}
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {item.name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {item.quantity} {item.unit} • {item.location}
                          {item.category && ` • ${item.category}`}
                        </p>
                        {item.tags && item.tags.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {item.tags.map((tag, idx) => (
                              <Badge
                                key={idx}
                                className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItemFromBatch(index)}
                      className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            {batchMode && !isEditMode ? (
              <>
                <Button
                  type="button"
                  onClick={addItemToBatch}
                  disabled={isLoading}
                  variant="outline"
                  className="flex-1 border-green-600 dark:border-green-500 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t("inventory.addToQueue", { count: items.length })}
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || items.length === 0}
                  className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 text-white hover:from-green-700 hover:to-blue-700 disabled:opacity-50"
                >
                  {isLoading
                    ? t("common.loading")
                    : t("inventory.submitAll", { count: items.length })}
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 text-white hover:from-green-700 hover:to-blue-700 disabled:opacity-50"
                >
                  {isLoading
                    ? t("common.loading")
                    : isEditMode
                    ? t("inventory.update")
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
              </>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}
