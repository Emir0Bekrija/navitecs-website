"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <h1 className="text-7xl font-bold bg-gradient-to-r from-[#00AEEF] to-[#00FF9C] bg-clip-text text-transparent mb-4">
          500
        </h1>
        <h2 className="text-2xl font-semibold text-white mb-4">
          Something Went Wrong
        </h2>
        <p className="text-gray-400 mb-8">
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#00AEEF] to-[#00FF9C] text-black font-semibold rounded-lg hover:scale-105 transition-transform cursor-pointer"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
