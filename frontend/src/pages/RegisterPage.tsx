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
import { apiService } from "../services/api";

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
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const emailCheckTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Email validation
  const isEmailValid = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const emailValid = email.length > 0 && isEmailValid(email);
  const emailInvalid = emailTouched && email.length > 0 && !isEmailValid(email);

  // Check email availability with debounce
  useEffect(() => {
    if (emailCheckTimeoutRef.current) {
      clearTimeout(emailCheckTimeoutRef.current);
    }

    if (email.length > 0 && isEmailValid(email)) {
      setCheckingEmail(true);
      emailCheckTimeoutRef.current = setTimeout(async () => {
        try {
          const result = await apiService.checkEmailAvailability(email);
          setEmailAvailable(result.available);
        } catch (error) {
          console.error("Error checking email availability:", error);
          setEmailAvailable(null);
        } finally {
          setCheckingEmail(false);
        }
      }, 500); // 500ms debounce
    } else {
      setEmailAvailable(null);
      setCheckingEmail(false);
    }

    return () => {
      if (emailCheckTimeoutRef.current) {
        clearTimeout(emailCheckTimeoutRef.current);
      }
    };
  }, [email]);

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

    if (emailAvailable === false) {
      setError("This email is already registered. Please use a different email.");
      return;
    }

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
                      emailValid && emailAvailable === true
                        ? "border-green-500 dark:border-green-500"
                        : ""
                    } ${
                      emailValid && emailAvailable === false
                        ? "border-yellow-500 dark:border-yellow-500"
                        : ""
                    }`}
                    required
                  />
                  {checkingEmail && (
                    <Loader2 className="absolute right-3 top-3 h-4 w-4 text-gray-400 animate-spin" />
                  )}
                  {!checkingEmail && emailValid && emailAvailable === true && (
                    <Check className="absolute right-3 top-3 h-4 w-4 text-green-500" />
                  )}
                  {!checkingEmail && emailValid && emailAvailable === false && (
                    <X className="absolute right-3 top-3 h-4 w-4 text-yellow-500" />
                  )}
                  {!checkingEmail && emailInvalid && (
                    <X className="absolute right-3 top-3 h-4 w-4 text-red-500" />
                  )}
                </div>
                {emailInvalid && (
                  <p className="text-xs text-red-500 dark:text-red-400">
                    Please enter a valid email address
                  </p>
                )}
                {!checkingEmail &&
                  emailValid &&
                  emailAvailable === false && (
                    <p className="text-xs text-yellow-600 dark:text-yellow-400">
                      This email is already registered. Please use a different
                      email or{" "}
                      <Link
                        to="/login"
                        className="underline hover:text-yellow-700 dark:hover:text-yellow-300"
                      >
                        login here
                      </Link>
                      .
                    </p>
                  )}
                {!checkingEmail &&
                  emailValid &&
                  emailAvailable === true && (
                    <p className="text-xs text-green-600 dark:text-green-400">
                      Email is available
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
