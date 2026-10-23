// GET /api/github
// Returns the public repos tagged with the "portfolio" topic, most recently pushed first.
// Cached at Vercel's edge for an hour so visitors never hit GitHub's rate limit.
// Optional: set a GITHUB_TOKEN env var in Vercel for a higher API limit (not required).

const USER = "beyondparthiv";
const TOPIC = "portfolio";
const LIMIT = 6;

module.exports = async (req, res) => {
  try {
    const headers = { Accept: "application/vnd.github+json", "User-Agent": `${USER}-portfolio` };
    if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

    const r = await fetch(`https://api.github.com/users/${USER}/repos?per_page=100&sort=pushed`, { headers });
    if (!r.ok) throw new Error(`GitHub responded ${r.status}`);
    const repos = await r.json();

    const items = repos
      .filter((x) => !x.fork && !x.archived && !x.private && (x.topics || []).includes(TOPIC))
      .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at))
      .slice(0, LIMIT)
      .map((x) => ({
        name: x.name,
        description: x.description,
        url: x.html_url,
        homepage: x.homepage || null,
        language: x.language,
        stars: x.stargazers_count,
        pushedAt: x.pushed_at,
        topics: (x.topics || []).filter((t) => t !== TOPIC).slice(0, 4),
      }));

    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    res.status(200).json({ user: USER, items });
  } catch (err) {
    res.setHeader("Cache-Control", "public, s-maxage=300");
    res.status(502).json({ error: "github_unavailable", items: [] });
  }
};
