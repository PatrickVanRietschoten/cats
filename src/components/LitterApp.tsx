"use client";
import { useMemo, useState, useTransition } from "react";
import {
  BUILTIN_ACTIVITIES,
  BUILTIN_BY_SLUG,
  CATEGORIES,
  fmtTime,
  fmtDayHeader,
  type Activity,
} from "@/lib/activities";
import {
  addCatAction,
  inviteMemberAction,
  logActivityAction,
  signoutAction,
  updateAppearanceAction,
  createMcpTokenAction,
  revokeMcpTokenAction,
} from "@/app/actions";
import { ActivityIcon } from "./ActivityIcon";
import { CatAvatar } from "./CatAvatar";
import { HighFiveBurst } from "./HighFiveBurst";
import { PawMark } from "./PawMark";
import { LogSheet } from "./LogSheet";

interface CatRow {
  id: string;
  name: string;
  breed: string | null;
  born: string | null;
  weightKg: number | null;
  sex: string | null;
  indoor: boolean;
  color: string;
  photoUrl: string | null;
}

interface LogRow {
  id: string;
  catId: string;
  activitySlug: string;
  happenedAt: string;
  note: string | null;
  data: Record<string, unknown>;
  photoUrl: string | null;
  fileUrl: string | null;
  fileName: string | null;
  createdByLabel: string | null;
}

interface SettingsRow {
  accent: string;
  themeMode: string;
  density: string;
  iconStyle: string;
}

interface McpTokenRow {
  id: string;
  token: string;
  label: string;
  revokedAt: string | null;
  lastUsedAt: string | null;
}

interface MemberRow {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

interface Props {
  currentUser: { id: string; email: string; name: string | null };
  household: { id: string; name: string; role: string };
  cats: CatRow[];
  logs: LogRow[];
  settings: SettingsRow;
  mcpTokens: McpTokenRow[];
  members: MemberRow[];
}

export function LitterApp(props: Props) {
  const { household, cats, logs, settings, mcpTokens, members, currentUser } = props;
  const [activeCatId, setActiveCatId] = useState<string>(cats[0]?.id ?? "");
  const [tab, setTab] = useState<"home" | "history" | "profile" | "settings">("home");
  const [sheetSlug, setSheetSlug] = useState<string | null>(null);
  const [subView, setSubView] = useState<null | "appearance" | "integrations" | "members" | "addcat">(null);
  const [hi5, setHi5] = useState<number | null>(null);
  const [savedToast, setSavedToast] = useState<string | null>(null);
  const [accentLocal, setAccentLocal] = useState(settings.accent);

  const activeCat = cats.find((c) => c.id === activeCatId) ?? cats[0];

  const allActivities: Activity[] = BUILTIN_ACTIVITIES; // custom merged later

  function topActivitiesFor(catId: string, n = 6): string[] {
    const counts: Record<string, number> = {};
    const cutoff = Date.now() - 14 * 24 * 3600 * 1000;
    for (const l of logs) {
      if (l.catId !== catId) continue;
      if (new Date(l.happenedAt).getTime() < cutoff) continue;
      counts[l.activitySlug] = (counts[l.activitySlug] || 0) + 1;
    }
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    if (sorted.length >= n) return sorted.slice(0, n).map(([s]) => s);
    // Fallback for empty/new accounts: surface 6 sensible defaults.
    const defaults = ["poop", "pee", "eat-wet", "eat-dry", "water", "play"];
    const seen = new Set(sorted.map(([s]) => s));
    for (const s of defaults) {
      if (sorted.length >= n) break;
      if (!seen.has(s)) {
        sorted.push([s, 0]);
        seen.add(s);
      }
    }
    return sorted.slice(0, n).map(([s]) => s);
  }

  const themeStyles = useMemo<React.CSSProperties>(
    () => ({ ["--accent" as string]: accentLocal }),
    [accentLocal],
  );

  if (!activeCat) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <p>No cats yet. Add one from settings.</p>
      </div>
    );
  }

  const titleMap = { home: "Today", history: "History", profile: activeCat.name, settings: "Settings" };

  return (
    <div
      style={{
        ...themeStyles,
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg)",
        color: "var(--ink)",
        position: "relative",
        maxWidth: 720,
        margin: "0 auto",
      }}
    >
      {subView === "addcat" ? (
        <AddCatScreen onBack={() => setSubView(null)} />
      ) : subView === "appearance" ? (
        <AppearanceScreen
          current={accentLocal}
          onPick={(v) => setAccentLocal(v)}
          settings={settings}
          onBack={() => setSubView(null)}
        />
      ) : subView === "integrations" ? (
        <IntegrationsScreen
          household={household}
          cats={cats}
          tokens={mcpTokens}
          onBack={() => setSubView(null)}
        />
      ) : subView === "members" ? (
        <MembersScreen
          household={household}
          members={members}
          onBack={() => setSubView(null)}
        />
      ) : (
        <>
          <Header
            title={titleMap[tab]}
            household={household}
            cats={cats}
            activeCatId={activeCat.id}
            onSwitch={setActiveCatId}
            onAddCat={() => setSubView("addcat")}
          />
          <div style={{ flex: 1, overflow: "auto" }}>
            {tab === "home" && (
              <HomeView
                cat={activeCat}
                logs={logs}
                topActivitySlugs={topActivitiesFor(activeCat.id, 6)}
                allActivities={allActivities}
                iconStyle={settings.iconStyle as "shape" | "mono" | "filled" | "emoji"}
                onTile={(slug) => setSheetSlug(slug)}
              />
            )}
            {tab === "history" && (
              <HistoryView
                cats={cats}
                cat={activeCat}
                logs={logs}
                iconStyle={settings.iconStyle as "shape" | "mono" | "filled" | "emoji"}
              />
            )}
            {tab === "profile" && <ProfileView cat={activeCat} logs={logs} />}
            {tab === "settings" && (
              <SettingsView
                household={household}
                user={currentUser}
                memberCount={members.length}
                catCount={cats.length}
                onAppearance={() => setSubView("appearance")}
                onIntegrations={() => setSubView("integrations")}
                onMembers={() => setSubView("members")}
              />
            )}
          </div>
          <TabBar tab={tab} setTab={setTab} />
          {sheetSlug && (
            <LogSheet
              act={BUILTIN_BY_SLUG[sheetSlug]}
              cat={activeCat}
              onClose={() => setSheetSlug(null)}
              onSave={async (entry: { happenedAt?: string; note?: string; data?: Record<string, unknown>; photoUrl?: string; fileUrl?: string; fileName?: string }) => {
                await logActivityAction({
                  catId: activeCat.id,
                  activitySlug: sheetSlug,
                  ...entry,
                });
                setHi5(Date.now());
                setSavedToast(BUILTIN_BY_SLUG[sheetSlug].label);
                setTimeout(() => {
                  setSavedToast(null);
                  setHi5(null);
                }, 1400);
                setSheetSlug(null);
              }}
            />
          )}
          <HighFiveBurst trigger={hi5} color={accentLocal} label={savedToast ? `${savedToast} ✓` : "High five!"} />
        </>
      )}
    </div>
  );
}

