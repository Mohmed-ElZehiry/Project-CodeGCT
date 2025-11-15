"use client";

export default function ErrorRoutePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-4">
      <h2 className="text-2xl font-bold text-red-600">حدث خطأ غير متوقع</h2>
      <p className="text-muted-foreground">حدث خطأ في الصفحة</p>
    </div>
  );
}
