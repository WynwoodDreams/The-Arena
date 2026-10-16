// Read-only GitHub and Vercel status for the public project registry.
// No database, scheduled jobs, or new paid integrations.
const sites = require("../../connections.js");

const arena = {
  id: "agent-arena",
  name: "Agent Arena",
  url: "https://the-arena-gamma.vercel.app",
  repository: "https://github.com/WynwoodDreams/The-Arena",
  category: "Creative command center"
};

const projectSources = [arena, ...sites];
const base = "https://api.github.com/repos/";
const RECENT_COMMITS = 5;

function summarizeCommit(commit) {
  return {
    sha: String(commit.sha).slice(0, 7),
    fullSha: String(commit.sha),
    message: String(commit.commit?.message || "").split("\n")[0].slice(0, 180),
    at: commit.commit?.committer?.date || commit.commit?.author?.date || null,
    author: commit.author?.login || commit.commit?.author?.name || null,
    avatar: validExternalUrl(commit.author?.avatar_url),
    additions: null,
    deletions: null
  };
}

async function githubGet(path) {
  const headers = {
    "Accept": "application/vnd.github+json",
    "User-Agent": "Agent-Arena-Project-Command",
    "X-GitHub-Api-Version": "2022-11-28"
  };
  if (process.env.GITHUB_TOKEN) headers.Authorization = "Bearer " + process.env.GITHUB_TOKEN;
  const response = await fetch(base + path, {
    headers,
    redirect: "error",
    signal: AbortSignal.timeout(6000)
  });
  if (!response.ok) throw new Error("GitHub returned HTTP " + response.status);
  return response.json();
}

function validExternalUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch { return null; }
}

async function inspect(source) {
  const result = {
    id: source.id, name: source.name, url: source.url,
    category: source.category, repository: source.repository || null,
    source: source.repository ? "github" : "unlinked",
    checkedAt: new Date().toISOString(),
    lastCommit: null,
    recentCommits: [],
    codeActivity: null,
    deployment: null,
    error: null
  };
  if (!source.repository) return result;
  const match = source.repository.match(/^https:\/\/github\.com\/([a-zA-Z0-9-]+)\/([a-zA-Z0-9_.-]+)\/?$/);
  if (!match) {
    result.error = "Repository URL not supported.";
    return result;
  }
  const slug = encodeURIComponent(match[1]) + "/" + encodeURIComponent(match[2]);
  try {
    const commits = await githubGet(slug + "/commits?per_page=" + RECENT_COMMITS);
    const commit = Array.isArray(commits) ? commits[0] : null;
    if (!commit || !commit.sha) throw new Error("No public commit information.");
    result.recentCommits = commits.filter(c => c && c.sha).map(summarizeCommit);
    result.lastCommit = {
      sha: result.recentCommits[0].sha,
      message: result.recentCommits[0].message,
      at: result.recentCommits[0].at
    };
    // Line counts need one request per commit, so only a few are fetched
    // without a token to stay inside GitHub's anonymous rate limit.
    const detailed = process.env.GITHUB_TOKEN ? RECENT_COMMITS : 2;
    await Promise.all(result.recentCommits.slice(0, detailed).map(async entry => {
      try {
        const detail = await githubGet(slug + "/commits/" + encodeURIComponent(entry.fullSha));
        if (detail.stats) {
          entry.additions = Number(detail.stats.additions) || 0;
          entry.deletions = Number(detail.stats.deletions) || 0;
        }
      } catch {
        // Unknown line counts stay null; they are never shown as zero.
      }
    }));
    result.recentCommits.forEach(entry => { delete entry.fullSha; });
    const counted = result.recentCommits.filter(entry => entry.additions != null);
    result.codeActivity = {
      commits: result.recentCommits.length,
      counted: counted.length,
      additions: counted.reduce((sum, entry) => sum + entry.additions, 0),
      deletions: counted.reduce((sum, entry) => sum + entry.deletions, 0)
    };
    try {
      const combined = await githubGet(slug + "/commits/" + encodeURIComponent(commit.sha) + "/status");
      const vercel = (combined.statuses || []).find(entry => /vercel/i.test(entry.context || ""));
      if (vercel) {
        result.deployment = {
          provider: "Vercel",
          status: ["success", "failure", "pending", "error"].includes(vercel.state) ? vercel.state : "unknown",
          url: validExternalUrl(vercel.target_url)
        };
      }
    } catch {
      // A missing deployment status must never be represented as successful.
    }
  } catch {
    result.error = "GitHub data unavailable or repository is not public.";
  }
  return result;
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "public, s-maxage=180, stale-while-revalidate=600");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }
  try {
    const projects = await Promise.all(projectSources.map(inspect));
    return res.status(200).json({
      success: true,
      source: "GitHub public repository commits, per-commit line counts, and Vercel GitHub statuses",
      checkedAt: new Date().toISOString(),
      projects
    });
  } catch {
    return res.status(502).json({ success: false, message: "Could not retrieve project status." });
  }
};
