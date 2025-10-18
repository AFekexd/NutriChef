import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  ChefHat,
  Apple,
  ShoppingCart,
  Calendar,
  TrendingUp,
  Heart,
  LogOut,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const features = [
    {
      icon: Apple,
      title: "Smart Inventory",
      description: "Track ingredients and expiry dates with AI",
      color: "#4CAF50",
      bgColor: "bg-green-100",
    },
    {
      icon: ChefHat,
      title: "AI Recipe Generator",
      description: "Get personalized recipes based on what you have",
      color: "#FF7043",
      bgColor: "bg-orange-100",
    },
    {
      icon: ShoppingCart,
      title: "Grocery Planning",
      description: "Smart shopping lists with portion optimization",
      color: "#29B6F6",
      bgColor: "bg-blue-100",
    },
    {
      icon: Calendar,
      title: "Meal Planning",
      description: "Plan your weekly meals effortlessly",
      color: "#4CAF50",
      bgColor: "bg-green-100",
    },
    {
      icon: TrendingUp,
      title: "Nutrition Tracking",
      description: "Monitor calories and macros automatically",
      color: "#FF7043",
      bgColor: "bg-orange-100",
    },
    {
      icon: Heart,
      title: "Health Insights",
      description: "AI-powered nutrition coaching",
      color: "#29B6F6",
      bgColor: "bg-blue-100",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0 md:pt-16">
      {/* Header - Mobile only */}
      <header className="md:hidden border-b border-gray-200 bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#4CAF50] rounded-xl flex items-center justify-center shadow-md">
              <ChefHat className="w-7 h-7 text-white" />
            </div>
            <h1
              className="text-2xl font-bold text-[#4A4A4A]"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              NutriChef
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-[#4A4A4A]">
                {user?.name}
              </p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="border-[#FF7043] text-[#FF7043] hover:bg-[#FF7043] hover:text-white transition-all"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2
            className="text-4xl font-bold mb-4 text-[#4A4A4A]"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Welcome back,{" "}
            <span className="text-[#4CAF50]">{user?.name?.split(" ")[0]}</span>!
            👋
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your AI-powered nutrition assistant is ready to help you plan meals,
            manage inventory, and achieve your health goals.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card
                  className="bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group h-full"
                  onClick={() => {
                    if (feature.title === "Smart Inventory") {
                      navigate("/inventory");
                    }
                  }}
                >
                  <CardHeader>
                    <div
                      className={`w-14 h-14 rounded-xl ${feature.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                    >
                      <Icon
                        className="w-7 h-7"
                        style={{ color: feature.color }}
                      />
                    </div>
                    <CardTitle
                      className="text-[#4A4A4A] font-semibold"
                      style={{ fontFamily: "Poppins, sans-serif" }}
                    >
                      {feature.title}
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Card className="bg-white border border-gray-200 shadow-xl">
            <CardHeader>
              <CardTitle
                className="text-[#4A4A4A] text-2xl"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Getting Started
              </CardTitle>
              <CardDescription className="text-gray-600">
                Complete these steps to maximize your experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-green-50 rounded-xl border-2 border-green-200">
                  <div
                    className="text-4xl font-bold text-[#4CAF50] mb-2"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  >
                    0
                  </div>
                  <p className="text-sm text-gray-600 mb-3 font-medium">
                    Inventory Items
                  </p>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-[#4CAF50] hover:text-[#45a049] font-semibold"
                    onClick={() => navigate("/inventory")}
                  >
                    Add ingredients →
                  </Button>
                </div>
                <div className="p-6 bg-orange-50 rounded-xl border-2 border-orange-200">
                  <div
                    className="text-4xl font-bold text-[#FF7043] mb-2"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  >
                    0
                  </div>
                  <p className="text-sm text-gray-600 mb-3 font-medium">
                    Saved Recipes
                  </p>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-[#FF7043] hover:text-[#f4511e] font-semibold"
                  >
                    Explore recipes →
                  </Button>
                </div>
                <div className="p-6 bg-blue-50 rounded-xl border-2 border-blue-200">
                  <div
                    className="text-4xl font-bold text-[#29B6F6] mb-2"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  >
                    0
                  </div>
                  <p className="text-sm text-muted-foreground">Meal Plans</p>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-[#29B6F6] hover:text-[#0288d1] font-semibold"
                  >
                    Create plan →
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
