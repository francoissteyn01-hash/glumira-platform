import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { DISCLAIMER } from "@/lib/constants";

/* ─── Types ─────────────────────────────────────────────────────────────── */

interface PeerGroup {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  joined: boolean;
}

interface Post {
  id: string;
  groupId: string;
  authorInitials: string;
  authorColour: string;
  displayName: string;
  text: string;
  category: PostCategory;
  anonymous: boolean;
  likes: number;
  replies: number;
  createdAt: string;
  mine: boolean;
}

interface SharedPattern {
  id: string;
  text: string;
  upvotes: number;
}

interface CommunityStats {
  totalMembers: number;
  postsThisWeek: number;
  mostActiveGroup: string;
}

type PostCategory = "pattern" | "question" | "tip" | "experience";
type Tab = "groups" | "feed" | "patterns" | "my-posts";

/* ─── Placeholder data ──────────────────────────────────────────────────── */

const GROUPS: PeerGroup[] = [
  { id: "g1",  name: "Parents of T1D Children (0-5)",  description: "Support for parents managing type 1 diabetes in infants and toddlers.",       memberCount: 842,  joined: false },
  { id: "g2",  name: "Parents of T1D Children (5-12)", description: "Navigating school years, sports, and social events with T1D.",              memberCount: 1_204, joined: false },
  { id: "g3",  name: "Teen T1D Support (13-18)",       description: "Peer support for teens balancing diabetes with adolescent life.",              memberCount: 967,  joined: false },
  { id: "g4",  name: "Adult T1D Management",           description: "Day-to-day management strategies, workplace tips, and lifestyle balance.",    memberCount: 2_381, joined: false },
  { id: "g5",  name: "Newly Diagnosed",                description: "A welcoming space for those in the first year after diagnosis.",               memberCount: 1_573, joined: false },
  { id: "g6",  name: "Pregnancy & T1D",                description: "Pre-conception planning, gestational management, and postpartum support.",    memberCount: 614,  joined: false },
  { id: "g7",  name: "Sports & T1D",                   description: "Fuelling strategies, hypo prevention, and performance optimisation.",         memberCount: 738,  joined: false },
  { id: "g8",  name: "Tech & CGM Users",               description: "CGM tips, pump troubleshooting, DIY loops, and sensor accuracy.",             memberCount: 1_892, joined: false },
  { id: "g9",  name: "Ramadan & T1D",                  description: "Fasting safely during Ramadan — meal timing, basal adjustments, and more.",  memberCount: 421,  joined: false },
  { id: "g10", name: "Low-Carb T1D Community",         description: "Sharing low-carb recipes, research, and glucose impact observations.",        memberCount: 1_035, joined: false },
];

const SEED_POSTS: Post[] = [
  { id: "p1", groupId: "g4", authorInitials: "AK", authorColour: "#6c5ce7", displayName: "Member_4821", text: "Has anyone else noticed their basal needs increasing in winter? I seem to need about 15 % more from November through February.", category: "question", anonymous: true, likes: 23, replies: 8, createdAt: "2026-04-07T14:22:00Z", mine: false },
  { id: "p2", groupId: "g4", authorInitials: "RM", authorColour: "#e17055", displayName: "Member_1193", text: "Tip: Pre-bolusing 20 min before meals dropped my post-meal spike by roughly 2 mmol/L. Took a few weeks to get the timing right.", category: "tip", anonymous: true, likes: 47, replies: 12, createdAt: "2026-04-06T09:10:00Z", mine: false },
  { id: "p3", groupId: "g4", authorInitials: "JL", authorColour: "#00b894", displayName: "Member_7740", text: "Pattern: My glucose stays much flatter when I walk for 10 minutes immediately after eating. Consistent over 30 days of data.", category: "pattern", anonymous: true, likes: 61, replies: 15, createdAt: "2026-04-05T18:45:00Z", mine: false },
];

