import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { useTranslation } from "react-i18next";
import {
  User,
  Mail,
  Lock,
  Save,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Shield,
  Clock,
  LogOut,
  Trash2,
  Camera,
  Key,
  Sparkles,
  RefreshCw,
  Activity,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { apiService } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { confirmDialog } from "../utils/confirmDialog";
import { toast } from "sonner";
import type {
  User as UserType,
  Session,
  LoginHistoryItem,
  OpenRouterUsage,
} from "../types";

export function ProfilePage() {
  const { t } = useTranslation();
  const { logout, refreshUser } = useAuth();
  const [_user, setUser] = useState<UserType | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Avatar upload
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile form
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password form
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // AI API Key form
  const [aiApiKeyData, setAiApiKeyData] = useState({
    apiKey: "",
    provider: "openai" as "openai" | "gemini",
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [currentProvider, setCurrentProvider] = useState<
    "openai" | "gemini" | undefined
  >();
  const [isUpdatingApiKey, setIsUpdatingApiKey] = useState(false);

  // OpenRouter API Key form
  const [openRouterApiKey, setOpenRouterApiKey] = useState("");
  const [showOpenRouterKey, setShowOpenRouterKey] = useState(false);
  const [hasOpenRouterKey, setHasOpenRouterKey] = useState(false);
  const [openRouterUsage, setOpenRouterUsage] = useState<OpenRouterUsage | null>(
    null
  );
  const [isUpdatingOpenRouterKey, setIsUpdatingOpenRouterKey] = useState(false);
  const [isRefreshingUsage, setIsRefreshingUsage] = useState(false);

  // GSAP refs
  const headerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadProfileData();
  }, []);

  useEffect(() => {
    if (!isLoading && headerRef.current) {
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
      );
    }
  }, [isLoading]);

  useEffect(() => {
    if (!isLoading && cardsRef.current) {
      const cards = cardsRef.current.querySelectorAll(".profile-card");
      gsap.fromTo(
        cards,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          stagger: 0.1,
          ease: "power2.out",
        }
      );
    }
  }, [isLoading]);

  const loadProfileData = async () => {
    setIsLoading(true);
    try {
      const [
        profileRes,
        sessionsRes,
        historyRes,
        aiKeyConfigRes,
        openRouterConfigRes,
      ] = await Promise.all([
        apiService.getProfile(),
        apiService.getSessions(),
        apiService.getLoginHistory(10, 0),
        apiService.getAIApiKeyConfig(),
        apiService.getOpenRouterApiKeyConfig(),
      ]);

      setUser(profileRes.user);
      setProfileData({
        name: profileRes.user.name,
        email: profileRes.user.email,
      });
      setSessions(sessionsRes.sessions);
      setLoginHistory(historyRes.history);
      setHasApiKey(aiKeyConfigRes.hasApiKey);
      setCurrentProvider(aiKeyConfigRes.provider);
      if (aiKeyConfigRes.provider) {
        setAiApiKeyData((prev) => ({
          ...prev,
          provider: aiKeyConfigRes.provider!,
        }));
      }
      setHasOpenRouterKey(openRouterConfigRes.hasApiKey);
      setOpenRouterUsage(openRouterConfigRes.usage || null);
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          t("profile.loadError") ||
          "Failed to load profile data"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsUpdatingProfile(true);

    try {
      const response = await apiService.updateProfile(profileData);
      setUser(response.user);
      setSuccess(
        t("profile.profileUpdatedSuccess") || "Profile updated successfully!"
      );
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          t("profile.profileUpdateError") ||
          "Failed to update profile"
      );
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError(t("profile.passwordMismatch") || "New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setError(
        t("profile.passwordTooShort") ||
          "New password must be at least 8 characters long"
      );
      return;
    }

    setIsChangingPassword(true);

    try {
      await apiService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setSuccess(
        t("profile.passwordChangedSuccess") || "Password changed successfully!"
      );
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          t("profile.passwordChangeError") ||
          "Failed to change password"
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    confirmDialog({
      title: t("profile.revokeSessionConfirm") || "Revoke Session?",
      message:
        t("profile.revokeSessionMessage") ||
        "This will log out the device associated with this session. If this is your current session, you will be logged out immediately.",
      confirmText: t("profile.revoke") || "Revoke",
      cancelText: t("common.cancel") || "Cancel",
      onConfirm: async () => {
        try {
          const result = await apiService.revokeSession(sessionId);

          if (result.wasCurrentSession) {
            // We revoked our own session - logout
            await logout();
            window.location.href = "/login";
          } else {
            // It was another session
            setSessions(sessions.filter((s) => s.sessionId !== sessionId));
            setSuccess(
              t("profile.sessionRevokedSuccess") ||
                "Session revoked successfully!"
            );
            setTimeout(() => setSuccess(null), 3000);
          }
        } catch (err: any) {
          setError(
            err.response?.data?.error ||
              t("profile.sessionRevokedError") ||
              "Failed to revoke session"
          );
        }
      },
    });
  };

  const handleAvatarClick = () => {
    if (_user?.oauthProvider) {
      toast.info(
        t("profile.oauthAvatarInfo") ||
          "Your avatar is managed by your OAuth provider"
      );
      return;
    }
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(
        t("profile.avatarTooLarge") || "Avatar file must be less than 5MB"
      );
      return;
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error(
        t("profile.invalidAvatarType") ||
          "Only JPEG, PNG, and WebP images are allowed"
      );
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const result = await apiService.uploadAvatar(file);
      setUser(result.user);
      await refreshUser();
      toast.success(
        t("profile.avatarUploadSuccess") || "Avatar uploaded successfully!"
      );
    } catch (err: any) {
      toast.error(
        err.response?.data?.error ||
          t("profile.avatarUploadError") ||
          "Failed to upload avatar"
      );
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteAvatar = async () => {
    if (_user?.oauthProvider) {
      toast.info(
        t("profile.oauthAvatarInfo") ||
          "Your avatar is managed by your OAuth provider"
      );
      return;
    }

    confirmDialog({
      title: t("profile.deleteAvatarConfirm") || "Delete Avatar?",
      message:
        t("profile.deleteAvatarMessage") ||
        "Are you sure you want to remove your profile picture?",
      confirmText: t("common.delete") || "Delete",
      cancelText: t("common.cancel") || "Cancel",
      onConfirm: async () => {
        try {
          const result = await apiService.deleteAvatar();
          setUser(result.user);
          await refreshUser();
          toast.success(
            t("profile.avatarDeleteSuccess") || "Avatar deleted successfully!"
          );
        } catch (err: any) {
          toast.error(
            err.response?.data?.error ||
              t("profile.avatarDeleteError") ||
              "Failed to delete avatar"
          );
        }
      },
    });
  };

  const handleSaveApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!aiApiKeyData.apiKey) {
      setError(t("profile.apiKeyRequired") || "API key is required");
      return;
    }

    setIsUpdatingApiKey(true);

    try {
      // Show validation in progress
      toast.info(t("profile.validatingApiKey") || "Validating API key...", {
        duration: 2000,
      });

      const result = await apiService.saveAIApiKey(aiApiKeyData);
      setHasApiKey(result.hasApiKey);
      setCurrentProvider(aiApiKeyData.provider);
      setSuccess(
        t("profile.apiKeySaved") ||
          "AI API key validated and saved successfully! You can now use AI features without rate limits."
      );
      setAiApiKeyData({ ...aiApiKeyData, apiKey: "" }); // Clear the input
      setTimeout(() => setSuccess(null), 5000);

      // Show success toast as well
      toast.success(t("profile.apiKeySaved") || "API key validated and saved!");
    } catch (err: any) {
      const errorMsg = err.response?.data?.error;
      const isValidationError = err.response?.data?.validationFailed;

      if (isValidationError) {
        const message =
          errorMsg ||
          t("profile.apiKeyInvalid") ||
          "The provided API key is invalid or doesn't work. Please check your key and try again.";
        setError(message);
        // Show toast error for immediate feedback
        toast.error(message);
      } else {
        const message =
          errorMsg ||
          t("profile.apiKeySaveError") ||
          "Failed to save AI API key";
        setError(message);
        toast.error(message);
      }
    } finally {
      setIsUpdatingApiKey(false);
    }
  };

  const handleDeleteApiKey = async () => {
    confirmDialog({
      title: t("profile.deleteApiKeyConfirm") || "Delete API Key?",
      message:
        t("profile.deleteApiKeyMessage") ||
        "Are you sure you want to remove your AI API key? You will be subject to rate limits again.",
      confirmText: t("common.delete") || "Delete",
      cancelText: t("common.cancel") || "Cancel",
      onConfirm: async () => {
        try {
          const result = await apiService.deleteAIApiKey();
          setHasApiKey(result.hasApiKey);
          setCurrentProvider(undefined);
          setAiApiKeyData({ apiKey: "", provider: "openai" });
          toast.success(
            t("profile.apiKeyDeleted") || "AI API key deleted successfully!"
          );
        } catch (err: any) {
          toast.error(
            err.response?.data?.error ||
              t("profile.apiKeyDeleteError") ||
              "Failed to delete AI API key"
          );
        }
      },
    });
  };

  const handleSaveOpenRouterKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!openRouterApiKey) {
      setError(t("profile.apiKeyRequired") || "API key is required");
      return;
    }

    setIsUpdatingOpenRouterKey(true);

    try {
      const result = await apiService.saveOpenRouterApiKey({
        apiKey: openRouterApiKey,
      });
      setHasOpenRouterKey(result.hasApiKey);
      setOpenRouterUsage(result.usage || null);
      setSuccess(
        t("profile.openrouterKeySaved") ||
          "OpenRouter API key saved and validated successfully!"
      );
      setOpenRouterApiKey(""); // Clear the input
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          t("profile.openrouterKeySaveError") ||
          "Failed to save OpenRouter API key"
      );
    } finally {
      setIsUpdatingOpenRouterKey(false);
    }
  };

  const handleDeleteOpenRouterKey = async () => {
    confirmDialog({
      title: t("profile.deleteOpenRouterKeyConfirm") || "Delete OpenRouter API Key?",
      message:
        t("profile.deleteOpenRouterKeyMessage") ||
        "Are you sure you want to remove your OpenRouter API key?",
      confirmText: t("common.delete") || "Delete",
      cancelText: t("common.cancel") || "Cancel",
      onConfirm: async () => {
        try {
          await apiService.deleteOpenRouterApiKey();
          setHasOpenRouterKey(false);
          setOpenRouterUsage(null);
          setOpenRouterApiKey("");
          toast.success(
            t("profile.openrouterKeyDeleted") ||
              "OpenRouter API key deleted successfully!"
          );
        } catch (err: any) {
          toast.error(
            err.response?.data?.error ||
              t("profile.openrouterKeyDeleteError") ||
              "Failed to delete OpenRouter API key"
          );
        }
      },
    });
  };

  const handleRefreshOpenRouterUsage = async () => {
    setIsRefreshingUsage(true);
    try {
      const result = await apiService.refreshOpenRouterUsage();
      setOpenRouterUsage(result.usage);
      toast.success(
        t("profile.usageRefreshed") || "Usage data refreshed successfully!"
      );
    } catch (err: any) {
      toast.error(
        err.response?.data?.error ||
          t("profile.usageRefreshError") ||
          "Failed to refresh usage data"
      );
    } finally {
      setIsRefreshingUsage(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  const formatIPAddress = (ip: string) => {
    // Convert ::1 to localhost
    if (ip === "::1" || ip === "127.0.0.1") {
      return "localhost (this device)";
    }
    // Convert ::ffff:127.0.0.1 to localhost
    if (ip.includes("::ffff:127.0.0.1")) {
      return "localhost (this device)";
    }
    return ip;
  };

  const getDeviceInfo = (userAgent: string | undefined) => {
    if (!userAgent) return t("profile.unknownDevice") || "Unknown device";

    // Extract browser and OS info
    const isChrome = userAgent.includes("Chrome");
    const isFirefox = userAgent.includes("Firefox");
    const isSafari = userAgent.includes("Safari") && !isChrome;
    const isEdge = userAgent.includes("Edg");

    const isWindows = userAgent.includes("Windows");
    const isMac = userAgent.includes("Mac OS");
    const isLinux = userAgent.includes("Linux");
    const isAndroid = userAgent.includes("Android");
    const isiOS = userAgent.includes("iPhone") || userAgent.includes("iPad");

    let browser = "Unknown Browser";
    if (isEdge) browser = "Edge";
    else if (isChrome) browser = "Chrome";
    else if (isFirefox) browser = "Firefox";
    else if (isSafari) browser = "Safari";

    let os = "Unknown OS";
    if (isWindows) os = "Windows";
    else if (isMac) os = "macOS";
    else if (isLinux) os = "Linux";
    else if (isAndroid) os = "Android";
    else if (isiOS) os = "iOS";

    return `${browser} on ${os}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 md:pb-8 pt-0 md:pt-20 bg-gray-50 dark:bg-gray-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <Breadcrumbs />
        {/* Header */}
        <div ref={headerRef} className="mb-6 md:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-green-600 to-green-300 dark:from-green-400 dark:to-green-600 bg-clip-text text-transparent">
            {t("profile.title") || "Profile Settings"}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-2">
            {t("profile.subtitle") ||
              "Manage your account settings and preferences"}
          </p>
        </div>

        {/* Messages */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="w-5 h-5" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-700 dark:text-green-300">
              {success}
            </AlertDescription>
          </Alert>
        )}

        <div ref={cardsRef} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile Information */}
          <Card className="profile-card p-6 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3 mb-6">
              <div className="relative group">
                <div className="p-3 bg-green-100 dark:bg-green-950/50 rounded-lg overflow-hidden">
                  {_user?.oauthAvatar ? (
                    <img
                      src={
                        _user.oauthAvatar.startsWith("http")
                          ? _user.oauthAvatar
                          : `${
                              import.meta.env.VITE_API_BASE_URL ||
                              "http://localhost:5000"
                            }${_user.oauthAvatar}`
                      }
                      alt={_user.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-green-200 dark:border-green-700"
                    />
                  ) : (
                    <User className="w-16 h-16 text-green-600 dark:text-green-400" />
                  )}
                </div>
                {!_user?.oauthProvider && (
                  <button
                    onClick={handleAvatarClick}
                    disabled={isUploadingAvatar}
                    className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg cursor-pointer"
                    title={t("profile.changeAvatar") || "Change avatar"}
                  >
                    <Camera className="w-6 h-6 text-white" />
                  </button>
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {t("profile.profileInformation") || "Profile Information"}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t("profile.updatePersonalDetails") ||
                    "Update your personal details"}
                </p>
                {_user?.oauthProvider && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    {t("profile.connectedWith") || "Connected with"}{" "}
                    {_user.oauthProvider.charAt(0).toUpperCase() +
                      _user.oauthProvider.slice(1)}
                  </p>
                )}
              </div>
              {!_user?.oauthProvider && _user?.oauthAvatar && (
                <Button
                  onClick={handleDeleteAvatar}
                  variant="outline"
                  size="sm"
                  className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 border-red-200 dark:border-red-800"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/jpg,image/webp"
              onChange={handleAvatarChange}
              className="hidden"
            />

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("profile.name") || "Name"}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="text"
                    value={profileData.name}
                    onChange={(e) =>
                      setProfileData({ ...profileData, name: e.target.value })
                    }
                    className="pl-10 dark:text-gray-300"
                    placeholder={t("profile.namePlaceholder") || "Your name"}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("profile.email") || "Email"}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="email"
                    value={profileData.email}
                    onChange={(e) =>
                      setProfileData({ ...profileData, email: e.target.value })
                    }
                    className="pl-10"
                    placeholder={
                      t("profile.emailPlaceholder") || "your@email.com"
                    }
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isUpdatingProfile}
                className="w-full bg-gradient-to-r from-green-600 to-green-400 hover:from-green-700 hover:to-green-500"
              >
                <Save className="w-4 h-4 mr-2" />
                {isUpdatingProfile
                  ? t("profile.saving") || "Saving..."
                  : t("profile.saveChanges") || "Save Changes"}
              </Button>
            </form>
          </Card>

          {/* Change Password */}
          <Card className="profile-card p-6 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-blue-100 dark:bg-blue-950/50 rounded-lg">
                <Lock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {t("profile.changePassword") || "Change Password"}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t("profile.updatePasswordRegularly") ||
                    "Update your password regularly"}
                </p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("profile.currentPassword") || "Current Password"}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type={showPasswords.current ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        currentPassword: e.target.value,
                      })
                    }
                    className="pl-10 pr-10"
                    placeholder={
                      t("profile.currentPasswordPlaceholder") ||
                      "Enter current password"
                    }
                    required
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswords({
                        ...showPasswords,
                        current: !showPasswords.current,
                      })
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.current ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("profile.newPassword") || "New Password"}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type={showPasswords.new ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        newPassword: e.target.value,
                      })
                    }
                    className="pl-10 pr-10"
                    placeholder={
                      t("profile.newPasswordPlaceholder") ||
                      "Enter new password"
                    }
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswords({
                        ...showPasswords,
                        new: !showPasswords.new,
                      })
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.new ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("profile.confirmNewPassword") || "Confirm New Password"}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type={showPasswords.confirm ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="pl-10 pr-10"
                    placeholder={
                      t("profile.confirmPasswordPlaceholder") ||
                      "Confirm new password"
                    }
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswords({
                        ...showPasswords,
                        confirm: !showPasswords.confirm,
                      })
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.confirm ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isChangingPassword}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500"
              >
                <Shield className="w-4 h-4 mr-2" />
                {isChangingPassword
                  ? t("profile.changing") || "Changing..."
                  : t("profile.changePassword") || "Change Password"}
              </Button>
            </form>
          </Card>

          {/* AI API Key Configuration */}
          <Card className="profile-card p-6 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-950/50 dark:to-pink-950/50 rounded-lg">
                <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {t("profile.aiApiKey") || "AI API Key Configuration"}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t("profile.aiApiKeyDescription") ||
                    "Use your own AI API key to bypass rate limits"}
                </p>
              </div>
              {hasApiKey && (
                <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-950 rounded-full">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-xs font-medium text-green-700 dark:text-green-300">
                    {t("profile.configured") || "Configured"}
                  </span>
                </div>
              )}
            </div>

            {hasApiKey && currentProvider && (
              <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-900 dark:text-green-100">
                      {t("profile.apiKeyConfigured") || "API Key Configured"}
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      {t("profile.usingProvider") || "Using provider"}:{" "}
                      <span className="font-semibold uppercase">
                        {currentProvider}
                      </span>
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                      ✓ {t("profile.noRateLimits") || "No AI rate limits"}
                      <br />✓{" "}
                      {t("profile.noTokenUsage") ||
                        "Not using website's API tokens"}
                    </p>
                    <Button
                      onClick={handleDeleteApiKey}
                      variant="outline"
                      size="sm"
                      className="mt-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 border-red-200 dark:border-red-800"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      {t("profile.removeApiKey") || "Remove API Key"}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {!hasApiKey && (
              <form onSubmit={handleSaveApiKey} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("profile.selectProvider") || "Select AI Provider"}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setAiApiKeyData({ ...aiApiKeyData, provider: "openai" })
                      }
                      className={`p-4 border-2 rounded-lg transition-all ${
                        aiApiKeyData.provider === "openai"
                          ? "border-purple-500 bg-purple-50 dark:bg-purple-950/50"
                          : "border-gray-200 dark:border-gray-700 hover:border-purple-300"
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Key className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          OpenAI
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          GPT-4, GPT-3.5
                        </span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setAiApiKeyData({ ...aiApiKeyData, provider: "gemini" })
                      }
                      className={`p-4 border-2 rounded-lg transition-all ${
                        aiApiKeyData.provider === "gemini"
                          ? "border-purple-500 bg-purple-50 dark:bg-purple-950/50"
                          : "border-gray-200 dark:border-gray-700 hover:border-purple-300"
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Sparkles className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          Google Gemini
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Gemini Pro
                        </span>
                      </div>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("profile.apiKeyLabel") || "API Key"}
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      type={showApiKey ? "text" : "password"}
                      value={aiApiKeyData.apiKey}
                      onChange={(e) =>
                        setAiApiKeyData({
                          ...aiApiKeyData,
                          apiKey: e.target.value,
                        })
                      }
                      className="pl-10 pr-10 font-mono text-sm"
                      placeholder={
                        aiApiKeyData.provider === "openai"
                          ? "sk-..."
                          : "AIza..."
                      }
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showApiKey ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {t("profile.apiKeyHelp") ||
                      "Your API key is encrypted and stored securely. Get your key from"}{" "}
                    {aiApiKeyData.provider === "openai" ? (
                      <a
                        href="https://platform.openai.com/api-keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-600 dark:text-purple-400 hover:underline"
                      >
                        OpenAI Platform
                      </a>
                    ) : (
                      <a
                        href="https://makersuite.google.com/app/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-600 dark:text-purple-400 hover:underline"
                      >
                        Google AI Studio
                      </a>
                    )}
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={isUpdatingApiKey}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isUpdatingApiKey
                    ? t("profile.saving") || "Saving..."
                    : t("profile.saveApiKey") || "Save API Key"}
                </Button>
              </form>
            )}
          </Card>

          {/* OpenRouter API Key Configuration */}
          <Card className="profile-card p-6 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-950/50 dark:to-cyan-950/50 rounded-lg">
                <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {t("profile.openRouterApiKey") || "OpenRouter API Key"}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t("profile.openRouterApiKeyDescription") ||
                    "Configure OpenRouter for AI model access with usage tracking"}
                </p>
              </div>
              {hasOpenRouterKey && (
                <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-950 rounded-full">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-xs font-medium text-green-700 dark:text-green-300">
                    {t("profile.configured") || "Configured"}
                  </span>
                </div>
              )}
            </div>

            {hasOpenRouterKey && openRouterUsage && (
              <div className="mb-6">
                <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-green-900 dark:text-green-100">
                        {t("profile.openRouterKeyConfigured") ||
                          "OpenRouter API Key Configured"}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                        ✓{" "}
                        {t("profile.openRouterAccess") ||
                          "Access to multiple AI models through OpenRouter"}
                      </p>
                    </div>
                    <Button
                      onClick={handleDeleteOpenRouterKey}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950 border-red-200 dark:border-red-800"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      {t("profile.removeApiKey") || "Remove"}
                    </Button>
                  </div>
                </div>

                {/* Usage Statistics */}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      {t("profile.usageStatistics") || "Usage Statistics"}
                    </h3>
                    <Button
                      onClick={handleRefreshOpenRouterUsage}
                      disabled={isRefreshingUsage}
                      variant="outline"
                      size="sm"
                    >
                      <RefreshCw
                        className={`w-4 h-4 mr-1 ${
                          isRefreshingUsage ? "animate-spin" : ""
                        }`}
                      />
                      {t("profile.refresh") || "Refresh"}
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {t("profile.totalRequests") || "Total Requests"}
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {openRouterUsage.totalRequests.toLocaleString()}
                      </p>
                    </div>

                    <div className="bg-white dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {t("profile.inputTokens") || "Input Tokens"}
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {openRouterUsage.tokensUsed.input.toLocaleString()}
                      </p>
                    </div>

                    <div className="bg-white dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {t("profile.outputTokens") || "Output Tokens"}
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {openRouterUsage.tokensUsed.output.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {openRouterUsage.remainingBalance !== undefined && (
                    <div className="mt-4 bg-white dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {t("profile.remainingBalance") || "Remaining Balance"}
                      </p>
                      <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        ${openRouterUsage.remainingBalance.toFixed(2)}
                      </p>
                    </div>
                  )}

                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                    {t("profile.lastUpdated") || "Last updated"}:{" "}
                    {new Date(openRouterUsage.lastUpdated).toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            {!hasOpenRouterKey && (
              <form onSubmit={handleSaveOpenRouterKey} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("profile.openRouterKeyLabel") || "OpenRouter API Key"}
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      type={showOpenRouterKey ? "text" : "password"}
                      value={openRouterApiKey}
                      onChange={(e) => setOpenRouterApiKey(e.target.value)}
                      className="pl-10 pr-10 font-mono text-sm"
                      placeholder="sk-or-v1-..."
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowOpenRouterKey(!showOpenRouterKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showOpenRouterKey ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {t("profile.openRouterKeyHelp") ||
                      "Your API key is encrypted and stored securely. Get your key from"}{" "}
                    <a
                      href="https://openrouter.ai/keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      OpenRouter Dashboard
                    </a>
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={isUpdatingOpenRouterKey}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isUpdatingOpenRouterKey
                    ? t("profile.saving") || "Saving..."
                    : t("profile.saveAndValidate") || "Save & Validate Key"}
                </Button>
              </form>
            )}
          </Card>

          {/* Active Sessions */}
          <Card className="profile-card p-6 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-purple-100 dark:bg-purple-950/50 rounded-lg">
                <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {t("profile.activeSessions") || "Active Sessions"}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t("profile.manageActiveSessions") ||
                    "Manage your active login sessions"}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.sessionId}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-purple-300 dark:hover:border-purple-700 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 bg-purple-100 dark:bg-purple-950/50 rounded">
                        <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {getDeviceInfo(session.userAgent)}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {formatIPAddress(session.ipAddress)}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-500 ml-10">
                      {t("profile.activeSince") || "Active since"}{" "}
                      {formatDate(session.createdAt)}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRevokeSession(session.sessionId)}
                    className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                  >
                    <LogOut className="w-4 h-4 mr-1" />
                    {t("profile.revoke") || "Revoke"}
                  </Button>
                </div>
              ))}

              {sessions.length === 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  {t("profile.noActiveSessions") || "No active sessions"}
                </p>
              )}
            </div>
          </Card>

          {/* Login History */}
          <Card className="profile-card p-6 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-orange-100 dark:bg-orange-950/50 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {t("profile.loginHistory") || "Login History"}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t("profile.recentLoginActivity") ||
                    "Recent login attempts and activity"}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                      {t("profile.time") || "Time"}
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                      {t("profile.ipAddress") || "IP Address"}
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                      {t("profile.status") || "Status"}
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                      {t("profile.device") || "Device"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loginHistory.map((item) => (
                    <tr
                      key={item.loginHistoryId}
                      className="border-b border-gray-100 dark:border-gray-800 last:border-0"
                    >
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">
                        {formatDate(item.timestamp)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">
                        {item.ipAddress}
                      </td>
                      <td className="py-3 px-4">
                        {item.success ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400">
                            <CheckCircle className="w-3 h-3" />
                            {t("profile.success") || "Success"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400">
                            <AlertCircle className="w-3 h-3" />
                            {t("profile.failed") || "Failed"}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                        {item.userAgent || t("profile.unknown") || "Unknown"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {loginHistory.length === 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  {t("profile.noLoginHistory") || "No login history available"}
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
