"use client";

export default function DashboardLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      {/* ✅ Topbar Skeleton */}
      <div className="h-12 bg-gray-200 dark:bg-gray-800 animate-pulse" />

      <div className="flex-1 flex">
        {/* ✅ Sidebar Skeleton */}
        <div className="w-64 bg-gray-100 dark:bg-gray-900 animate-pulse" />

        {/* ✅ Main Content Skeleton */}
        <div className="flex-1 p-6 space-y-6">
          {/* عنوان الصفحة */}
          <div className="h-6 w-1/3 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />

          {/* وصف قصير */}
          <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />

          {/* ✅ Placeholder Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="h-32 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-lg"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
