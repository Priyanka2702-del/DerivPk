"use client";

import { useEffect, useState } from "react";
import { Info, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { logoutUser } from "@/lib/client-auth";

type User = {
  id: string;
  name: string;
  email: string;
};

export default function ProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);

  const [name, setName] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          if (response.status === 401) {
            router.push("/login");
            return;
          }

          setError(
            data.message || "Unable to load profile."
          );

          return;
        }

        setUser(data.user);
        setName(data.user.name);
      } catch (error) {
        console.error("Profile loading error:", error);

        setError(
          "Unable to connect to the server."
        );
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [router]);

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Name is required.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: trimmedName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message || "Unable to update profile."
        );
        return;
      }

      setUser(data.user);
      setName(data.user.name);

      setSuccess("Profile updated successfully.");

      router.refresh();
    } catch (error) {
      console.error("Profile update error:", error);

      setError(
        "Unable to connect to the server."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logoutUser();

    router.push("/login");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="max-w-xl">
        <div className="mb-5">
          <h1 className="font-display text-xl font-semibold text-text">
            Profile
          </h1>

          <p className="text-sm text-text-muted">
            Manage your account details.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6">
          <p className="text-sm text-text-muted">
            Loading profile...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl">
      <div className="mb-5">
        <h1 className="font-display text-xl font-semibold text-text">
          Profile
        </h1>

        <p className="text-sm text-text-muted">
          Manage your account details.
        </p>
      </div>

      <div className="mb-6 rounded-xl border border-border bg-surface p-6">
        <p className="mb-5 flex items-start gap-1.5 text-xs text-text-muted">
          <Info
            size={13}
            className="mt-0.5 shrink-0"
          />

          Your profile information is stored securely
          in your account.
        </p>

        <form onSubmit={handleSubmit}>
          {/* Name */}
          <div className="mb-4">
            <label className="mb-1 block text-xs text-text-muted">
              Full name
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text outline-none focus:border-accent-2"
              placeholder="Your name"
              required
              minLength={2}
              maxLength={100}
            />
          </div>

          {/* Email */}
          <div className="mb-6">
            <label className="mb-1 block text-xs text-text-muted">
              Email
            </label>

            <input
              type="email"
              value={user?.email || ""}
              readOnly
              className="w-full cursor-not-allowed rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-text-muted"
            />

            <p className="mt-1.5 text-xs text-text-muted">
              Email is used as your login identity.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-sm text-red-500">
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="mb-4 rounded-lg border border-green-500/20 bg-green-500/10 px-3 py-2.5 text-sm text-green-500">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-accent-2/10 px-6 py-2.5 text-sm font-semibold text-accent-2 transition hover:bg-accent-2/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : "Save Changes"}
          </button>
        </form>
      </div>

      {/* Logout */}
      <button
        type="button"
        onClick={handleLogout}
        className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-text transition hover:bg-surface-2"
      >
        <LogOut size={16} />
        Logout
      </button>
    </div>
  );
}