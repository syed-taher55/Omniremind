"use client";

export default function AppError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="max-w-lg">
      <h1 className="font-serif text-3xl">This page did not load</h1>
      <p className="mt-3 text-sm leading-6 text-muted">{error.message}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-5 rounded-full bg-pine px-4 py-2 text-sm text-paper"
      >
        Try again
      </button>
    </div>
  );
}
