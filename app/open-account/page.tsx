
import { Suspense } from "react";
import OpenAccountClient from "./OpenAccountClient";

export default function OpenAccountPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-background px-4 py-8">
          <div className="mx-auto max-w-4xl">
            Loading account form...
          </div>
        </main>
      }
    >
      <OpenAccountClient />
    </Suspense>
  );
}
