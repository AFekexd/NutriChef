import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../store";
import { setCredentials } from "../store/slices/authSlice";
import { Loader2 } from "lucide-react";

export default function OAuthCallbackPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const accessToken = params.get("accessToken");
        const refreshToken = params.get("refreshToken");
        const userStr = params.get("user");
        const error = params.get("error");

        if (error) {
          console.error("OAuth error:", error);
          navigate("/login?error=" + error);
          return;
        }

        if (!accessToken || !refreshToken || !userStr) {
          console.error("Missing OAuth parameters");
          navigate("/login?error=missing_parameters");
          return;
        }

        // Parse user data
        const user = JSON.parse(decodeURIComponent(userStr));

        // Store tokens
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);

        // Update Redux store
        dispatch(
          setCredentials({
            user,
            tokens: { accessToken, refreshToken },
          })
        );

        // Redirect to dashboard
        navigate("/dashboard");
      } catch (error) {
        console.error("OAuth callback error:", error);
        navigate("/login?error=callback_failed");
      }
    };

    handleCallback();
  }, [navigate, dispatch]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-[#4CAF50] mx-auto mb-4" />
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Completing authentication...
        </p>
      </div>
    </div>
  );
}
