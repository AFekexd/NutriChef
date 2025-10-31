import { useState } from "react";
import { X, Calculator, Info } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { apiService } from "@/services/api";
import {
  calculateNutritionRecommendations,
  getActivityLevelDescription,
  getGoalDescription,
  lbsToKg,
  kgToLbs,
  inchesToCm,
  cmToInches,
  type UserMetrics,
  type NutritionRecommendations,
} from "@/utils/bmr";

interface MetricsCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goals: {
    dailyCalories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  }) => void;
}

export function MetricsCalculatorModal({
  isOpen,
  onClose,
  onSave,
}: MetricsCalculatorModalProps) {
  // User metrics state
  const [age, setAge] = useState<number>(30);
  const [gender, setGender] = useState<"male" | "female">("male");
  const [weight, setWeight] = useState<number>(70);
  const [height, setHeight] = useState<number>(170);
  const [activityLevel, setActivityLevel] =
    useState<UserMetrics["activityLevel"]>("moderate");
  const [goal, setGoal] = useState<UserMetrics["goal"]>("maintain");

  // Unit preferences
  const [weightUnit, setWeightUnit] = useState<"kg" | "lbs">("kg");
  const [heightUnit, setHeightUnit] = useState<"cm" | "ft">("cm");
  const [heightFeet, setHeightFeet] = useState<number>(5);
  const [heightInches, setHeightInches] = useState<number>(7);

  // Calculation state
  const [recommendations, setRecommendations] =
    useState<NutritionRecommendations | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);

  // Editable recommendations
  const [editableCalories, setEditableCalories] = useState<number>(0);
  const [editableProtein, setEditableProtein] = useState<number>(0);
  const [editableCarbs, setEditableCarbs] = useState<number>(0);
  const [editableFat, setEditableFat] = useState<number>(0);
  const [editableFiber, setEditableFiber] = useState<number>(0);

  if (!isOpen) return null;

  const getWeightInKg = () => {
    return weightUnit === "kg" ? weight : lbsToKg(weight);
  };

  const getHeightInCm = () => {
    if (heightUnit === "cm") return height;
    return inchesToCm(heightFeet * 12 + heightInches);
  };

  const handleCalculate = async () => {
    setIsCalculating(true);
    try {
      const metrics: UserMetrics = {
        age,
        gender,
        weight: getWeightInKg(),
        height: getHeightInCm(),
        activityLevel,
        goal,
      };

      // Use backend API for calculation
      const { recommendations: backendRecs } = await apiService.calculateBMR(
        metrics
      );

      setRecommendations(backendRecs);
      setEditableCalories(backendRecs.dailyCalories);
      setEditableProtein(backendRecs.protein);
      setEditableCarbs(backendRecs.carbs);
      setEditableFat(backendRecs.fat);
      setEditableFiber(backendRecs.fiber);
      setShowRecommendations(true);
    } catch (error) {
      console.error("Failed to calculate BMR:", error);
      // Fallback to local calculation
      const metrics: UserMetrics = {
        age,
        gender,
        weight: getWeightInKg(),
        height: getHeightInCm(),
        activityLevel,
        goal,
      };
      const localRecs = calculateNutritionRecommendations(metrics);
      setRecommendations(localRecs);
      setEditableCalories(localRecs.dailyCalories);
      setEditableProtein(localRecs.protein);
      setEditableCarbs(localRecs.carbs);
      setEditableFat(localRecs.fat);
      setEditableFiber(localRecs.fiber);
      setShowRecommendations(true);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        dailyCalories: editableCalories,
        protein: editableProtein,
        carbs: editableCarbs,
        fat: editableFat,
        fiber: editableFiber,
      });
      onClose();
    } catch (error) {
      console.error("Failed to save goals:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleWeightUnitToggle = () => {
    if (weightUnit === "kg") {
      setWeight(kgToLbs(weight));
      setWeightUnit("lbs");
    } else {
      setWeight(lbsToKg(weight));
      setWeightUnit("kg");
    }
  };

  const handleHeightUnitToggle = () => {
    if (heightUnit === "cm") {
      const totalInches = cmToInches(height);
      setHeightFeet(Math.floor(totalInches / 12));
      setHeightInches(totalInches % 12);
      setHeightUnit("ft");
    } else {
      setHeight(inchesToCm(heightFeet * 12 + heightInches));
      setHeightUnit("cm");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Calculator className="h-6 w-6 text-blue-600" />
              Calculate Your Nutrition Goals
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Get personalized macro recommendations based on your body metrics
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {!showRecommendations ? (
            /* Metrics Input Form */
            <div className="space-y-6">
              {/* Age */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Age (years)
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  min="15"
                  max="100"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Gender
                </label>
                <div className="flex gap-4">
                  <button
                    onClick={() => setGender("male")}
                    className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                      gender === "male"
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                        : "border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 text-gray-900 dark:text-gray-300"
                    }`}
                  >
                    Male
                  </button>
                  <button
                    onClick={() => setGender("female")}
                    className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                      gender === "female"
                        ? "border-pink-500 bg-pink-50 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300"
                        : "border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 text-gray-900 dark:text-gray-300"
                    }`}
                  >
                    Female
                  </button>
                </div>
              </div>

              {/* Weight */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Weight
                  </label>
                  <button
                    onClick={handleWeightUnitToggle}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Switch to {weightUnit === "kg" ? "lbs" : "kg"}
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(Number(e.target.value))}
                    min="30"
                    max={weightUnit === "kg" ? "300" : "660"}
                    step="0.1"
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <Badge variant="secondary" className="px-4 flex items-center">
                    {weightUnit}
                  </Badge>
                </div>
              </div>

              {/* Height */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Height
                  </label>
                  <button
                    onClick={handleHeightUnitToggle}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Switch to {heightUnit === "cm" ? "ft/in" : "cm"}
                  </button>
                </div>
                {heightUnit === "cm" ? (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(Number(e.target.value))}
                      min="100"
                      max="250"
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <Badge
                      variant="secondary"
                      className="px-4 flex items-center"
                    >
                      cm
                    </Badge>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={heightFeet}
                      onChange={(e) => setHeightFeet(Number(e.target.value))}
                      min="3"
                      max="8"
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <Badge
                      variant="secondary"
                      className="px-4 flex items-center"
                    >
                      ft
                    </Badge>
                    <input
                      type="number"
                      value={heightInches}
                      onChange={(e) => setHeightInches(Number(e.target.value))}
                      min="0"
                      max="11"
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <Badge
                      variant="secondary"
                      className="px-4 flex items-center"
                    >
                      in
                    </Badge>
                  </div>
                )}
              </div>

              {/* Activity Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Activity Level
                </label>
                <select
                  value={activityLevel}
                  onChange={(e) =>
                    setActivityLevel(
                      e.target.value as UserMetrics["activityLevel"]
                    )
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="sedentary">Sedentary</option>
                  <option value="light">Light Activity</option>
                  <option value="moderate">Moderate Activity</option>
                  <option value="active">Active</option>
                  <option value="veryActive">Very Active</option>
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-start gap-1">
                  <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  {getActivityLevelDescription(activityLevel)}
                </p>
              </div>

              {/* Goal */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Your Goal
                </label>
                <select
                  value={goal}
                  onChange={(e) =>
                    setGoal(e.target.value as UserMetrics["goal"])
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="lose">Lose Weight (Moderate)</option>
                  <option value="loseFast">Lose Weight (Fast)</option>
                  <option value="loseAggressive">
                    Lose Weight (Aggressive)
                  </option>
                  <option value="maintain">Maintain Weight</option>
                  <option value="gain">Gain Muscle</option>
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-start gap-1">
                  <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  {getGoalDescription(goal)}
                </p>
              </div>

              {/* Calculate Button */}
              <Button
                onClick={handleCalculate}
                disabled={isCalculating}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              >
                {isCalculating ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Calculating...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Calculate My Goals
                  </span>
                )}
              </Button>
            </div>
          ) : (
            /* Recommendations Display */
            <div className="space-y-6">
              {recommendations && (
                <>
                  {/* BMR & TDEE Info */}
                  <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-3">
                      Your Metabolic Rate
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-blue-700 dark:text-blue-400">
                          BMR (Basal Metabolic Rate)
                        </p>
                        <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">
                          {recommendations.bmr}
                          <span className="text-sm font-normal ml-1">cal</span>
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-blue-700 dark:text-blue-400">
                          TDEE (Total Daily Energy)
                        </p>
                        <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">
                          {recommendations.tdee}
                          <span className="text-sm font-normal ml-1">cal</span>
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-blue-600 dark:text-blue-300 mt-2">
                      Based on your {activityLevel} activity level and {goal}{" "}
                      goal
                    </p>
                  </div>

                  {/* Editable Goals */}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                      Recommended Daily Targets
                      <span className="text-sm font-normal text-gray-600 dark:text-gray-400 ml-2">
                        (You can adjust these)
                      </span>
                    </h3>

                    <div className="space-y-4">
                      {/* Calories */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Daily Calories
                        </label>
                        <input
                          type="number"
                          value={editableCalories}
                          onChange={(e) =>
                            setEditableCalories(Number(e.target.value))
                          }
                          min="1000"
                          max="5000"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      {/* Macros Grid */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Protein (g)
                          </label>
                          <input
                            type="number"
                            value={editableProtein}
                            onChange={(e) =>
                              setEditableProtein(Number(e.target.value))
                            }
                            min="0"
                            max="500"
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Carbs (g)
                          </label>
                          <input
                            type="number"
                            value={editableCarbs}
                            onChange={(e) =>
                              setEditableCarbs(Number(e.target.value))
                            }
                            min="0"
                            max="800"
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Fat (g)
                          </label>
                          <input
                            type="number"
                            value={editableFat}
                            onChange={(e) =>
                              setEditableFat(Number(e.target.value))
                            }
                            min="0"
                            max="300"
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Fiber (g)
                          </label>
                          <input
                            type="number"
                            value={editableFiber}
                            onChange={(e) =>
                              setEditableFiber(Number(e.target.value))
                            }
                            min="0"
                            max="100"
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      {/* Macro Ratios */}
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                        <p className="text-md text-gray-600 dark:text-gray-400 mb-2">
                          Macro Distribution
                        </p>
                        <div className="flex  justify-evenly">
                          <Badge
                            variant="outline"
                            className="text-md text-white"
                          >
                            Protein: {recommendations.macroRatios.protein}%
                          </Badge>
                          <Badge
                            variant="outline"
                            className="text-md text-red-400"
                          >
                            Carbs: {recommendations.macroRatios.carbs}%
                          </Badge>
                          <Badge
                            variant="outline"
                            className="text-md text-orange-400"
                          >
                            Fat: {recommendations.macroRatios.fat}%
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setShowRecommendations(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      Back to Form
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                    >
                      {isSaving ? (
                        <span className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Saving...
                        </span>
                      ) : (
                        "Save These Goals"
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
