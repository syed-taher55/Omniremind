const rank: Record<string, number> = {
  pending: 0,
  paused: 0,
  sending: 1,
  failed: 1,
  sent: 2,
  delivered: 3,
  read: 4,
};

export function nextStatus(current: string, incoming: string): string | null {
  if (current === "read" || current === "failed") return null;
  if (incoming === "failed") {
    if (current === "delivered" || current === "read" || current === "failed") {
      return null;
    }
    return "failed";
  }
  const nextRank = rank[incoming];
  const currentRank = rank[current];
  if (nextRank === undefined || currentRank === undefined) return null;
  if (nextRank <= currentRank) return null;
  return incoming;
}

export function clipError(message: string) {
  return message.replace(/\s+/g, " ").trim().slice(0, 300);
}
