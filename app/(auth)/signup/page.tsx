"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    organizationName: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      // ✅ safe JSON parsing (verhindert crash bei HTML error pages)
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error ?? "Signup failed. Please try again.");
        setLoading(false);
        return;
      }

      // Auto sign-in after successful registration
      const result = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Account created but login failed. Please sign in manually.");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h2 className="text-2xl font-semibold text-gray-900 mb-1">
        Create your account
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Start your organization&apos;s free trial.
      </p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          placeholder="Organization name"
          required
          value={form.organizationName}
          onChange={update("organizationName")}
          className="w-full rounded-lg border px-3 py-2"
        />

        <input
          placeholder="Full name"
          required
          value={form.name}
          onChange={update("name")}
          className="w-full rounded-lg border px-3 py-2"
        />

        <input
          type="email"
          placeholder="Email"
          required
          value={form.email}
          onChange={update("email")}
          className="w-full rounded-lg border px-3 py-2"
        />

        <input
          type="password"
          placeholder="Password"
          required
          minLength={8}
          value={form.password}
          onChange={update("password")}
          className="w-full rounded-lg border px-3 py-2"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-green-600 px-4 py-2 text-white"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link href="/login" className="text-green-600">
          Sign in
        </Link>
      </p>
    </>
  );
}
