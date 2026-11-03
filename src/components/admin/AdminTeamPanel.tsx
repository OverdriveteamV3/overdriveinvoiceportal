"use client";

import { useEffect, useState, type FormEvent } from "react";
import AdminIcon from "@/components/admin/AdminIcons";
import { formatCents } from "@/lib/crm/money";
import { emptySocials, normalizeSocials, SOCIAL_PLATFORMS, socialHref } from "@/lib/socials";
import { TEAM_ROLES, type TeamMember, type TeamRole } from "@/lib/team-roles";
import type { TeamActivity, TeamDetail } from "@/lib/team-detail";

const ROLE_TAG: Record<TeamRole, string> = {
  admin: "border-violet-200/80 bg-violet-100/90 text-violet-700",
  agent: "border-blue-200 bg-blue-100 text-blue-800",
  tech: "border-zinc-200 bg-zinc-100 text-zinc-600",
};

const IDEAS = [
  "Keep a second Admin besides the master login, so the platform can still be recovered if one person is out.",
  "Give every open job one Agent. That person owns the quote, the invoice, and the order until the job is done.",
  "Open a Tech seat for a specific API, setting, or system update, then remove it when the work is finished.",
  "Agents need pipeline, quotes, invoices, orders, projects, and tasks. Leave billing keys and workspace deletion with Admins.",
  "Tech seats should reach integrations, settings, and system updates. They do not need client invoices or collected payments.",
  "Add a phone number on each seat later, so an Agent can be reached when a client is waiting.",
  "Show last active and the jobs each person owns, so a quiet seat is easy to spot.",
];

