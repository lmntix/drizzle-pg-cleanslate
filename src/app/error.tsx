"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <h1 className="text-4xl font-bold mb-4">Oops! Something went wrong.</h1>
      <p className="text-xl mb-8">
        {error.message || "An unexpected error occurred."}
      </p>
      <div className="space-x-4">
        <Button onClick={() => reset()}>Try again</Button>
        <Button onClick={() => router.push("/")}>Return to Table Editor</Button>
      </div>
    </div>
  );
}