const SEED_PATTERNS: SharedPattern[] = [
  { id: "sp1", text: "Community member noticed: Consistent morning rises after 06:00 — discussed with endo, adjusted basal timing.", upvotes: 134 },
  { id: "sp2", text: "Community member shares: Swimming 3x/week reduced average glucose by 0.8 mmol/L.", upvotes: 97 },
  { id: "sp3", text: "Community member noticed: Stress-related spikes correlated with work deadlines — mindfulness sessions helped stabilise readings.", upvotes: 82 },
  { id: "sp4", text: "Community member shares: Switching from rapid-acting insulin 10 min pre-meal to 20 min reduced post-meal peak by 1.5 mmol/L.", upvotes: 71 },
  { id: "sp5", text: "Community member noticed: Menstrual cycle phase 3 (luteal) consistently increases insulin resistance by ~20 %.", upvotes: 64 },
];

const INITIAL_STATS: CommunityStats = { totalMembers: 10_667, postsThisWeek: 284, mostActiveGroup: "Adult T1D Management" };

const CATEGORY_LABELS: Record<PostCategory, string> = { pattern: "Pattern Observation", question: "Question", tip: "Tip", experience: "Experience" };
const CATEGORY_COLOURS: Record<PostCategory, string> = { pattern: "var(--accent-teal)", question: "#a29bfe", tip: "#fdcb6e", experience: "#fab1a0" };

/* ─── Helpers ───────────────────────────────────────────────────────────── */

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

async function trpcFetch<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`/trpc/${path}`);
    if (!res.ok) return fallback;
    const json = await res.json();
    return (json.result?.data ?? json.data ?? json) as T;
  } catch {
    return fallback;
  }
}

/* ─── Component ─────────────────────────────────────────────────────────── */

