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
import {
  ChefHat,
  Lock,
  Mail,
  User,
  Loader2,
  Check,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import SettingsMenu from "../components/SettingsMenu";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);

  // Email validation
  const isEmailValid = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const emailValid = email.length > 0 && isEmailValid(email);
  const emailInvalid = emailTouched && email.length > 0 && !isEmailValid(email);

  // Password strength calculation
  const calculatePasswordStrength = (pwd: string) => {
    let strength = 0;
    if (pwd.length >= 8) strength += 25;
    if (pwd.length >= 12) strength += 15;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength += 20;
    if (/\d/.test(pwd)) strength += 20;
    if (/[^a-zA-Z0-9]/.test(pwd)) strength += 20;
    return Math.min(strength, 100);
  };

  const passwordStrength =
    password.length > 0 ? calculatePasswordStrength(password) : 0;
  const getStrengthColor = () => {
    if (passwordStrength < 40) return "bg-red-500";
    if (passwordStrength < 70) return "bg-yellow-500";
    return "bg-green-500";
  };
  const getStrengthLabel = () => {
    if (passwordStrength < 40) return "Weak";
    if (passwordStrength < 70) return "Medium";
    return "Strong";
  };

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
                    onKeyPress={handleKeyPress}
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
                    onBlur={() => setEmailTouched(true)}
                    onKeyPress={handleKeyPress}
                    className={`pl-10 pr-10 border-gray-300 dark:border-gray-700 focus:border-[#FF7043] focus:ring-[#FF7043] dark:bg-gray-800 dark:text-gray-100 ${
                      emailInvalid ? "border-red-500 dark:border-red-500" : ""
                    } ${
                      emailValid ? "border-green-500 dark:border-green-500" : ""
                    }`}
                    required
                  />
                  {emailValid && (
                    <Check className="absolute right-3 top-3 h-4 w-4 text-green-500" />
                  )}
                  {emailInvalid && (
                    <X className="absolute right-3 top-3 h-4 w-4 text-red-500" />
                  )}
                </div>
                {emailInvalid && (
                  <p className="text-xs text-red-500 dark:text-red-400">
                    Please enter a valid email address
                  </p>
                )}
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
                    className="pl-10 pr-10 border-gray-300 dark:border-gray-700 focus:border-[#FF7043] focus:ring-[#FF7043] dark:bg-gray-800 dark:text-gray-100"
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
                {password && (
                  <div className="space-y-2">
                    {/* Password Strength Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600 dark:text-gray-400">
                          Password Strength:
                        </span>
                        <span
                          className={`font-medium ${
                            passwordStrength < 40
                              ? "text-red-500"
                              : passwordStrength < 70
                              ? "text-yellow-500"
                              : "text-green-500"
                          }`}
                        >
                          {getStrengthLabel()}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${getStrengthColor()}`}
                          style={{ width: `${passwordStrength}%` }}
                        />
                      </div>
                    </div>
                    {/* Password Requirements */}
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
                            {req.met && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>
                          {req.text}
                        </div>
                      ))}
                    </div>
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
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="pl-10 pr-10 border-gray-300 dark:border-gray-700 focus:border-[#FF7043] focus:ring-[#FF7043] dark:bg-gray-800 dark:text-gray-100"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
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

              {/* OAuth Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                    Or sign up with
                  </span>
                </div>
              </div>

              {/* OAuth Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-gray-300 dark:border-gray-700"
                  onClick={() => {
                    window.location.href = `${
                      import.meta.env.VITE_API_URL || "http://localhost:5000"
                    }/api/auth/google`;
                  }}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-gray-300 dark:border-gray-700"
                  onClick={() => {
                    window.location.href = `${
                      import.meta.env.VITE_API_URL || "http://localhost:5000"
                    }/api/auth/discord`;
                  }}
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                  </svg>
                  Discord
                </Button>
              </div>
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
