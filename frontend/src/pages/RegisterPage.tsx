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
import { ChefHat, Lock, Mail, User, Loader2, Check } from "lucide-react";
import SettingsMenu from "../components/SettingsMenu";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);

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

  const passwordRequirements = [
    { text: "At least 8 characters", met: password.length >= 8 },
    { text: "One uppercase letter", met: /[A-Z]/.test(password) },
    { text: "One lowercase letter", met: /[a-z]/.test(password) },
    { text: "One number", met: /\d/.test(password) },
  ];

  const isPasswordValid = passwordRequirements.every((req) => req.met);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!isPasswordValid) {
      setError("Password does not meet requirements");
      return;
    }

    setIsLoading(true);

    try {
      await register({ name, email, password });
      navigate("/dashboard");
    } catch (err: any) {
      setError(
        err.response?.data?.error || "Registration failed. Please try again."
      );
    } finally {
      setIsLoading(false);
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
            className="inline-flex items-center justify-center w-20 h-20 bg-[#FF7043] rounded-2xl mb-4 shadow-lg"
          >
            <ChefHat className="w-10 h-10 text-white" />
          </div>
          <h1
            className="text-4xl font-bold text-[#4A4A4A] dark:text-gray-100 mb-2"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            {t("auth.registerTitle")}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t("auth.registerTitle")}
          </p>
        </div>

        <Card className="bg-white dark:bg-gray-900 shadow-xl border border-gray-200 dark:border-gray-800">
          <CardHeader className="space-y-1">
            <CardTitle
              className="text-2xl text-center text-[#4A4A4A] dark:text-gray-100"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              {t("auth.registerTitle")}
            </CardTitle>
            <CardDescription className="text-center text-gray-600 dark:text-gray-400">
              {t("auth.registerTitle")}
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
                  htmlFor="name"
                  className="text-[#4A4A4A] dark:text-gray-200"
                >
                  {t("auth.name")}
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10 border-gray-300 dark:border-gray-700 focus:border-[#FF7043] focus:ring-[#FF7043] dark:bg-gray-800 dark:text-gray-100"
                    required
                  />
                </div>
              </div>

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
                    className="pl-10 border-gray-300 dark:border-gray-700 focus:border-[#FF7043] focus:ring-[#FF7043] dark:bg-gray-800 dark:text-gray-100"
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
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 border-gray-300 dark:border-gray-700 focus:border-[#FF7043] focus:ring-[#FF7043] dark:bg-gray-800 dark:text-gray-100"
                    required
                  />
                </div>
                {password && (
                  <div className="space-y-1 text-xs">
                    {passwordRequirements.map((req, index) => (
                      <div
                        key={index}
                        className={`flex items-center gap-2 ${
                          req.met
                            ? "text-[#4CAF50] dark:text-green-400"
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center ${
                            req.met
                              ? "bg-[#4CAF50] dark:bg-green-600"
                              : "bg-gray-200 dark:bg-gray-700"
                          }`}
                        >
                          {req.met && <Check className="w-3 h-3 text-white" />}
                        </div>
                        {req.text}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className="text-[#4A4A4A] dark:text-gray-200"
                >
                  {t("auth.confirmPassword")}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 border-gray-300 dark:border-gray-700 focus:border-[#FF7043] focus:ring-[#FF7043] dark:bg-gray-800 dark:text-gray-100"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#FF7043] hover:bg-[#f4511e] text-white font-semibold"
                disabled={isLoading || !isPasswordValid}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("auth.registerButton")}...
                  </>
                ) : (
                  t("auth.registerButton")
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-center text-gray-600 dark:text-gray-400">
              {t("auth.hasAccount")}{" "}
              <Link
                to="/login"
                className="text-[#29B6F6] hover:text-[#0288d1] hover:underline font-semibold"
              >
                {t("auth.signIn")}
              </Link>
            </div>
          </CardFooter>
        </Card>

        <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-8">
          By creating an account, you agree to our Terms of Service and Privacy
          Policy
        </p>
      </div>
    </div>
  );
}
