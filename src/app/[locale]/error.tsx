"use client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-4">
      <h2 className="text-2xl font-bold text-red-600">حدث خطأ غير متوقع</h2>
      <p className="text-muted-foreground">{error.message}</p>
      <button
        onClick={() => reset()}
        className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition"
      >
        إعادة المحاولة
      </button>
    </div>
  );
}
