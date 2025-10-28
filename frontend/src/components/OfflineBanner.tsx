import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";

export const OfflineBanner = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 animate-in slide-in-from-top">
      <Alert className="rounded-none border-0 border-b bg-amber-500 dark:bg-amber-600 text-white border-amber-600">
        <WifiOff className="h-4 w-4" />
        <AlertDescription className="ml-2 font-medium">
          You're offline. Some features may not be available.
        </AlertDescription>
      </Alert>
    </div>
  );
};
