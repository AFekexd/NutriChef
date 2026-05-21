import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { gsap } from "gsap";
import { toast } from "sonner";
import {
  Activity,
  TrendingUp,
  Award,
  Target,
  Zap,
  Heart,
  Brain,
  AlertCircle,
  Lightbulb,
  Trophy,
  CheckCircle,
  Calendar,
  Flame,
  Loader2,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { ScrollToTop } from "../components/ScrollToTop";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { apiService } from "../services/api";

interface ScoreBreakdown {
  calorieBalance: number;
  macroBalance: number;
  consistency: number;
  hydration: number;
}

interface Insight {
  type: "success" | "warning" | "tip" | "info";
  title: string;
  description: string;
  icon: string;
}

interface Recommendation {
  category: string;
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  actionItems: string[];
}

interface WeeklyGoal {
  goal: string;
  target: string;
  progress: number;
}

interface HealthInsightsData {
  overallScore: number;
  scoreBreakdown: ScoreBreakdown;
  insights: Insight[];
  recommendations: Recommendation[];
  weeklyGoals: WeeklyGoal[];
  nutritionCoachMessage: string;
  userData: {
    bmr: number;
    tdee: number;
    averageCalories: number;
    daysTracked: number;
  };
}

export function HealthInsightsPage() {
  const { t, i18n } = useTranslation();
  const [insightsData, setInsightsData] = useState<HealthInsightsData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadedLanguageRef = useRef<string | null>(null);
  const isFetchingRef = useRef(false);

  // GSAP refs
  const headerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadHealthInsights();
  }, [i18n.language]);

  useEffect(() => {
    if (headerRef.current) {
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
      );
    }
  }, []);

  useEffect(() => {
    if (contentRef.current && insightsData) {
      gsap.fromTo(
        contentRef.current.children,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.3,
          stagger: 0.1,
          ease: "power2.out",
        }
      );
    }
  }, [insightsData]);

  const loadHealthInsights = async (force = false): Promise<boolean> => {
    const currentLanguage = i18n.language;

    if (
      !force &&
      (isFetchingRef.current || loadedLanguageRef.current === currentLanguage)
    ) {
      return false;
    }

    isFetchingRef.current = true;
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiService.getHealthInsights(currentLanguage);
      setInsightsData(response);
      loadedLanguageRef.current = currentLanguage;
      return true;
    } catch (err: any) {
      console.error("Error loading health insights:", err);

      // Handle rate limit errors specifically
      if (err.response?.status === 429) {
        const errorData = err.response?.data;
        const resetInHours = errorData?.resetInHours || "24";
        const errorMessage =
          t("healthInsights.rateLimitExceeded", {
            hours: resetInHours,
          }) ||
          `Rate limit exceeded. Please try again in ${resetInHours} hours.`;
        setError(errorMessage);
        toast.error(errorMessage, { duration: 5000 });
      } else {
        setError(err.response?.data?.error || t("healthInsights.failedToLoad"));
        toast.error(t("healthInsights.failedToLoad"));
      }
      return false;
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
    }
  };

  const refreshHealthInsights = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Clear cache first
      await apiService.clearHealthInsightsCache(i18n.language);
      loadedLanguageRef.current = null;
      // Then fetch fresh data
      const refreshed = await loadHealthInsights(true);
      if (refreshed) {
        toast.success(t("healthInsights.refreshed") || "Insights refreshed!");
      }
    } catch (err: any) {
      console.error("Error refreshing health insights:", err);

      // Handle rate limit errors specifically
      if (err.response?.status === 429) {
        const errorData = err.response?.data;
        const resetInHours = errorData?.resetInHours || "24";
        const errorMessage =
          t("healthInsights.rateLimitExceeded", {
            hours: resetInHours,
          }) ||
          `Rate limit exceeded. Please try again in ${resetInHours} hours.`;
        setError(errorMessage);
        toast.error(errorMessage, { duration: 5000 });
      } else {
        setError(err.response?.data?.error || t("healthInsights.failedToLoad"));
        toast.error(t("healthInsights.failedToLoad"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getIconComponent = (iconName: string) => {
    const icons: { [key: string]: any } = {
      trophy: Trophy,
      "alert-circle": AlertCircle,
      lightbulb: Lightbulb,
      "check-circle": CheckCircle,
      heart: Heart,
      zap: Zap,
      target: Target,
    };
    return icons[iconName] || Lightbulb;
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case "success":
        return "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20";
      case "warning":
        return "border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20";
      case "tip":
        return "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20";
      default:
        return "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800";
    }
  };

  const getInsightIconColor = (type: string) => {
    switch (type) {
      case "success":
        return "text-green-600 dark:text-green-400";
      case "warning":
        return "text-orange-600 dark:text-orange-400";
      case "tip":
        return "text-blue-600 dark:text-blue-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300";
      case "medium":
        return "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300";
      case "low":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pb-20 md:pb-8 pt-0 md:pt-20 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-green-600 dark:text-green-400 mx-auto mb-4" />
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            {t("healthInsights.analyzingData")}
          </p>
        </div>
      </div>
    );
  }

  if (error || !insightsData) {
    return (
      <div className="min-h-screen pb-20 md:pb-8 pt-0 md:pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          <Card className="p-8 md:p-12 text-center">
            <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {t("healthInsights.unableToLoad")}
            </h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6">
              {error || t("healthInsights.tryAgainLater")}
            </p>
            <Button onClick={() => void loadHealthInsights(true)}>
              <RefreshCw className="w-4 h-4 mr-2" />
              {t("healthInsights.retry")}
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 md:pb-8 pt-0 md:pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <Breadcrumbs />

        {/* Header */}
        <div ref={headerRef} className="mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-4">
            <div className="flex items-center gap-3">
              <Brain className="w-8 h-8 sm:w-10 sm:h-10 text-purple-600 dark:text-purple-400" />
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 dark:from-purple-400 dark:to-pink-600 bg-clip-text text-transparent">
                {t("healthInsights.title")}
              </h1>
            </div>
            <Button
              onClick={refreshHealthInsights}
              variant="outline"
              size="sm"
              className="border-purple-600 dark:border-purple-500 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 w-full sm:w-auto"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {t("healthInsights.refresh")}
            </Button>
          </div>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            {t("healthInsights.subtitle")}
          </p>
        </div>

        <div ref={contentRef} className="space-y-6">
          {/* Overall Score Card */}
          <Card className="p-8 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                  {t("healthInsights.healthScore")}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {t("healthInsights.basedOnDays", {
                    count: insightsData.userData.daysTracked,
                  })}
                </p>
              </div>
              <div className="text-center">
                <div
                  className={`text-6xl font-bold ${getScoreColor(
                    insightsData.overallScore
                  )}`}
                >
                  {insightsData.overallScore}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  {t("healthInsights.outOf100")}
                </div>
              </div>
            </div>

            {/* Score Breakdown */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <div className="text-center p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-lg">
                <Flame className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2 text-orange-600 dark:text-orange-400" />
                <div
                  className={`text-xl sm:text-2xl font-bold ${getScoreColor(
                    insightsData.scoreBreakdown.calorieBalance
                  )}`}
                >
                  {insightsData.scoreBreakdown.calorieBalance}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {t("healthInsights.calorieBalance")}
                </div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-lg">
                <Activity className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
                <div
                  className={`text-xl sm:text-2xl font-bold ${getScoreColor(
                    insightsData.scoreBreakdown.macroBalance
                  )}`}
                >
                  {insightsData.scoreBreakdown.macroBalance}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {t("healthInsights.macroBalance")}
                </div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-lg">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2 text-green-600 dark:text-green-400" />
                <div
                  className={`text-xl sm:text-2xl font-bold ${getScoreColor(
                    insightsData.scoreBreakdown.consistency
                  )}`}
                >
                  {insightsData.scoreBreakdown.consistency}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {t("healthInsights.consistency")}
                </div>
              </div>
              <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                <Heart className="w-6 h-6 mx-auto mb-2 text-pink-600 dark:text-pink-400" />
                <div
                  className={`text-2xl font-bold ${getScoreColor(
                    insightsData.scoreBreakdown.hydration
                  )}`}
                >
                  {insightsData.scoreBreakdown.hydration}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {t("healthInsights.hydration")}
                </div>
              </div>
            </div>
          </Card>

          {/* AI Coach Message */}
          <Card className="p-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/20 rounded-full">
                <Brain className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">
                  {t("healthInsights.aiCoachSays")}
                </h3>
                <p className="text-white/90">
                  {insightsData.nutritionCoachMessage}
                </p>
              </div>
            </div>
          </Card>

          {/* User Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3">
                <Zap className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {insightsData.userData.bmr}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {t("healthInsights.bmr")}
                  </div>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800">
              <div className="flex items-center gap-3">
                <Flame className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {insightsData.userData.tdee}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {t("healthInsights.tdee")}
                  </div>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3">
                <Activity className="w-8 h-8 text-green-600 dark:text-green-400" />
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {insightsData.userData.averageCalories}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {t("healthInsights.avgCalories")}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Insights */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Lightbulb className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              {t("healthInsights.personalizedInsights")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {insightsData.insights.map((insight, index) => {
                const IconComponent = getIconComponent(insight.icon);
                return (
                  <Card
                    key={index}
                    className={`p-6 border-2 ${getInsightColor(insight.type)}`}
                  >
                    <div className="flex items-start gap-3">
                      <IconComponent
                        className={`w-6 h-6 flex-shrink-0 ${getInsightIconColor(
                          insight.type
                        )}`}
                      />
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                          {insight.title}
                        </h3>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {insight.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Recommendations */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              {t("healthInsights.actionRecommendations")}
            </h2>
            <div className="space-y-4">
              {insightsData.recommendations.map((rec, index) => (
                <Card key={index} className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                          {rec.title}
                        </h3>
                        <Badge className={getPriorityColor(rec.priority)}>
                          {t(`healthInsights.${rec.priority}`)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {rec.category}
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    {rec.description}
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {t("healthInsights.actionItems")}
                    </p>
                    {rec.actionItems.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                      >
                        <ChevronRight className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                        {item}
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Weekly Goals */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              {t("healthInsights.weeklyGoals")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {insightsData.weeklyGoals.map((goal, index) => (
                <Card key={index} className="p-6">
                  <div className="flex items-start gap-3 mb-3">
                    <Award className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                        {goal.goal}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {goal.target}
                      </p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all"
                      style={{ width: `${goal.progress}%` }}
                    ></div>
                  </div>
                  <div className="text-right text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {goal.progress}%
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      <ScrollToTop />
    </div>
  );
}