function Header({
  title,
  household,
  cats,
  activeCatId,
  onSwitch,
  onAddCat,
}: {
  title: string;
  household: { name: string };
  cats: CatRow[];
  activeCatId: string;
  onSwitch: (id: string) => void;
  onAddCat: () => void;
}) {
  return (
    <div
      style={{
        padding: "14px 18px 10px",
        borderBottom: "1px solid var(--rule-soft)",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        background: "var(--bg)",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 10,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--ink-soft)",
              whiteSpace: "nowrap",
              overflow: "hidden",
            }}
          >
            <PawMark size={12} color="var(--accent)" />
            <span>{household.name}</span>
          </div>
          <div
            style={{
              fontFamily: '"Crimson Pro", Georgia, serif',
              fontSize: 28,
              lineHeight: 1.05,
              fontWeight: 500,
              marginTop: 2,
              whiteSpace: "nowrap",
            }}
          >
            {title}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
          {cats.map((c) => (
            <button
              key={c.id}
              onClick={() => onSwitch(c.id)}
              aria-label={`Switch to ${c.name}`}
              style={{
                appearance: "none",
                border: "none",
                background: "transparent",
                padding: 2,
                cursor: "pointer",
                borderRadius: "50%",
                opacity: c.id === activeCatId ? 1 : 0.45,
              }}
            >
              <CatAvatar cat={c} size={30} ring={c.id === activeCatId} />
            </button>
          ))}
          <button
            onClick={onAddCat}
            aria-label="Add cat"
            style={{
              width: 26,
              height: 26,
              borderRadius: "50%",
              border: "1px dashed var(--rule)",
              background: "transparent",
              color: "var(--ink-soft)",
              fontSize: 14,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
            }}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}

