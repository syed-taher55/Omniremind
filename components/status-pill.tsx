const tone: Record<string, string> = {
  pending: "bg-sand text-ink",
  sending: "bg-[#e4ebf5] text-[#1d3d66]",
  paused: "bg-[#f8e4dc] text-clay",
  sent: "bg-[#e5f2ea] text-pine-deep",
  delivered: "bg-[#d7ebdf] text-pine-deep",
  read: "bg-pine text-paper",
  failed: "bg-clay text-paper",
};

export function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs capitalize ${tone[status] ?? "bg-sand text-ink"}`}
    >
      {status}
    </span>
  );
}
