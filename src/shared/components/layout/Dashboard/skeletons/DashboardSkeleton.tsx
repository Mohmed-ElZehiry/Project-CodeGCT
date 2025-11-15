type DashboardSkeletonProps = {
  type?: "list" | "grid" | "profile" | "form" | "table" | "chart";
  items?: number;
};

export default function DashboardSkeleton({ type = "list", items = 3 }: DashboardSkeletonProps) {
  switch (type) {
    case "profile":
      return (
        <div className="p-6 animate-pulse space-y-6">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 rounded-full bg-gray-700" />
            <div className="space-y-2">
              <div className="h-4 w-32 rounded bg-gray-600" />
              <div className="h-4 w-24 rounded bg-gray-600" />
            </div>
          </div>
          {renderBlocks(items, "h-4 w-2/3 rounded bg-gray-600")}
        </div>
      );
    case "grid":
      return (
        <div className="p-6 space-y-4 animate-pulse">
          <div className="h-6 w-1/3 rounded bg-gray-700" />
          <div className="grid grid-cols-2 gap-4">
            {renderBlocks(items, "h-24 rounded bg-gray-600")}
          </div>
        </div>
      );
    case "form":
      return (
        <div className="p-6 space-y-6 animate-pulse">
          <div className="h-6 w-1/4 rounded bg-gray-700" />
          {renderBlocks(items, "h-4 w-2/3 rounded bg-gray-600")}
        </div>
      );
    case "table":
      return (
        <div className="p-6 animate-pulse space-y-4">
          <div className="h-6 w-1/3 rounded bg-gray-700" />
          <div className="border border-gray-700 rounded-md overflow-hidden">
            <div className="grid grid-cols-4 gap-2 bg-gray-800 p-2">
              {renderBlocks(4, "h-4 bg-gray-600 rounded")}
            </div>
            {renderBlocks(items, "grid grid-cols-4 gap-2 p-2 border-t border-gray-700")}
          </div>
        </div>
      );
    case "chart":
      return (
        <div className="p-6 animate-pulse space-y-4">
          <div className="h-6 w-1/3 rounded bg-gray-700" />
          <div className="h-48 w-full bg-gray-600 rounded" />
          <div className="flex justify-between">
            {renderBlocks(items, "h-4 w-12 bg-gray-600 rounded")}
          </div>
        </div>
      );
    default:
      return (
        <div className="p-6 space-y-4 animate-pulse">
          <div className="h-6 w-1/4 rounded bg-gray-700" />
          {renderBlocks(items, "h-4 w-3/4 rounded bg-gray-600")}
        </div>
      );
  }
}

function renderBlocks(count: number, className: string) {
  return [...Array(count)].map((_, i) => (
    <div key={i} className={className} aria-hidden="true"></div>
  ));
}
