export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        
        {/* Logo */}
        <div className="flex justify-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">W</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Wit</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white py-8 px-6 shadow-sm rounded-xl border border-gray-100">
          {children}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400">
          Meat inventory &amp; traceability platform
        </p>

      </div>
    </div>
  );
}