export default function CommunityPage() {
  const { user } = useAuth();

  /* State */
  const [tab, setTab] = useState<Tab>("groups");
  const [groups, setGroups] = useState<PeerGroup[]>(GROUPS);
  const [selectedGroup, setSelectedGroup] = useState<PeerGroup | null>(null);
  const [posts, setPosts] = useState<Post[]>(SEED_POSTS);
  const [patterns, setPatterns] = useState<SharedPattern[]>(SEED_PATTERNS);
  const [stats, setStats] = useState<CommunityStats>(INITIAL_STATS);
  const [showPostForm, setShowPostForm] = useState(false);
  const [postText, setPostText] = useState("");
  const [postCategory, setPostCategory] = useState<PostCategory>("pattern");
  const [postAnonymous, setPostAnonymous] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  /* Fetch remote data (gracefully falls back to placeholders) */
  useEffect(() => {
    trpcFetch<PeerGroup[]>("community.groups", GROUPS).then(setGroups);
    trpcFetch<SharedPattern[]>("community.patterns", SEED_PATTERNS).then(setPatterns);
    trpcFetch<CommunityStats>("community.stats", INITIAL_STATS).then(setStats);
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      trpcFetch<Post[]>(`community.posts?groupId=${selectedGroup.id}`, SEED_POSTS.filter(p => p.groupId === selectedGroup.id)).then(setPosts);
    }
  }, [selectedGroup]);

  /* Handlers */
  function handleJoin(groupId: string) {
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, joined: !g.joined, memberCount: g.joined ? g.memberCount - 1 : g.memberCount + 1 } : g));
  }

  function handleSelectGroup(group: PeerGroup) {
    setSelectedGroup(group);
    setTab("feed");
  }

  async function handleSubmitPost() {
    if (!postText.trim() || submitting) return;
    setSubmitting(true);
    const newPost: Post = {
      id: `p-${Date.now()}`,
      groupId: selectedGroup?.id ?? "g4",
      authorInitials: user?.email?.slice(0, 2).toUpperCase() ?? "ME",
      authorColour: "#2ab5c1",
      displayName: postAnonymous ? `Member_${Math.floor(Math.random() * 9000 + 1000)}` : (user?.email?.split("@")[0] ?? "You"),
      text: postText.trim(),
      category: postCategory,
      anonymous: postAnonymous,
      likes: 0,
      replies: 0,
      createdAt: new Date().toISOString(),
      mine: true,
    };
    try {
      await fetch("/trpc/community.createPost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newPost.text, category: newPost.category, anonymous: newPost.anonymous, groupId: newPost.groupId }),
      });
    } catch { /* graceful — post still shown locally */ }
    setPosts(prev => [newPost, ...prev]);
    setPostText("");
    setShowPostForm(false);
    setSubmitting(false);
  }

  function handleUpvotePattern(id: string) {
    setPatterns(prev => prev.map(p => p.id === id ? { ...p, upvotes: p.upvotes + 1 } : p));
  }

  function handleLikePost(id: string) {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, likes: p.likes + 1 } : p));
  }

  /* Derived */
  const feedPosts = selectedGroup ? posts.filter(p => p.groupId === selectedGroup.id) : posts;
  const myPosts = posts.filter(p => p.mine);

  /* ─── Styles ──────────────────────────────────────────────────────────── */
  const S = {
    page:    { minHeight: "100vh", background: "var(--bg-primary)", fontFamily: "'DM Sans', system-ui, sans-serif", color: "var(--text-primary)" } as React.CSSProperties,
    wrap:    { maxWidth: 960, margin: "0 auto", padding: "clamp(16px, 4vw, 32px)" } as React.CSSProperties,
    heading: { fontFamily: "'Playfair Display', serif", fontSize: "1.75rem", fontWeight: 700, margin: 0 } as React.CSSProperties,
    sub:     { color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: 4 } as React.CSSProperties,
    card:    { background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border-light)", padding: 20 } as React.CSSProperties,
    mono:    { fontFamily: "'JetBrains Mono', monospace" } as React.CSSProperties,
    btn:     { background: "var(--accent-teal)", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer", fontFamily: "'DM Sans', system-ui, sans-serif" } as React.CSSProperties,
    btnGhost:{ background: "transparent", color: "var(--accent-teal)", border: "1px solid var(--accent-teal)", borderRadius: 8, padding: "8px 16px", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer", fontFamily: "'DM Sans', system-ui, sans-serif" } as React.CSSProperties,
    tab:     (active: boolean) => ({ background: active ? "var(--accent-teal)" : "transparent", color: active ? "#fff" : "var(--text-secondary)", border: active ? "none" : "1px solid var(--border-light)", borderRadius: 8, padding: "8px 16px", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer", fontFamily: "'DM Sans', system-ui, sans-serif" }) as React.CSSProperties,
    badge:   (colour: string) => ({ display: "inline-block", background: colour, color: "#fff", borderRadius: 6, padding: "2px 8px", fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase" as const }),
  };

  /* ─── Render ──────────────────────────────────────────────────────────── */
  return (
    <div style={S.page}>
      <div style={S.wrap}>

        {/* Header */}
        <header style={{ marginBottom: 24 }}>
          <h1 style={S.heading}>Community</h1>
          <p style={S.sub}>Peer groups and anonymised shared patterns</p>
        </header>

        {/* Guidelines Banner */}
        <div style={{ ...S.card, background: "rgba(42,181,193,0.08)", borderColor: "var(--accent-teal)", marginBottom: 24 }}>
          <p style={{ margin: 0, fontSize: "0.85rem", lineHeight: 1.6, color: "var(--text-secondary)" }}>
            All shared information is anonymised. No personal health data is visible. Community discussions are for peer support only — not medical advice. Always consult your healthcare team.
          </p>
        </div>

        {/* Stats Bar */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Total Members", value: stats.totalMembers.toLocaleString() },
            { label: "Posts This Week", value: stats.postsThisWeek.toLocaleString() },
            { label: "Most Active Group", value: stats.mostActiveGroup },
          ].map(s => (
            <div key={s.label} style={{ ...S.card, textAlign: "center" as const }}>
              <p style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, ...S.mono, color: "var(--accent-teal)" }}>{s.value}</p>
              <p style={{ margin: "4px 0 0", fontSize: "0.75rem", color: "var(--text-faint)" }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
          <button style={S.tab(tab === "groups")}   onClick={() => { setTab("groups"); setSelectedGroup(null); }}>Peer Groups</button>
          <button style={S.tab(tab === "feed")}     onClick={() => setTab("feed")} disabled={!selectedGroup}>Discussion Feed</button>
          <button style={S.tab(tab === "patterns")} onClick={() => setTab("patterns")}>Shared Patterns</button>
          <button style={S.tab(tab === "my-posts")} onClick={() => setTab("my-posts")}>My Posts</button>
        </div>

        {/* ── Tab: Peer Groups ─────────────────────────────────────────── */}
        {tab === "groups" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {groups.map(g => (
              <div key={g.id} style={{ ...S.card, display: "flex", flexDirection: "column", gap: 10 }}>
                <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>{g.name}</h3>
                <p style={{ margin: 0, fontSize: "0.825rem", color: "var(--text-secondary)", flex: 1, lineHeight: 1.5 }}>{g.description}</p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-faint)", ...S.mono }}>{g.memberCount.toLocaleString()} members</span>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button style={S.btnGhost} onClick={() => handleSelectGroup(g)}>View</button>
                    <button
                      style={g.joined ? { ...S.btnGhost, borderColor: "var(--text-faint)", color: "var(--text-faint)" } : S.btn}
                      onClick={() => handleJoin(g.id)}
                    >
                      {g.joined ? "Joined" : "Join"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Tab: Discussion Feed ─────────────────────────────────────── */}
        {tab === "feed" && (
          <div>
            {selectedGroup && (
              <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <button style={{ ...S.btnGhost, padding: "6px 12px", fontSize: "0.8rem" }} onClick={() => { setTab("groups"); setSelectedGroup(null); }}>
                  &larr; Back
                </button>
                <h2 style={{ margin: 0, fontFamily: "'Playfair Display', serif", fontSize: "1.25rem" }}>{selectedGroup.name}</h2>
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
              <button style={S.btn} onClick={() => { setShowPostForm(true); setPostCategory("pattern"); }}>Share a Pattern</button>
              <button style={S.btnGhost} onClick={() => { setShowPostForm(true); setPostCategory("question"); }}>Ask the Community</button>
            </div>

            {/* Post creation form */}
            {showPostForm && (
              <div style={{ ...S.card, marginBottom: 20 }}>
                <h3 style={{ margin: "0 0 12px", fontSize: "1rem", fontWeight: 700 }}>New Post</h3>
                <textarea
                  maxLength={500}
                  rows={4}
                  value={postText}
                  onChange={e => setPostText(e.target.value)}
                  placeholder="Share your observation, question, tip, or experience..."
                  style={{
                    width: "100%", boxSizing: "border-box", borderRadius: 8, border: "1px solid var(--border-light)",
                    background: "var(--bg-primary)", color: "var(--text-primary)", padding: 12, fontSize: "0.875rem",
                    fontFamily: "'DM Sans', system-ui, sans-serif", resize: "vertical",
                  }}
                />
                <p style={{ margin: "4px 0 12px", fontSize: "0.7rem", color: "var(--text-faint)", textAlign: "right" as const, ...S.mono }}>
                  {postText.length}/500
                </p>

                {/* Category selector */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                  {(Object.entries(CATEGORY_LABELS) as [PostCategory, string][]).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setPostCategory(key)}
                      style={{
                        ...S.tab(postCategory === key),
                        fontSize: "0.75rem", padding: "6px 12px",
                        ...(postCategory === key ? { background: CATEGORY_COLOURS[key] } : {}),
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Anonymous toggle */}
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: 16, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={postAnonymous}
                    onChange={e => setPostAnonymous(e.target.checked)}
                    style={{ accentColor: "var(--accent-teal)", width: 16, height: 16 }}
                  />
                  Post anonymously
                </label>

                <div style={{ display: "flex", gap: 8 }}>
                  <button style={S.btn} onClick={handleSubmitPost} disabled={!postText.trim() || submitting}>
                    {submitting ? "Posting..." : "Submit"}
                  </button>
                  <button style={S.btnGhost} onClick={() => { setShowPostForm(false); setPostText(""); }}>Cancel</button>
                </div>
              </div>
            )}

            {/* Posts */}
            {feedPosts.length === 0 && (
              <div style={{ ...S.card, textAlign: "center" as const, color: "var(--text-faint)" }}>
                <p>No posts yet. Be the first to share!</p>
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {feedPosts.map(post => (
                <div key={post.id} style={S.card}>
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    {/* Avatar */}
                    <div style={{
                      width: 40, height: 40, borderRadius: "50%", background: post.authorColour,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#fff", fontWeight: 700, fontSize: "0.8rem", flexShrink: 0,
                      fontFamily: "'DM Sans', system-ui, sans-serif",
                    }}>
                      {post.authorInitials}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>{post.displayName}</span>
                        <span style={S.badge(CATEGORY_COLOURS[post.category])}>{CATEGORY_LABELS[post.category]}</span>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-faint)", ...S.mono }}>{relativeTime(post.createdAt)}</span>
                      </div>
                      <p style={{ margin: "8px 0 0", fontSize: "0.875rem", lineHeight: 1.6, color: "var(--text-secondary)" }}>
                        {post.text}
                      </p>
                      <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
                        <button
                          onClick={() => handleLikePost(post.id)}
                          style={{ background: "none", border: "none", color: "var(--text-faint)", cursor: "pointer", fontSize: "0.8rem", padding: 0, fontFamily: "'DM Sans', system-ui, sans-serif" }}
                        >
                          <span style={{ ...S.mono }}>{post.likes}</span> likes
                        </button>
                        <span style={{ fontSize: "0.8rem", color: "var(--text-faint)" }}>
                          <span style={{ ...S.mono }}>{post.replies}</span> replies
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Tab: Shared Patterns ─────────────────────────────────────── */}
        {tab === "patterns" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {patterns.map(p => (
              <div key={p.id} style={{ ...S.card, display: "flex", gap: 16, alignItems: "center" }}>
                <button
                  onClick={() => handleUpvotePattern(p.id)}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                    background: "none", border: "1px solid var(--border-light)", borderRadius: 8,
                    padding: "8px 12px", cursor: "pointer", color: "var(--accent-teal)", flexShrink: 0,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  <span style={{ fontSize: "1rem", lineHeight: 1 }}>&#9650;</span>
                  <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>{p.upvotes}</span>
                </button>
                <p style={{ margin: 0, fontSize: "0.875rem", lineHeight: 1.6, color: "var(--text-secondary)" }}>{p.text}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Tab: My Posts ────────────────────────────────────────────── */}
        {tab === "my-posts" && (
          <div>
            {myPosts.length === 0 ? (
              <div style={{ ...S.card, textAlign: "center" as const, color: "var(--text-faint)" }}>
                <p>You have not posted yet. Join a group and share your first observation!</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {myPosts.map(post => (
                  <div key={post.id} style={S.card}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <span style={S.badge(CATEGORY_COLOURS[post.category])}>{CATEGORY_LABELS[post.category]}</span>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-faint)", ...S.mono }}>{relativeTime(post.createdAt)}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: "0.875rem", lineHeight: 1.6, color: "var(--text-secondary)" }}>{post.text}</p>
                    <div style={{ display: "flex", gap: 16, marginTop: 12, fontSize: "0.8rem", color: "var(--text-faint)" }}>
                      <span><span style={S.mono}>{post.likes}</span> likes</span>
                      <span><span style={S.mono}>{post.replies}</span> replies</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Disclaimer */}
        <footer style={{ marginTop: 40, paddingTop: 20, borderTop: "1px solid var(--border-light)" }}>
          <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-faint)", lineHeight: 1.6 }}>{DISCLAIMER}</p>
        </footer>

      </div>
    </div>
  );
}
