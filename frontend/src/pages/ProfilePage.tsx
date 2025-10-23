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
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { apiService } from "../services/api";
import type { User as UserType, Session, LoginHistoryItem } from "../types";

export function ProfilePage() {
  const { t, i18n } = useTranslation();
  const [user, setUser] = useState<UserType | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
      const [profileRes, sessionsRes, historyRes] = await Promise.all([
        apiService.getProfile(),
        apiService.getSessions(),
        apiService.getLoginHistory(10, 0),
      ]);

      setUser(profileRes.user);
      setProfileData({
        name: profileRes.user.name,
        email: profileRes.user.email,
      });
      setSessions(sessionsRes.sessions);
      setLoginHistory(historyRes.history);
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
    if (
      !confirm(
        t("profile.revokeSessionConfirm") ||
          "Are you sure you want to revoke this session?"
      )
    ) {
      return;
    }

    try {
      await apiService.revokeSession(sessionId);
      setSessions(sessions.filter((s) => s.sessionId !== sessionId));
      setSuccess(
        t("profile.sessionRevokedSuccess") || "Session revoked successfully!"
      );
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          t("profile.sessionRevokedError") ||
          "Failed to revoke session"
      );
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
    <div className="min-h-screen pb-20 md:pb-0 md:pt-16 bg-gray-50 dark:bg-gray-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div ref={headerRef} className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-green-300 dark:from-green-400 dark:to-green-600 bg-clip-text text-transparent">
            {t("profile.title") || "Profile Settings"}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {t("profile.subtitle") ||
              "Manage your account settings and preferences"}
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3 animate-in slide-in-from-top">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3 animate-in slide-in-from-top">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
            <p className="text-green-700 dark:text-green-400">{success}</p>
          </div>
        )}

        <div ref={cardsRef} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile Information */}
          <Card className="profile-card p-6 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-green-100 dark:bg-green-950/50 rounded-lg">
                <User className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {t("profile.profileInformation") || "Profile Information"}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t("profile.updatePersonalDetails") ||
                    "Update your personal details"}
                </p>
              </div>
            </div>

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
