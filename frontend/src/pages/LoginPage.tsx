import { useState, useRef, useEffect } from "react";
import { gsap } from "gsap";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Alert, AlertDescription } from "../components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { ChefHat, Lock, Mail, Loader2, Eye, EyeOff } from "lucide-react";
import SettingsMenu from "../components/SettingsMenu";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);

  // Load remembered email on mount
  useEffect(() => {
    const remembered = localStorage.getItem("rememberMe");
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (remembered === "true" && savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
      );
    }
  }, []);

  useEffect(() => {
    if (logoRef.current) {
      gsap.fromTo(
        logoRef.current,
        { scale: 0, rotate: -180 },
        {
          scale: 1,
          rotate: 0,
          duration: 0.8,
          ease: "back.out(1.5)",
        }
      );
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login({ email, password });

      // Store remember me preference
      if (rememberMe) {
        localStorage.setItem("rememberMe", "true");
        localStorage.setItem("rememberedEmail", email);
      } else {
        localStorage.removeItem("rememberMe");
        localStorage.removeItem("rememberedEmail");
      }

      navigate("/dashboard");
    } catch (err: any) {
      const error = err.response?.data.toLowerCase();
      console.log(error);

      setError(
        error.includes("email")
          ? t("auth.invalidEmail")
          : error.includes("password")
          ? t("auth.invalidPassword")
          : error.includes("too many")
          ? t("auth.tooManyAttempts")
          : t("auth.loginFailed")
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Enter key submission
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading) {
      handleSubmit(e as any);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <SettingsMenu />
      </div>
      <div ref={containerRef} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div
            ref={logoRef}
            className="inline-flex items-center justify-center w-20 h-20 bg-[#4CAF50] rounded-2xl mb-4 shadow-lg"
          >
            <ChefHat className="w-10 h-10 text-white" />
          </div>
          <h1
            className="text-4xl font-bold text-[#4A4A4A] dark:text-gray-100 mb-2"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            NutriChef
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            AI-Powered Meal Planning & Nutrition
          </p>
        </div>

        <Card className="bg-white dark:bg-gray-900 shadow-xl border border-gray-200 dark:border-gray-800">
          <CardHeader className="space-y-1">
            <CardTitle
              className="text-2xl text-center text-[#4A4A4A] dark:text-gray-100"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              {t("auth.loginTitle")}
            </CardTitle>
            <CardDescription className="text-center text-gray-600 dark:text-gray-400">
              {t("auth.loginTitle")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-[#4A4A4A] dark:text-gray-200"
                >
                  {t("auth.email")}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="pl-10 border-gray-300 dark:border-gray-700 focus:border-[#4CAF50] focus:ring-[#4CAF50] dark:bg-gray-800 dark:text-gray-100"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-[#4A4A4A] dark:text-gray-200"
                >
                  {t("auth.password")}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="pl-10 pr-10 border-gray-300 dark:border-gray-700 focus:border-[#4CAF50] focus:ring-[#4CAF50] dark:bg-gray-800 dark:text-gray-100"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 text-[#4CAF50] focus:ring-[#4CAF50] border-gray-300 dark:border-gray-700 rounded"
                    />
                    <label
                      htmlFor="remember-me"
                      className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                    >
                      {t("auth.rememberMe") || "Remember me"}
                    </label>
                  </div>
                  <div className="text-right">
                    <Link
                      to="/forgot-password"
                      className="text-sm text-[#29B6F6] hover:text-[#0288d1] hover:underline"
                    >
                      {t("auth.forgotPassword") || "Forgot password?"}
                    </Link>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#4CAF50] hover:bg-[#45a049] text-white font-semibold"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("auth.loginButton")}...
                  </>
                ) : (
                  t("auth.loginButton")
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-center text-gray-600 dark:text-gray-400">
              {t("auth.noAccount")}{" "}
              <Link
                to="/register"
                className="text-[#29B6F6] hover:text-[#0288d1] hover:underline font-semibold"
              >
                {t("auth.signUp")}
              </Link>
            </div>
          </CardFooter>
        </Card>

        <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-8">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
