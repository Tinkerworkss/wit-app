export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white dark:bg-zinc-950 p-8">
      <div className="max-w-lg text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Wit
        </h1>
        <p className="text-lg text-zinc-500 dark:text-zinc-400">
          Meat inventory &amp; lot traceability platform
        </p>
        <div className="inline-flex items-center gap-2 rounded-full bg-green-50 dark:bg-green-950 px-4 py-1.5 text-sm font-medium text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          Service is running
        </div>
      </div>
    </main>
  );
}
