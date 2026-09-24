"use client";

import { useState } from "react";
import { Info, Users, UserCheck } from "lucide-react";
import { teamLevels } from "@/data/dashboard";

export default function TeamPage() {
  const [activeLevel, setActiveLevel] = useState(1);

  const totalMembers = teamLevels.reduce((sum, l) => sum + l.members.length, 0);
  const activeMembers = teamLevels.reduce(
    (sum, l) => sum + l.members.filter((m) => m.status === "Active").length,
    0
  );

  const current = teamLevels.find((l) => l.level === activeLevel)!;

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display text-xl font-semibold text-text">Team</h1>
        
      </div>

      <p className="mb-5 flex items-start gap-1.5 text-xs text-text-muted">
      </p>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-2 md:w-fit md:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-accent-2/10 text-accent-2">
            <Users size={17} />
          </div>
          <p className="text-xs text-text-muted">Total Team Members</p>
          <p className="num font-display text-2xl font-bold text-text">{totalMembers}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <UserCheck size={17} />
          </div>
          <p className="text-xs text-text-muted">Active Members</p>
          <p className="num font-display text-2xl font-bold text-text">{activeMembers}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface">
        <div className="flex gap-2 overflow-x-auto border-b border-border p-3">
          {teamLevels.map((l) => (
            <button
              key={l.level}
              onClick={() => setActiveLevel(l.level)}
              className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                activeLevel === l.level
                  ? "bg-accent-2/10 text-accent-2"
                  : "text-text-muted hover:bg-surface-2 hover:text-text"
              }`}
            >
              Level {l.level}
              <span className="ml-1.5 text-xs text-text-muted">
                ({l.members.length}/{l.limit})
              </span>
            </button>
          ))}
        </div>

        <div className="p-6">
          <div className="mb-5">
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="font-medium text-text">Level {current.level} slots filled</span>
              <span className="num text-text-muted">{current.members.length} / {current.limit}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-accent-2"
                style={{ width: `${(current.members.length / current.limit) * 100}%` }}
              />
            </div>
          </div>

          {current.members.length === 0 ? (
            <p className="py-8 text-center text-sm text-text-muted">
              No members in this level yet. Share your referral link to start growing it.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-left text-sm">
                <thead>
                  <tr className="text-xs font-medium text-text-muted">
                    <th className="px-2 py-2">Name</th>
                    <th className="px-2 py-2">Joined</th>
                    <th className="px-2 py-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {current.members.map((m) => (
                    <tr key={m.id} className="border-t border-border">
                      <td className="px-2 py-3 font-medium text-text">{m.name}</td>
                      <td className="px-2 py-3 text-text-muted">{m.joinedDate}</td>
                      <td className="px-2 py-3 text-right">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            m.status === "Active"
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-surface-2 text-text-muted"
                          }`}
                        >
                          {m.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}