import { useEffect, useMemo, useState } from "react";
import { User } from "lucide-react";

type UserAvatarProps = {
  name?: string | null;
  avatar?: string | null;
  className?: string;
  fallbackClassName?: string;
  iconClassName?: string;
};

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
  "http://localhost:5000";

function resolveAvatarUrl(avatar?: string | null): string | null {
  if (!avatar) {
    return null;
  }

  const value = avatar.trim();
  if (!value) {
    return null;
  }

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:") ||
    value.startsWith("blob:")
  ) {
    return value;
  }

  const base = API_BASE_URL.endsWith("/")
    ? API_BASE_URL.slice(0, -1)
    : API_BASE_URL;

  if (value.startsWith("/")) {
    return `${base}${value}`;
  }

  return `${base}/${value}`;
}

function getInitials(name?: string | null): string {
  if (!name) {
    return "?";
  }

  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return "?";
  }

  return parts.map((part) => part.charAt(0).toUpperCase()).join("");
}

export function UserAvatar({
  name,
  avatar,
  className,
  fallbackClassName,
  iconClassName,
}: UserAvatarProps) {
  const [hasError, setHasError] = useState(false);
  const avatarUrl = useMemo(() => resolveAvatarUrl(avatar), [avatar]);

  useEffect(() => {
    setHasError(false);
  }, [avatarUrl]);

  if (!avatarUrl || hasError) {
    const initials = getInitials(name);

    return (
      <div
        className={className}
        aria-label={name || "User avatar"}
        title={name || "User"}
      >
        <div
          className={`w-full h-full flex items-center justify-center rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 font-semibold ${fallbackClassName || ""}`}
        >
          {initials === "?" ? <User className={iconClassName || "w-1/2 h-1/2"} /> : initials}
        </div>
      </div>
    );
  }

  return (
    <img
      src={avatarUrl}
      alt={name || "User avatar"}
      className={className}
      onError={() => setHasError(true)}
      loading="lazy"
      decoding="async"
    />
  );
}