function RosterRow({
  name,
  detail,
  initial,
  role,
  selected,
  onOpen,
  onRemove,
}: {
  name: string;
  detail: string;
  initial: string;
  role: TeamRole;
  selected: boolean;
  onOpen: () => void;
  onRemove?: () => void;
}) {
  return (
    <li
      className={`flex items-center gap-3 rounded-xl border bg-white px-4 py-4 shadow-sm ${
        selected ? "border-[#0780f7] ring-2 ring-[#0780f7]/20" : "border-zinc-200"
      }`}
    >
      <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${ROLE_TAG[role]}`}>
          {initial}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-zinc-900">{name}</span>
          <span className="block truncate text-sm text-zinc-500">{detail}</span>
        </span>
      </button>
      <span className={`inline-flex shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${ROLE_TAG[role]}`}>
        {TEAM_ROLES.find((item) => item.id === role)?.label}
      </span>
      {onRemove ? (
        <button type="button" className="text-xs font-medium text-zinc-500 underline" onClick={onRemove}>
          Remove
        </button>
      ) : null}
    </li>
  );
}

function MemberDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const [detail, setDetail] = useState<TeamDetail | null>(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState<TeamRole | null>(null);
  const [profile, setProfile] = useState({
    username: "",
    displayName: "",
    email: "",
    phone: "",
    website: "",
    logo: "",
    socials: emptySocials(),
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stop = false;
    async function load() {
      const response = await fetch(`/api/admin/team/detail?id=${encodeURIComponent(id)}`);
      const body = await response.json().catch(() => ({}));
      if (stop) return;
      if (!response.ok) {
        setError(body.error ?? "Could not load this person.");
        return;
      }
      setName(body.member?.name ?? "");
      setRole(isTeamRole(String(body.member?.role ?? "")) ? (body.member.role as TeamRole) : null);
      setProfile({
        username: String(body.member?.profile?.username ?? ""),
        displayName: String(body.member?.profile?.displayName ?? body.member?.name ?? ""),
        email: String(body.member?.profile?.email ?? body.member?.email ?? ""),
        phone: String(body.member?.profile?.phone ?? ""),
        website: String(body.member?.profile?.website ?? ""),
        logo: String(body.member?.profile?.logo ?? ""),
        socials: normalizeSocials(body.member?.profile?.socials),
      });
      setDetail(body.detail as TeamDetail);
    }
    void load();
    return () => {
      stop = true;
    };
  }, [id]);

  const socialLinks = SOCIAL_PLATFORMS.flatMap((platform) => {
    const href = socialHref(platform.id, profile.socials[platform.id]);
    return href ? [{ id: platform.id, label: platform.label, href }] : [];
  });

  const jobTotal = detail ? detail.jobsProcessed + detail.openJobs : 0;
  const keptCents = detail ? Math.max(0, detail.moneyGeneratedCents - detail.payoutsCents) : 0;
  const payoutShare =
    detail && detail.moneyGeneratedCents > 0
      ? (detail.payoutsCents / detail.moneyGeneratedCents) * 100
      : 0;
  const processedShare = jobTotal > 0 && detail ? (detail.jobsProcessed / jobTotal) * 100 : 0;
  const roleLabel = TEAM_ROLES.find((item) => item.id === role)?.label;
  const displayName = profile.displayName || name || "Team member";
  const initial = displayName.trim().charAt(0).toUpperCase() || "T";
  const websiteHref = profile.website
    ? /^https?:\/\//i.test(profile.website)
      ? profile.website
      : `https://${profile.website}`
    : "";
  const contactBits = [
    profile.username ? `@${profile.username}` : "",
    profile.email,
    profile.phone,
  ].filter(Boolean);

  return (
    <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-base font-bold ${
              profile.logo ? "bg-zinc-100" : role ? ROLE_TAG[role] : "bg-zinc-100 text-zinc-600"
            }`}
          >
            {profile.logo ? (
              <img src={profile.logo} alt="" className="h-full w-full object-cover" />
            ) : (
              initial
            )}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">Details</p>
              {role && roleLabel ? (
                <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${ROLE_TAG[role]}`}>
                  {roleLabel}
                </span>
              ) : null}
            </div>
            <h4 className="truncate text-base font-semibold text-zinc-900">{displayName}</h4>
            {contactBits.length > 0 || websiteHref ? (
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
                {contactBits.map((bit) => (
                  <span key={bit}>{bit}</span>
                ))}
                {websiteHref ? (
                  <a href={websiteHref} target="_blank" rel="noreferrer" className="font-medium text-[#0560b5] hover:underline">
                    {profile.website}
                  </a>
                ) : null}
              </p>
            ) : null}
            {socialLinks.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {socialLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-[#0560b5] hover:border-[#0780f7] hover:bg-[#eef6ff]"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        </div>
        <button type="button" className="shrink-0 text-xs font-medium text-zinc-500 underline" onClick={onClose}>
          Close
        </button>
      </div>
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      {!detail && !error ? <p className="mt-3 text-sm text-zinc-500">Loading…</p> : null}
      {detail ? (
        <>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile
              icon="check-circle"
              label="Jobs processed"
              value={String(detail.jobsProcessed)}
              fill={processedShare}
              tone="emerald"
            />
            <StatTile
              icon="credit-card"
              label="Money generated"
              value={formatCents(detail.moneyGeneratedCents)}
              fill={detail.moneyGeneratedCents > 0 ? 100 : 0}
              tone="blue"
            />
            <StatTile
              icon="documents"
              label="Payouts received"
              value={formatCents(detail.payoutsCents)}
              fill={payoutShare}
              tone="violet"
            />
            <StatTile
              icon="clock"
              label="Open jobs"
              value={String(detail.openJobs)}
              fill={jobTotal > 0 ? 100 - processedShare : 0}
              tone="amber"
            />
          </dl>

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <figure
              className="rounded-xl border border-zinc-100 bg-zinc-50/80 p-4"
              aria-label={`${detail.jobsProcessed} jobs processed and ${detail.openJobs} open`}
            >
              <figcaption className="text-sm font-semibold text-zinc-900">Workload</figcaption>
              <div className="mt-4 flex items-center gap-5">
                <div
                  className="relative h-28 w-28 shrink-0 rounded-full"
                  style={{
                    background:
                      jobTotal === 0
                        ? "#e4e4e7"
                        : `conic-gradient(#059669 0 ${processedShare}%, #f59e0b ${processedShare}% 100%)`,
                  }}
                >
                  <div className="absolute inset-[11px] flex flex-col items-center justify-center rounded-full bg-white">
                    <span className="text-2xl font-bold leading-none text-zinc-900">{jobTotal}</span>
                    <span className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                      Jobs
                    </span>
                  </div>
                </div>
                <div className="min-w-0 flex-1 space-y-3 text-sm">
                  <MixRow color="bg-emerald-600" label="Processed" value={detail.jobsProcessed} share={processedShare} />
                  <MixRow
                    color="bg-amber-500"
                    label="Open"
                    value={detail.openJobs}
                    share={jobTotal > 0 ? 100 - processedShare : 0}
                  />
                </div>
              </div>
            </figure>

            <figure
              className="rounded-xl border border-zinc-100 bg-zinc-50/80 p-4"
              aria-label={`${formatCents(detail.moneyGeneratedCents)} generated, ${formatCents(detail.payoutsCents)} paid out, ${formatCents(keptCents)} still on the platform`}
            >
              <figcaption className="text-sm font-semibold text-zinc-900">Where the money sits</figcaption>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-zinc-200">
                {detail.moneyGeneratedCents > 0 ? (
                  <div className="flex h-full">
                    <div className="h-full bg-violet-500" style={{ width: `${payoutShare}%` }} />
                    <div className="h-full bg-[#0780f7]" style={{ width: `${100 - payoutShare}%` }} />
                  </div>
                ) : null}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="flex items-center gap-2 text-zinc-500">
                    <span className="h-2.5 w-2.5 rounded-full bg-violet-500" />
                    Paid out
                  </p>
                  <p className="mt-1 font-semibold text-zinc-900">{formatCents(detail.payoutsCents)}</p>
                </div>
                <div>
                  <p className="flex items-center gap-2 text-zinc-500">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#0780f7]" />
                    On the platform
                  </p>
                  <p className="mt-1 font-semibold text-zinc-900">{formatCents(keptCents)}</p>
                </div>
              </div>
            </figure>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div>
              <h5 className="text-sm font-semibold text-zinc-900">Recent activity</h5>
              {detail.activity.length === 0 ? (
                <p className="mt-3 rounded-xl border border-dashed border-zinc-200 px-3 py-4 text-sm text-zinc-500">
                  No jobs or notes are tied to this person yet.
                </p>
              ) : (
                <ol className="mt-3 space-y-0">
                  {detail.activity.map((item: TeamActivity, index) => (
                    <li key={item.id} className="relative flex gap-3 pb-3 last:pb-0">
                      {index < detail.activity.length - 1 ? (
                        <span className="absolute left-[7px] top-3 h-full w-px bg-zinc-200" />
                      ) : null}
                      <span className="relative mt-1 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-white bg-[#0780f7] ring-2 ring-[#d7ebff]" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-zinc-800">{item.label}</span>
                        <span className="block text-xs text-zinc-400">{formatWhen(item.when)}</span>
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
            <div>
              <h5 className="text-sm font-semibold text-zinc-900">Suggestions</h5>
              <ul className="mt-3 space-y-2">
                {detail.suggestions
                  .filter((idea) => !(profile.phone && idea.startsWith("Add a phone number")))
                  .map((idea, index) => (
                  <li key={idea} className="flex gap-3 rounded-xl bg-[#f4f8ff] px-3 py-2.5 text-sm leading-5 text-zinc-700">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0780f7] text-[11px] font-bold text-white">
                      {index + 1}
                    </span>
                    <span>{idea}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </>
      ) : null}
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
  fill,
  tone,
}: {
  icon: "check-circle" | "credit-card" | "documents" | "clock";
  label: string;
  value: string;
  fill: number;
  tone: "emerald" | "blue" | "violet" | "amber";
}) {
  const toneClass = {
    emerald: "bg-emerald-50 text-emerald-700",
    blue: "bg-[#e8f3ff] text-[#0560b5]",
    violet: "bg-violet-50 text-violet-700",
    amber: "bg-amber-50 text-amber-700",
  }[tone];
  const barClass = {
    emerald: "bg-emerald-500",
    blue: "bg-[#0780f7]",
    violet: "bg-violet-500",
    amber: "bg-amber-500",
  }[tone];

  return (
    <div className="rounded-xl border border-zinc-100 bg-white px-3 py-3">
      <div className="flex items-center gap-2">
        <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${toneClass}`}>
          <AdminIcon name={icon} size={14} />
        </span>
        <dt className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{label}</dt>
      </div>
      <dd className="mt-2 text-lg font-bold text-zinc-900">{value}</dd>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-100">
        <div className={`h-full rounded-full ${barClass}`} style={{ width: `${Math.max(0, Math.min(100, fill))}%` }} />
      </div>
    </div>
  );
}

function MixRow({
  color,
  label,
  value,
  share,
}: {
  color: string;
  label: string;
  value: number;
  share: number;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 text-zinc-600">
        <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
        <span>{label}</span>
        <span className="ml-auto font-semibold text-zinc-900">{value}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-zinc-200">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max(0, Math.min(100, share))}%` }} />
      </div>
    </div>
  );
}

function isTeamRole(value: string): value is TeamRole {
  return TEAM_ROLES.some((item) => item.id === value);
}

function formatWhen(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function AdminTeamPanel() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamRole>("agent");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [ideasOpen, setIdeasOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    let stop = false;
    async function load() {
      const response = await fetch("/api/admin/team");
      if (!response.ok || stop) return;
      const body = await response.json();
      if (!stop) setMembers(body.members ?? []);
    }
    void load();
    return () => {
      stop = true;
    };
  }, []);

  async function addMember(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, role }),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error ?? "Could not add this team member.");
        return;
      }
      setMembers((current) =>
        [...current, body.member as TeamMember].sort((a, b) => a.name.localeCompare(b.name))
      );
      setName("");
      setEmail("");
      setRole("agent");
    } catch {
      setError("Could not add this team member.");
    } finally {
      setSaving(false);
    }
  }

  async function removeMember(id: string) {
    const response = await fetch(`/api/admin/team?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (!response.ok) return;
    setMembers((current) => current.filter((member) => member.id !== id));
    setSelectedId((current) => (current === id ? null : current));
  }

  const seats = members.length + 1;

  return (
    <div>
      <section className="border-b border-zinc-200 bg-[#f3f6fb] px-6 py-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#0560b5]">
              Team
            </p>
            <h3 className="mt-1 text-xl font-bold tracking-tight text-zinc-900">Roster</h3>
          </div>
          <p className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-zinc-700 shadow-sm ring-1 ring-zinc-200">
            {seats} {seats === 1 ? "seat" : "seats"}
          </p>
        </div>
        <ul className="mt-5 grid gap-3">
          <RosterRow
            name="Master admin"
            detail="This login already has full access."
            initial="A"
            role="admin"
            selected={selectedId === "master"}
            onOpen={() => setSelectedId("master")}
          />
          {members.map((member) => (
            <RosterRow
              key={member.id}
              name={member.name}
              detail={member.email}
              initial={member.name.trim().charAt(0).toUpperCase() || "?"}
              role={member.role}
              selected={selectedId === member.id}
              onOpen={() => setSelectedId(member.id)}
              onRemove={() => void removeMember(member.id)}
            />
          ))}
        </ul>
        {selectedId ? (
          <MemberDetail key={selectedId} id={selectedId} onClose={() => setSelectedId(null)} />
        ) : null}
      </section>

      <div className="space-y-8 p-6">
      <form onSubmit={addMember} className="space-y-4 rounded-lg border border-zinc-200 p-4">
        <h3 className="text-sm font-semibold text-zinc-900">Add a team member</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm text-zinc-700">
            Name
            <input
              className="field mt-1 w-full"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </label>
          <label className="block text-sm text-zinc-700">
            Email
            <input
              className="field mt-1 w-full"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
        </div>
        <fieldset>
          <legend className="text-sm text-zinc-700">Role</legend>
          <div className="mt-2 grid gap-2">
            {TEAM_ROLES.map((item) => (
              <label
                key={item.id}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 ${
                  role === item.id ? "border-blue-300 bg-blue-50" : "border-zinc-200"
                }`}
              >
                <input
                  type="radio"
                  name="team-role"
                  checked={role === item.id}
                  onChange={() => setRole(item.id)}
                />
                <span className="text-sm font-medium text-zinc-900">{item.label}</span>
                <span className="group/tip relative ml-auto inline-flex">
                  <span
                    tabIndex={0}
                    className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-zinc-300 text-[10px] font-semibold leading-none text-zinc-500"
                    aria-label={item.access}
                  >
                    ?
                  </span>
                  <span
                    role="tooltip"
                    className="pointer-events-none absolute top-full right-0 z-10 mt-1.5 hidden w-64 rounded-md bg-zinc-900 px-2.5 py-1.5 text-xs font-normal leading-5 text-white group-hover/tip:block group-focus-within/tip:block"
                  >
                    {item.access}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button type="submit" className="btn text-xs" disabled={saving}>
          {saving ? "Adding…" : "Add team member"}
        </button>
      </form>

      <section className="rounded-lg border border-zinc-200 bg-zinc-50">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
          aria-expanded={ideasOpen}
          onClick={() => setIdeasOpen((open) => !open)}
        >
          <h3 className="text-sm font-semibold text-zinc-900">Ideas for this team</h3>
          <span className={`text-zinc-400 transition ${ideasOpen ? "rotate-180" : ""}`} aria-hidden>
            <AdminIcon name="chevron-down" size={16} />
          </span>
        </button>
        {ideasOpen ? (
          <ul className="list-disc space-y-2 px-4 pb-4 pl-9 text-sm leading-6 text-zinc-600">
            {IDEAS.map((idea) => (
              <li key={idea}>{idea}</li>
            ))}
          </ul>
        ) : null}
      </section>
      </div>
    </div>
  );
}