function HomeView({
  cat,
  logs,
  topActivitySlugs,
  allActivities,
  iconStyle,
  onTile,
}: {
  cat: CatRow;
  logs: LogRow[];
  topActivitySlugs: string[];
  allActivities: Activity[];
  iconStyle: "shape" | "mono" | "filled" | "emoji";
  onTile: (slug: string) => void;
}) {
  const recent = logs.filter((l) => l.catId === cat.id).slice(0, 3);
  const byCat: Record<string, Activity[]> = {};
  for (const a of allActivities) (byCat[a.category] = byCat[a.category] || []).push(a);

  return (
    <div style={{ padding: "14px 16px 96px", display: "flex", flexDirection: "column", gap: 22 }}>
      <section>
        <SectionHd kicker="Quick log" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {topActivitySlugs.map((slug) => {
            const a = BUILTIN_BY_SLUG[slug];
            if (!a) return null;
            return <Tile key={slug} act={a} iconStyle={iconStyle} onClick={() => onTile(slug)} prominent />;
          })}
        </div>
      </section>
      {recent.length > 0 && (
        <section>
          <SectionHd kicker="Recent" />
          <div>
            {recent.map((l, i) => (
              <RecentRow key={l.id} log={l} first={i === 0} />
            ))}
          </div>
        </section>
      )}
      {CATEGORIES.map((c) => (
        <section key={c.id}>
          <SectionHd kicker={c.label} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            {(byCat[c.id] || []).map((a) => (
              <Tile key={a.slug} act={a} iconStyle={iconStyle} onClick={() => onTile(a.slug)} small />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function SectionHd({ kicker, hint }: { kicker: string; hint?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10, gap: 8 }}>
      <div style={{ fontFamily: '"Crimson Pro", Georgia, serif', fontSize: 18, fontWeight: 500, whiteSpace: "nowrap" }}>{kicker}</div>
      {hint && (
        <div
          style={{
            fontSize: 11,
            color: "var(--ink-soft)",
            fontStyle: "italic",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            minWidth: 0,
            textAlign: "right",
          }}
        >
          {hint}
        </div>
      )}
    </div>
  );
}

function Tile({
  act,
  iconStyle,
  onClick,
  prominent,
  small,
}: {
  act: Activity;
  iconStyle: "shape" | "mono" | "filled" | "emoji";
  onClick: () => void;
  prominent?: boolean;
  small?: boolean;
}) {
  const h = prominent ? 100 : small ? 72 : 92;
  return (
    <button
      onClick={onClick}
      className="tile-press"
      style={{
        appearance: "none",
        border: "none",
        cursor: "pointer",
        background: prominent ? "var(--paper)" : "transparent",
        borderRadius: 14,
        padding: 10,
        height: h,
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "space-between",
        boxShadow: prominent
          ? "0 1px 2px rgba(0,0,0,.04), 0 6px 18px rgba(0,0,0,.04)"
          : "inset 0 0 0 1px var(--rule-soft)",
        color: "var(--ink)",
        fontSize: 12,
        textAlign: "left",
      }}
    >
      {prominent && (
        <div
          style={{
            position: "absolute",
            right: -6,
            bottom: -6,
            opacity: 0.08,
            transform: "rotate(-12deg)",
            pointerEvents: "none",
          }}
        >
          <PawMark size={42} color="var(--accent)" />
        </div>
      )}
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          background: "var(--accent-soft)",
          color: "var(--accent)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIcon act={act} style={iconStyle} size={26} color="var(--accent)" />
      </div>
      <div style={{ fontWeight: 500, lineHeight: 1.15, position: "relative" }}>{act.label}</div>
    </button>
  );
}

function RecentRow({ log, first }: { log: LogRow; first: boolean }) {
  const a = BUILTIN_BY_SLUG[log.activitySlug];
  if (!a) return null;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 0",
        borderTop: first ? "none" : "1px solid var(--rule-soft)",
      }}
    >
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: 8,
          background: "var(--accent-soft)",
          color: "var(--accent)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <ActivityIcon act={a} style="mono" size={22} color="var(--accent)" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500 }}>{a.label}</div>
        <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>
          {fmtTime(log.happenedAt)} · {log.createdByLabel ?? "—"}
          {log.note ? ` · ${log.note}` : ""}
        </div>
      </div>
    </div>
  );
}

function TabBar({ tab, setTab }: { tab: string; setTab: (t: "home" | "history" | "profile" | "settings") => void }) {
  const items: { id: "home" | "history" | "profile" | "settings"; label: string }[] = [
    { id: "home", label: "Log" },
    { id: "history", label: "History" },
    { id: "profile", label: "Cat" },
    { id: "settings", label: "Settings" },
  ];
  return (
    <div
      style={{
        borderTop: "1px solid var(--rule-soft)",
        display: "flex",
        justifyContent: "space-around",
        padding: "8px 8px 24px",
        background: "var(--bg)",
        position: "sticky",
        bottom: 0,
      }}
    >
      {items.map((it) => (
        <button
          key={it.id}
          onClick={() => setTab(it.id)}
          style={{
            appearance: "none",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            padding: "6px 10px",
            color: tab === it.id ? "var(--ink)" : "var(--ink-soft)",
            fontSize: 12,
            fontWeight: tab === it.id ? 600 : 400,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
          }}
        >
          <div
            style={{
              width: 4,
              height: 4,
              borderRadius: "50%",
              background: tab === it.id ? "var(--accent)" : "transparent",
            }}
          />
          {it.label}
        </button>
      ))}
    </div>
  );
}

function HistoryView({
  cats,
  cat,
  logs,
  iconStyle,
}: {
  cats: CatRow[];
  cat: CatRow;
  logs: LogRow[];
  iconStyle: "shape" | "mono" | "filled" | "emoji";
}) {
  const [view, setView] = useState<"feed" | "calendar" | "by-act" | "charts">("feed");
  const [scope, setScope] = useState<"cat" | "all">("cat");
  const filtered = scope === "cat" ? logs.filter((l) => l.catId === cat.id) : logs;
  const groups = groupByDay(filtered);

  return (
    <div style={{ padding: "14px 16px 96px" }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        <Chip active={scope === "cat"} onClick={() => setScope("cat")}>
          {cat.name}
        </Chip>
        <Chip active={scope === "all"} onClick={() => setScope("all")}>
          All cats
        </Chip>
      </div>
      <div
        style={{
          display: "flex",
          gap: 4,
          padding: 4,
          borderRadius: 10,
          background: "var(--paper)",
          marginBottom: 16,
          boxShadow: "inset 0 0 0 1px var(--rule-soft)",
        }}
      >
        {(
          [
            ["feed", "Feed"],
            ["calendar", "Calendar"],
            ["by-act", "By activity"],
            ["charts", "Charts"],
          ] as const
        ).map(([k, l]) => (
          <button
            key={k}
            onClick={() => setView(k)}
            style={{
              flex: 1,
              padding: "7px 0",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              background: view === k ? "var(--bg)" : "transparent",
              color: view === k ? "var(--ink)" : "var(--ink-soft)",
              fontSize: 12,
              fontWeight: view === k ? 600 : 400,
              boxShadow: view === k ? "0 1px 2px rgba(0,0,0,.05)" : "none",
            }}
          >
            {l}
          </button>
        ))}
      </div>

      {view === "feed" && (
        <>
          {groups.length === 0 && (
            <p style={{ color: "var(--ink-soft)", textAlign: "center", padding: "40px 0" }}>
              No logs yet. Tap a tile from Log to start.
            </p>
          )}
          {groups.map((g) => (
            <div key={g.key} style={{ marginBottom: 22 }}>
              <div style={{ fontFamily: '"Crimson Pro", Georgia, serif', fontSize: 16, fontWeight: 500, marginBottom: 8 }}>
                {fmtDayHeader(g.sample)}
              </div>
              <div
                style={{
                  background: "var(--paper)",
                  borderRadius: 14,
                  overflow: "hidden",
                  boxShadow: "inset 0 0 0 1px var(--rule-soft)",
                }}
              >
                {g.items.map((l, i) => (
                  <FeedRow key={l.id} log={l} cats={cats} first={i === 0} scope={scope} />
                ))}
              </div>
            </div>
          ))}
        </>
      )}
      {view === "calendar" && <CalendarView logs={filtered} />}
      {view === "by-act" && <ByActivityView logs={filtered} iconStyle={iconStyle} />}
      {view === "charts" && <ChartsView logs={filtered} />}
    </div>
  );
}

function FeedRow({ log, cats, first, scope }: { log: LogRow; cats: CatRow[]; first: boolean; scope: "cat" | "all" }) {
  const a = BUILTIN_BY_SLUG[log.activitySlug];
  if (!a) return null;
  const c = cats.find((x) => x.id === log.catId);
  const detail: string[] = [];
  const d = log.data || {};
  if (d.amount) detail.push(String(d.amount));
  if (d.consistency != null) detail.push(`c${d.consistency}`);
  if (d.grams) detail.push(`${d.grams}g`);
  if (d.kg) detail.push(`${d.kg}kg`);
  if (d.minutes) detail.push(`${d.minutes}m`);
  if (d.location) detail.push(String(d.location));
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 14px",
        borderTop: first ? "none" : "1px solid var(--rule-soft)",
      }}
    >
      {scope === "all" && c && <CatAvatar cat={c} size={26} />}
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 9,
          background: "var(--accent-soft)",
          color: "var(--accent)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <ActivityIcon act={a} style="mono" size={24} color="var(--accent)" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500 }}>{a.label}</div>
        <div style={{ fontSize: 11, color: "var(--ink-soft)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {detail.join(" · ")}
          {log.note ? ` — ${log.note}` : ""}
        </div>
      </div>
      <div
        style={{
          textAlign: "right",
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 11,
          color: "var(--ink-soft)",
          flexShrink: 0,
        }}
      >
        <div>{fmtTime(log.happenedAt).split(" ").pop()}</div>
        <div style={{ marginTop: 2 }}>{log.createdByLabel ?? ""}</div>
      </div>
      {(log.photoUrl || log.fileUrl) && (
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            border: "1px solid var(--rule)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            color: "var(--ink-soft)",
          }}
        >
          {log.fileUrl ? "📎" : "📷"}
        </div>
      )}
    </div>
  );
}

function CalendarView({ logs }: { logs: LogRow[] }) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const first = new Date(y, m, 1);
  const startOff = (first.getDay() + 6) % 7;
  const daysIn = new Date(y, m + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startOff; i++) cells.push(null);
  for (let d = 1; d <= daysIn; d++) cells.push(d);

  const dotsByDay: Record<number, Set<string>> = {};
  for (const l of logs) {
    const d = new Date(l.happenedAt);
    if (d.getMonth() !== m || d.getFullYear() !== y) continue;
    const k = d.getDate();
    const set = (dotsByDay[k] = dotsByDay[k] || new Set());
    const a = BUILTIN_BY_SLUG[l.activitySlug];
    if (a) set.add(a.category);
  }
  const catColor: Record<string, string> = {
    litter: "var(--warn)",
    vomit: "var(--bad)",
    food: "var(--good)",
    health: "var(--accent)",
    groom: "var(--ink-soft)",
    play: "oklch(60% 0.12 280)",
    mood: "oklch(60% 0.12 320)",
  };

  return (
    <div>
      <div style={{ fontFamily: '"Crimson Pro", Georgia, serif', fontSize: 18, marginBottom: 12 }}>
        {now.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 6 }}>
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <div key={i} style={{ textAlign: "center", fontSize: 10, color: "var(--ink-soft)" }}>{d}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
        {cells.map((d, i) => (
          <div
            key={i}
            style={{
              aspectRatio: "1",
              borderRadius: 8,
              background: d ? "var(--paper)" : "transparent",
              boxShadow: d ? "inset 0 0 0 1px var(--rule-soft)" : "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              padding: 4,
            }}
          >
            {d && <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11 }}>{d}</div>}
            {d && dotsByDay[d] && (
              <div style={{ display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "center" }}>
                {[...dotsByDay[d]].slice(0, 4).map((c) => (
                  <div key={c} style={{ width: 4, height: 4, borderRadius: "50%", background: catColor[c] }} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ByActivityView({ logs, iconStyle }: { logs: LogRow[]; iconStyle: "shape" | "mono" | "filled" | "emoji" }) {
  const counts: Record<string, number> = {};
  for (const l of logs) counts[l.activitySlug] = (counts[l.activitySlug] || 0) + 1;
  const rows = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const max = Math.max(...rows.map((r) => r[1]), 1);
  if (rows.length === 0) {
    return <p style={{ color: "var(--ink-soft)", textAlign: "center", padding: "40px 0" }}>No data yet.</p>;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {rows.map(([slug, n]) => {
        const a = BUILTIN_BY_SLUG[slug];
        if (!a) return null;
        return (
          <div key={slug} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0" }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: "var(--accent-soft)",
                color: "var(--accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ActivityIcon act={a} style={iconStyle} size={20} color="var(--accent)" />
            </div>
            <div style={{ flex: 1, fontSize: 13 }}>{a.label}</div>
            <div style={{ flex: 2, height: 6, borderRadius: 3, background: "var(--rule-soft)", overflow: "hidden" }}>
              <div style={{ width: `${(n / max) * 100}%`, height: "100%", background: "var(--accent)" }} />
            </div>
            <div style={{ width: 24, textAlign: "right", fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: "var(--ink-soft)" }}>{n}</div>
          </div>
        );
      })}
    </div>
  );
}

function ChartsView({ logs }: { logs: LogRow[] }) {
  const days: { label: string; key: string; n: number }[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push({ label: d.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 2), key: d.toDateString(), n: 0 });
  }
  const dayMap = Object.fromEntries(days.map((d) => [d.key, d]));
  for (const l of logs) {
    if (l.activitySlug !== "poop") continue;
    const k = new Date(l.happenedAt).toDateString();
    if (dayMap[k]) dayMap[k].n++;
  }
  const max = Math.max(...days.map((d) => d.n), 2);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <div style={{ fontFamily: '"Crimson Pro", Georgia, serif', fontSize: 16, marginBottom: 8 }}>Poops · last 7 days</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 80, padding: "8px 0" }}>
          {days.map((d) => (
            <div key={d.key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div
                style={{
                  width: "100%",
                  height: `${(d.n / max) * 70 + 2}px`,
                  background: "var(--accent)",
                  borderRadius: 4,
                }}
              />
              <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: "var(--ink-soft)" }}>{d.label}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ fontSize: 12, color: "var(--ink-soft)", fontStyle: "italic" }}>
        Charts are descriptive, not predictive. No inference, by design.
      </div>
    </div>
  );
}

function ProfileView({ cat, logs }: { cat: CatRow; logs: LogRow[] }) {
  const today = logs.filter(
    (l) => l.catId === cat.id && new Date(l.happenedAt).toDateString() === new Date().toDateString(),
  );
  return (
    <div style={{ padding: "20px 16px 96px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
        <CatAvatar cat={cat} size={64} />
        <div>
          <div style={{ fontFamily: '"Crimson Pro", Georgia, serif', fontSize: 26, fontWeight: 500, lineHeight: 1.1 }}>{cat.name}</div>
          <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
            {cat.breed ?? "—"} · {cat.indoor ? "indoor" : "indoor/outdoor"}
          </div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 18 }}>
        <Stat label="Weight" value={cat.weightKg ? `${cat.weightKg} kg` : "—"} />
        <Stat label="Born" value={cat.born ? new Date(cat.born).toLocaleDateString(undefined, { month: "short", year: "numeric" }) : "—"} />
        <Stat label="Today" value={`${today.length}`} unit="logs" />
      </div>
    </div>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div style={{ background: "var(--paper)", padding: 12, borderRadius: 12, boxShadow: "inset 0 0 0 1px var(--rule-soft)" }}>
      <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-soft)" }}>{label}</div>
      <div style={{ fontFamily: '"Crimson Pro", Georgia, serif', fontSize: 22, fontWeight: 500, marginTop: 2 }}>
        {value}
        {unit && <span style={{ fontSize: 11, color: "var(--ink-soft)", marginLeft: 4 }}>{unit}</span>}
      </div>
    </div>
  );
}

function SettingsView({
  household,
  user,
  memberCount,
  catCount,
  onAppearance,
  onIntegrations,
  onMembers,
}: {
  household: { name: string };
  user: { email: string; name: string | null };
  memberCount: number;
  catCount: number;
  onAppearance: () => void;
  onIntegrations: () => void;
  onMembers: () => void;
}) {
  const groups: { label: string; items: [string, string, (() => void) | null][] }[] = [
    {
      label: "Household",
      items: [
        [`Members (${memberCount})`, "→", onMembers],
        [`Cats (${catCount})`, "→", null],
      ],
    },
    {
      label: "Preferences",
      items: [["Appearance", "→", onAppearance]],
    },
    {
      label: "Advanced",
      items: [["Integrations · MCP", "→", onIntegrations]],
    },
    {
      label: "Account",
      items: [
        [user.email, "", null],
        ["Sign out", "→", () => signoutAction()],
      ],
    },
  ];
  return (
    <div style={{ padding: "14px 16px 96px" }}>
      <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-soft)", paddingLeft: 4, marginBottom: 6 }}>
        Household name
      </div>
      <div style={{ background: "var(--paper)", borderRadius: 12, padding: 14, marginBottom: 18, boxShadow: "inset 0 0 0 1px var(--rule-soft)" }}>
        <div style={{ fontWeight: 500, fontSize: 16 }}>{household.name}</div>
      </div>
      {groups.map((g) => (
        <div key={g.label} style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-soft)", marginBottom: 6, paddingLeft: 4 }}>{g.label}</div>
          <div style={{ background: "var(--paper)", borderRadius: 12, overflow: "hidden", boxShadow: "inset 0 0 0 1px var(--rule-soft)" }}>
            {g.items.map(([label, hint, onClick], i) => (
              <button
                key={label}
                onClick={onClick ?? undefined}
                disabled={!onClick}
                style={{
                  appearance: "none",
                  width: "100%",
                  cursor: onClick ? "pointer" : "default",
                  padding: "14px 14px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "transparent",
                  border: "none",
                  borderTop: i === 0 ? "none" : "1px solid var(--rule-soft)",
                  color: "var(--ink)",
                  fontSize: 14,
                  textAlign: "left",
                }}
              >
                <span>{label}</span>
                <span style={{ color: "var(--ink-soft)", fontSize: 13 }}>{hint}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function AppearanceScreen({
  current,
  onPick,
  settings,
  onBack,
}: {
  current: string;
  onPick: (hex: string) => void;
  settings: SettingsRow;
  onBack: () => void;
}) {
  const PRESETS = [
    { name: "Cocoa", hex: "#5f4b21" },
    { name: "Clay", hex: "#c96442" },
    { name: "Peach", hex: "#f0a285" },
    { name: "Rose", hex: "#e8a3b4" },
    { name: "Lilac", hex: "#b9a7d8" },
    { name: "Sky", hex: "#9dc3e6" },
    { name: "Mint", hex: "#a8d4be" },
    { name: "Butter", hex: "#e9d49a" },
    { name: "Sage", hex: "#bdc9a4" },
  ];
  const [pending, start] = useTransition();

  function save(hex: string) {
    onPick(hex);
    start(async () => {
      const fd = new FormData();
      fd.set("accent", hex);
      fd.set("themeMode", settings.themeMode);
      fd.set("iconStyle", settings.iconStyle);
      fd.set("density", settings.density);
      await updateAppearanceAction(fd);
    });
  }

  return (
    <SubScreen title="Appearance" onBack={onBack}>
      <p style={{ fontSize: 13, color: "var(--ink-dim)", lineHeight: 1.5, marginBottom: 22 }}>
        Pick an accent color. Used on tabs, highlights, and the household paw mark.
      </p>
      <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-soft)", marginBottom: 10 }}>
        Presets
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {PRESETS.map((p) => {
          const on = p.hex.toLowerCase() === current.toLowerCase();
          return (
            <button
              key={p.hex}
              onClick={() => save(p.hex)}
              disabled={pending}
              style={{
                appearance: "none",
                border: "none",
                background: "var(--paper)",
                borderRadius: 14,
                padding: "12px 10px 10px",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
                boxShadow: on ? `inset 0 0 0 2px ${p.hex}` : "inset 0 0 0 1px var(--rule-soft)",
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: p.hex,
                  position: "relative",
                  boxShadow: on ? `0 0 0 3px var(--paper), 0 0 0 5px ${p.hex}` : "none",
                }}
              >
                {on && (
                  <svg viewBox="0 0 24 24" width="22" height="22" style={{ position: "absolute", inset: 0, margin: "auto" }}>
                    <path
                      d="M5 12.5 L10 17.5 L19 7.5"
                      fill="none"
                      stroke="#fff"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
              <div style={{ fontSize: 12 }}>{p.name}</div>
            </button>
          );
        })}
      </div>
    </SubScreen>
  );
}

function IntegrationsScreen({
  household,
  cats,
  tokens,
  onBack,
}: {
  household: { id: string; name: string };
  cats: CatRow[];
  tokens: McpTokenRow[];
  onBack: () => void;
}) {
  const live = tokens.find((t) => !t.revokedAt);
  const [copied, setCopied] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const baseUrl = typeof window !== "undefined" ? `${window.location.origin}/mcp/${household.id}` : `/mcp/${household.id}`;
  const tokenStr = live ? `?token=${live.token}` : "?token=YOUR_TOKEN";

  function copy(key: string, text: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopied(key);
    setTimeout(() => setCopied(null), 1600);
  }

  return (
    <SubScreen title="MCP endpoint" onBack={onBack}>
      <p style={{ fontSize: 13, color: "var(--ink-dim)", lineHeight: 1.5, marginBottom: 18 }}>
        Connect any AI assistant that speaks MCP to your cat data. Tokens grant
        read + write. Revoke any time.
      </p>

      {!live && (
        <button
          onClick={() => start(async () => { await createMcpTokenAction(); window.location.reload(); })}
          disabled={pending}
          style={{
            width: "100%",
            padding: 14,
            borderRadius: 12,
            border: "none",
            background: "var(--accent)",
            color: "#fff",
            fontWeight: 600,
            fontSize: 14,
            cursor: "pointer",
            marginBottom: 16,
          }}
        >
          {pending ? "Creating…" : "Create MCP token"}
        </button>
      )}

      {live && (
        <div style={{ marginBottom: 16 }}>
          <button
            onClick={() => copy("all", baseUrl + tokenStr)}
            style={{
              width: "100%",
              padding: 14,
              borderRadius: 12,
              border: "none",
              background: "var(--accent)",
              color: "#fff",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            {copied === "all" ? "✓ Copied" : "Copy all-cats endpoint"}
          </button>
          <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: "var(--ink-soft)", marginTop: 8, wordBreak: "break-all" }}>
            {baseUrl}
            {tokenStr}
          </div>
        </div>
      )}

      {live && cats.length > 0 && (
        <>
          <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-soft)", marginBottom: 8 }}>Per cat</div>
          <div style={{ background: "var(--paper)", borderRadius: 12, boxShadow: "inset 0 0 0 1px var(--rule-soft)", marginBottom: 18 }}>
            {cats.map((c, i) => (
              <div
                key={c.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: 12,
                  borderTop: i === 0 ? "none" : "1px solid var(--rule-soft)",
                }}
              >
                <CatAvatar cat={c} size={28} />
                <div style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{c.name}</div>
                <button
                  onClick={() => copy(c.id, `${baseUrl}/${c.id}${tokenStr}`)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--accent)",
                    background: "transparent",
                    color: "var(--accent)",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                >
                  {copied === c.id ? "✓ Copied" : "Copy"}
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {live && (
        <>
          <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-soft)", marginBottom: 8 }}>Token</div>
          <div style={{ background: "var(--paper)", borderRadius: 12, padding: 14, boxShadow: "inset 0 0 0 1px var(--rule-soft)", display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: "var(--ink-dim)", wordBreak: "break-all" }}>{live.token}</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => start(async () => {
                  await revokeMcpTokenAction(live.id);
                  await createMcpTokenAction();
                  window.location.reload();
                })}
                style={btnSecondary("var(--rule)")}
              >
                Regenerate
              </button>
              <button
                onClick={() => start(async () => {
                  await revokeMcpTokenAction(live.id);
                  window.location.reload();
                })}
                style={btnSecondary("var(--bad)", "var(--bad)")}
              >
                Revoke
              </button>
            </div>
          </div>
        </>
      )}

      <div style={{ marginTop: 18, padding: 14, borderRadius: 12, background: "var(--accent-soft)" }}>
        <div style={{ fontFamily: '"Crimson Pro", Georgia, serif', fontSize: 14, fontWeight: 500, marginBottom: 4, color: "var(--accent)" }}>
          What is MCP?
        </div>
        <div style={{ fontSize: 12, lineHeight: 1.5 }}>
          Model Context Protocol — a standard way for AI assistants to read external data. Paste this URL into any MCP-compatible client to query and add cat logs. We never run inference inside the app.
        </div>
      </div>
    </SubScreen>
  );
}

function btnSecondary(borderColor: string, color = "var(--ink)"): React.CSSProperties {
  return {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    border: `1px solid ${borderColor}`,
    background: "transparent",
    color,
    cursor: "pointer",
    fontSize: 12,
  };
}

function MembersScreen({ household, members, onBack }: { household: { name: string }; members: MemberRow[]; onBack: () => void }) {
  const [pending, start] = useTransition();
  return (
    <SubScreen title={`${household.name} · members`} onBack={onBack}>
      <div style={{ background: "var(--paper)", borderRadius: 12, marginBottom: 18, boxShadow: "inset 0 0 0 1px var(--rule-soft)" }}>
        {members.map((m, i) => (
          <div
            key={m.id}
            style={{
              padding: 14,
              borderTop: i === 0 ? "none" : "1px solid var(--rule-soft)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 14,
            }}
          >
            <div>
              <div style={{ fontWeight: 500 }}>{m.name ?? m.email}</div>
              <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>{m.email}</div>
            </div>
            <span style={{ fontSize: 11, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{m.role}</span>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-soft)", marginBottom: 8 }}>Invite</div>
      <form
        action={(fd) => start(async () => { await inviteMemberAction(fd); window.location.reload(); })}
        style={{ display: "flex", gap: 8 }}
      >
        <input
          name="email"
          type="email"
          required
          placeholder="partner@example.com"
          style={{
            flex: 1,
            padding: "12px 14px",
            borderRadius: 10,
            border: "1px solid var(--rule)",
            background: "var(--bg)",
            color: "var(--ink)",
            fontSize: 14,
            outline: "none",
          }}
        />
        <button
          type="submit"
          disabled={pending}
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            border: "none",
            background: "var(--accent)",
            color: "#fff",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {pending ? "…" : "Send"}
        </button>
      </form>
    </SubScreen>
  );
}

function AddCatScreen({ onBack }: { onBack: () => void }) {
  const [pending, start] = useTransition();
  return (
    <SubScreen title="Add cat" onBack={onBack}>
      <form
        action={(fd) => start(async () => { await addCatAction(fd); window.location.reload(); })}
        style={{ display: "flex", flexDirection: "column", gap: 10 }}
      >
        <input name="name" required placeholder="Name" style={inputStyle} />
        <input name="breed" placeholder="Breed" style={inputStyle} />
        <div style={{ display: "flex", gap: 8 }}>
          <input name="born" type="date" placeholder="Born" style={inputStyle} />
          <input name="weightKg" inputMode="decimal" placeholder="Weight (kg)" style={inputStyle} />
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select name="sex" style={inputStyle} defaultValue="">
            <option value="">Sex (optional)</option>
            <option value="M">Male</option>
            <option value="F">Female</option>
          </select>
          <label style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, padding: 12, border: "1px solid var(--rule)", borderRadius: 10, fontSize: 14 }}>
            <input type="checkbox" name="indoor" defaultChecked /> Indoor
          </label>
        </div>
        <button
          type="submit"
          disabled={pending}
          style={{
            padding: 14,
            borderRadius: 12,
            border: "none",
            background: "var(--accent)",
            color: "#fff",
            fontWeight: 600,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          {pending ? "Saving…" : "Add cat"}
        </button>
      </form>
    </SubScreen>
  );
}

const inputStyle: React.CSSProperties = {
  flex: 1,
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid var(--rule)",
  background: "var(--bg)",
  color: "var(--ink)",
  fontSize: 14,
  outline: "none",
};

function SubScreen({ title, onBack, children }: { title: string; onBack: () => void; children: React.ReactNode }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "100dvh" }}>
      <div style={{ padding: "14px 18px 8px", display: "flex", alignItems: "center", borderBottom: "1px solid var(--rule-soft)" }}>
        <button
          onClick={onBack}
          style={{
            appearance: "none",
            border: "none",
            background: "transparent",
            color: "var(--accent)",
            cursor: "pointer",
            fontSize: 14,
            padding: 0,
          }}
        >
          ‹ Back
        </button>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: "18px 18px 60px" }}>
        <div style={{ fontFamily: '"Crimson Pro", Georgia, serif', fontSize: 28, fontWeight: 500, marginBottom: 12 }}>{title}</div>
        {children}
      </div>
    </div>
  );
}

function Chip({ active, children, onClick }: { active?: boolean; children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        appearance: "none",
        cursor: "pointer",
        padding: "6px 10px",
        borderRadius: 999,
        border: `1px solid ${active ? "var(--accent)" : "var(--rule)"}`,
        background: active ? "var(--accent-soft)" : "transparent",
        color: active ? "var(--accent)" : "var(--ink)",
        fontSize: 12,
      }}
    >
      {children}
    </button>
  );
}

function groupByDay(logs: LogRow[]): { key: string; sample: string; items: LogRow[] }[] {
  const sorted = [...logs].sort((a, b) => new Date(b.happenedAt).getTime() - new Date(a.happenedAt).getTime());
  const map = new Map<string, LogRow[]>();
  for (const l of sorted) {
    const k = new Date(l.happenedAt).toDateString();
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(l);
  }
  return [...map.entries()].map(([key, items]) => ({ key, sample: items[0].happenedAt, items }));
}
