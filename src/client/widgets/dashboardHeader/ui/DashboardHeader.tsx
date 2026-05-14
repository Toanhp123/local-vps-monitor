import { Activity, RefreshCw, Search } from "lucide-react";
import type { RealtimeStatus } from "../../../shared/api/realtime";

const realtimeText: Record<RealtimeStatus, string> = {
  connecting: "Connecting",
  live: "Live",
  reconnecting: "Reconnecting",
  fallback: "Polling fallback"
};

const realtimeClasses: Record<RealtimeStatus, string> = {
  connecting: "border-blue-200 bg-blue-50 text-blue-700",
  live: "border-green-200 bg-green-100 text-green-800",
  reconnecting: "border-blue-200 bg-blue-50 text-blue-700",
  fallback: "border-amber-200 bg-amber-100 text-amber-800"
};

export function DashboardHeader({
  query,
  realtimeStatus,
  onQueryChange,
  onRefresh
}: {
  query: string;
  realtimeStatus: RealtimeStatus;
  onQueryChange: (query: string) => void;
  onRefresh: () => void;
}) {
  return (
    <header className="mb-[22px] flex items-end justify-between gap-5 max-md:flex-col max-md:items-stretch">
      <div>
        <div className="mb-2 flex items-center gap-2 text-sm font-extrabold text-blue-600">
          <Activity size={16} />
          VPS Monitor
        </div>
        <h1 className="text-[34px] leading-tight font-extrabold text-slate-900 max-md:text-[28px]">Application Health</h1>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2.5 max-md:w-full">
        <label className="flex h-10 min-w-[290px] items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 max-md:w-full">
          <Search size={16} />
          <input
            className="w-full min-w-0 border-0 text-slate-900 outline-0"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search server, app, runtime"
          />
        </label>
        <button
          type="button"
          className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-slate-900 bg-slate-900 px-3.5 font-bold text-white hover:bg-slate-700"
          onClick={onRefresh}
          aria-label="Refresh dashboard"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
        <span
          className={`inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 text-[13px] font-extrabold ${realtimeClasses[realtimeStatus]}`}
        >
          <Activity size={14} />
          {realtimeText[realtimeStatus]}
        </span>
      </div>
    </header>
  );
}
