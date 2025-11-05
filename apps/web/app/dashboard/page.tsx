"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

async function getAuthJSON(path: string) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const res = await fetch(`${API_BASE}${path}`, {
    headers: token ? { authorization: token } : {},
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { error?: string }).error || "Request failed");
  return json;
}

interface ZapAction {
  name: string;
}

interface Zap {
  id: string;
  name: string;
  trigger: {
    type: {
      name: string;
    };
  };
  actions: ZapAction[];
}

interface UserResponse {
  email: string;
}

function LoadingSkeletonRow({ index }: { index: number }) {
  return (
    <tr className={index % 2 === 0 ? "bg-white/0" : "bg-white/[0.02]"}>
      <td className="px-4 py-3">
        <div className="h-3.5 w-32 animate-pulse rounded bg-white/10" />
      </td>
      <td className="px-4 py-3">
        <div className="h-3.5 w-24 animate-pulse rounded bg-white/10" />
      </td>
      <td className="px-4 py-3">
        <div className="h-3.5 w-40 animate-pulse rounded bg-white/10" />
      </td>
      <td className="px-4 py-3 text-right">
        <div className="ml-auto h-8 w-16 animate-pulse rounded bg-white/10" />
      </td>
    </tr>
  );
}

function ErrorAlert({ message }: { message: string }) {
  return (
    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {message}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [tokenChecked, setTokenChecked] = useState(false);
  const [user, setUser] = useState<UserResponse | null>(null);
  const [zaps, setZaps] = useState<Zap[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mouseXY, setMouseXY] = useState<{ x: string; y: string }>({ x: "50%", y: "50%" });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/signin");
      return;
    }

    setTokenChecked(true);
    setIsLoading(true);

    Promise.all([getAuthJSON("/api/v1/users/user"), getAuthJSON("/api/v1/zap")])
      .then(([userRes, zapRes]) => {
        setUser((userRes as any).user);
        setZaps((zapRes as any).zaps);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.replace("/signin");
  };

  const handleDeleteWorkflow = async (zapId: string, zapName: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent row click navigation
    
    if (!confirm(`Are you sure you want to delete "${zapName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/api/v1/zap/${zapId}`, {
        method: "DELETE",
        headers: {
          Authorization: token || "",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete workflow");
      }

      // Remove the workflow from the list
      setZaps((prevZaps) => prevZaps?.filter((zap) => zap.id !== zapId) || null);
      alert(`Workflow "${zapName}" deleted successfully`);
    } catch (error) {
      console.error("Error deleting workflow:", error);
      alert("Failed to delete workflow. Please try again.");
    }
  };

  const renderZapsTable = () => {
    if (isLoading && !zaps) {
      return (
        <table className="min-w-full divide-y divide-white/10 text-left text-sm text-white/80">
          <thead>
            <tr className="bg-white/[0.04] text-xs uppercase tracking-wide text-white/60">
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Trigger</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
              <th className="px-4 py-3 text-right font-semibold">Open</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {[0, 1, 2].map((i) => (
              <LoadingSkeletonRow key={i} index={i} />
            ))}
          </tbody>
        </table>
      );
    }

    if (!zaps || zaps.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-white/10 bg-white/[0.02] py-16 text-center text-white/70">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 shadow-sm">
            <span className="text-xl">⚡</span>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-white/90">No workflows yet</p>
            <p className="text-xs text-white/60">Kickstart your automation by creating your first workflow.</p>
          </div>
          <Link
            href="/workflows/new"
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition hover:scale-[1.02]"
            style={{ backgroundImage: "linear-gradient(120deg,#7C3AED 0%,#FF6B2C 50%,#FACC15 100%)" }}
          >
            Create your first workflow
          </Link>
        </div>
      );
    }

    return (
      <table className="min-w-full divide-y divide-white/10 text-left text-sm text-white/80">
        <thead>
          <tr className="bg-white/[0.04] text-xs uppercase tracking-wide text-white/60">
            <th className="px-4 py-3 font-semibold">Name</th>
            <th className="px-4 py-3 font-semibold">Trigger</th>
            <th className="px-4 py-3 font-semibold">Actions</th>
            <th className="px-4 py-3 text-right font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {zaps.map((zap, index) => (
            <tr
              key={zap.id}
              className={`transition hover:bg-white/5 ${index % 2 === 0 ? "bg-white/0" : "bg-white/[0.02]"}`}
            >
              <td 
                className="px-4 py-3 font-medium text-white/90 cursor-pointer"
                onClick={() => router.push(`/workflows/${zap.id}`)}
              >
                {zap.name}
              </td>
              <td 
                className="px-4 py-3 text-white/70 cursor-pointer"
                onClick={() => router.push(`/workflows/${zap.id}`)}
              >
                {zap.trigger?.type?.name ?? "—"}
              </td>
              <td 
                className="px-4 py-3 text-white/70 cursor-pointer"
                onClick={() => router.push(`/workflows/${zap.id}`)}
              >
                {zap.actions?.length ? zap.actions.map((action) => action.name).join(", ") : "—"}
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  <Link
                    href={`/workflows/${zap.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition hover:scale-[1.02]"
                    style={{ backgroundImage: "linear-gradient(120deg,#7C3AED 0%,#FF6B2C 50%,#FACC15 100%)" }}
                  >
                    Open
                  </Link>
                  <button
                    onClick={(e) => handleDeleteWorkflow(zap.id, zap.name, e)}
                    className="inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 transition hover:scale-[1.02]"
                    title="Delete workflow"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  if (!tokenChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-slate-600" />
      </div>
    );
  }

  

  return (
    <div

    >
      {/* atmospheric backdrop with hover brighten */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute -top-16 left-10 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(255,107,44,0.35),transparent_60%)] blur-2xl opacity-90 transition duration-500 group-hover:brightness-125 group-hover:opacity-100" />
        <div className="absolute -bottom-20 right-0 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.5),transparent_65%)] blur-3xl opacity-90 transition duration-500 group-hover:brightness-125 group-hover:opacity-100" />

        {/* mouse-follow highlight */}
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: `radial-gradient(600px circle at ${mouseXY.x} ${mouseXY.y}, rgba(255,255,255,0.06), transparent 45%)`,
          }}
        />
      </div>

      <header className="sticky top-0 z-20 h-14 border-b border-white/10 bg-white/5 backdrop-blur ">
        <div className="mx-auto flex h-full w-full max-w-6xl items-center justify-between px-6">
          <Link
            href="/dashboard"
            className="text-sm font-semibold bg-[linear-gradient(120deg,#7C3AED_0%,#FF6B2C_50%,#FACC15_100%)] bg-clip-text text-transparent"
          >
            FlowForge Dashboard
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/workflows/new"
              className="rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-[0_18px_45px_-25px_rgba(255,107,44,0.7)] transition-transform duration-200 hover:scale-[1.03] hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B2C]/70"
              style={{ backgroundImage: "linear-gradient(120deg,#7C3AED 0%,#FF6B2C 50%,#FACC15 100%)" }}
            >
              New Workflow
            </Link>
            <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80">
              <span>{user?.email ?? "Loading…"}</span>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded border border-white/10 px-2 py-1 text-xs font-medium text-white/70 transition hover:border-white/20 hover:bg-white/10"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8 mt-10">
        {error ? <ErrorAlert message={error} /> : null}

        <section className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/[0.05] p-5 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.6)] transition-shadow hover:shadow-[0_35px_100px_-45px_rgba(124,58,237,0.55)]">
            <h2 className="text-base font-semibold text-white/90">Quick Start</h2>
            <p className="text-sm text-white/70">
              Build a workflow in three steps—choose a trigger, chain your actions, and deploy to production with built-in observability.
            </p>
            <ul className="space-y-3 text-sm text-white/70">
              <li className="flex items-start gap-2">
                <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-xs text-white">1</span>
                <span>Select a trigger from your integrations catalog.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-xs text-white">2</span>
                <span>Add actions to manipulate data, call APIs, or notify teams.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-xs text-white">3</span>
                <span>Test in the simulator, then publish to your environment.</span>
              </li>
            </ul>
           
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.05] p-5 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.6)] transition-shadow hover:shadow-[0_35px_100px_-45px_rgba(124,58,237,0.55)]">
            <div className="flex items-center justify-between pb-4">
              <h2 className="text-base font-semibold text-white/90">Your Workflows</h2>
              <span className="text-xs text-white/60">
                {isLoading && zaps === null ? "Loading…" : `${zaps?.length ?? 0} total`}
              </span>
            </div>
            <div className="overflow-hidden rounded-lg border border-white/10">
              {renderZapsTable()}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
