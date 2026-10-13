import { VlogLinkModel, VlogVoteModel } from "@/lib/models/vlog";

import type { CommunityLink, CuratedVotes, LinkCategory } from "./community";

/* everyone's links for a book, with their scores and my own votes */
export async function communityFor(book: string, userId: string): Promise<{ links: CommunityLink[]; curated: CuratedVotes }> {
  const [docs, votes] = await Promise.all([
    VlogLinkModel.find({ book }).sort({ createdAt: 1 }).lean(),
    VlogVoteModel.find({ book }, { target: 1, userId: 1, v: 1 }).lean(),
  ]);
  const score = new Map<string, number>(), mine = new Map<string, number>();
  for (const v of votes) {
    score.set(v.target, (score.get(v.target) ?? 0) + v.v);
    if (v.userId === userId) mine.set(v.target, v.v);
  }
  const links: CommunityLink[] = docs.map((d) => {
    const id = String(d._id);
    return {
      id, slot: d.slot ?? "", anchor: d.anchor ?? "", category: d.category as LinkCategory, lang: d.lang ?? "en", kind: d.kind as CommunityLink["kind"],
      url: d.url, videoId: d.videoId || undefined, start: d.start ?? 0, end: d.end ?? 0, title: d.title, note: d.note ?? "", channel: d.channel ?? "",
      by: d.userName || "A trainee", byId: d.userId, at: (d.createdAt ?? new Date()).toISOString(), score: score.get(id) ?? 0, mine: mine.get(id) ?? 0,
    };
  });
  const curated: CuratedVotes = {};
  for (const [target, s] of score) if (target.startsWith("curated:")) curated[target.slice(8)] = { score: s, mine: mine.get(target) ?? 0 };
  for (const [target, m] of mine) if (target.startsWith("curated:") && !curated[target.slice(8)]) curated[target.slice(8)] = { score: 0, mine: m };
  return { links, curated };
}
