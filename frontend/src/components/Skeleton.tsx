interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
  count?: number;
}

export const Skeleton = ({
  className = "",
  variant = "rectangular",
  width,
  height,
  count = 1,
}: SkeletonProps) => {
  const baseClasses = "animate-pulse bg-gray-200 dark:bg-gray-800";

  const variantClasses = {
    text: "h-4 rounded",
    circular: "rounded-full",
    rectangular: "rounded-lg",
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === "number" ? `${width}px` : width;
  if (height)
    style.height = typeof height === "number" ? `${height}px` : height;

  const skeletonElement = (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );

  if (count === 1) {
    return skeletonElement;
  }

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`${baseClasses} ${variantClasses[variant]} ${className} mb-2`}
          style={style}
        />
      ))}
    </>
  );
};

// Preset skeleton layouts
export const SkeletonCard = () => (
  <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
    <Skeleton variant="rectangular" height={200} className="mb-4" />
    <Skeleton variant="text" className="mb-2" width="60%" />
    <Skeleton variant="text" count={2} />
  </div>
);

export const SkeletonList = ({ count = 3 }: { count?: number }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="flex items-center space-x-4">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="40%" />
          <Skeleton variant="text" width="60%" />
        </div>
      </div>
    ))}
  </div>
);

export const SkeletonTable = ({ rows = 5 }: { rows?: number }) => (
  <div className="space-y-2">
    <Skeleton variant="rectangular" height={40} className="mb-4" />
    {Array.from({ length: rows }).map((_, index) => (
      <Skeleton key={index} variant="rectangular" height={56} />
    ))}
  </div>
);
