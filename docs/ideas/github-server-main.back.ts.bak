import 'dotenv/config';
import express, { Request, Response } from 'express';
import session from 'express-session';
import { fetch } from 'undici';

const {
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  SESSION_SECRET = 'change_me',
  API_PORT = '5174',
} = process.env;

if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
  console.error('Missing GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET in .env');
  process.exit(1);
}

declare module 'express-session' {
  interface SessionData {
    token?: string;
  }
}

const app = express();
app.use(express.json());
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true },
  })
);

type GHJson = any;

async function gh(token: string, url: string, init?: RequestInit) {
  const r = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init?.headers || {}),
    } as any,
  });
  const status = r.status;
  const json = (await r.json()) as GHJson;
  if (status === 202) return { status, json, headers: r.headers };
  if (!r.ok) {
    throw new Error(`GitHub ${status}: ${JSON.stringify(json)}`);
  }
  return { status, json, headers: r.headers };
}

// --- OAuth start
app.get('/api/login', (_req: Request, res: Response) => {
  const url =
    'https://github.com/login/oauth/authorize' +
    `?client_id=${encodeURIComponent(GITHUB_CLIENT_ID)}` +
    `&scope=${encodeURIComponent('read:user repo')}` +
    `&allow_signup=true`;
  res.redirect(url);
});

// --- OAuth callback (exchange code → token)
app.get('/api/callback', async (req: Request, res: Response) => {
  const code = req.query.code as string | undefined;
  if (!code) return res.status(400).send('Missing code');

  const r = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code,
    }),
  });
  const data = (await r.json()) as { access_token?: string; error?: string };
  if (!data.access_token) {
    return res.status(400).send('OAuth failed: ' + JSON.stringify(data));
  }
  req.session.token = data.access_token;
  res.redirect('/');
});

// --- Slim profile
app.get('/api/whoami', async (req: Request, res: Response) => {
  if (!req.session.token) return res.status(401).json({ error: 'not_authed' });
  const { json } = await gh(req.session.token, 'https://api.github.com/user');
  const { login, id, avatar_url, name } = json || {};
  return res.json({ login, id, avatar_url, name });
});

// --- Repo listing w/ depagination (org or user)
app.get('/api/repos', async (req: Request, res: Response) => {
  try {
    if (!req.session.token)
      return res.status(401).json({ error: 'not_authed' });
    const owner = String(req.query.owner || '');
    if (!owner) return res.status(400).json({ error: 'missing owner' });

    const depaginate = async (url: string) => {
      const accum: any[] = [];
      let next: string | null = url;
      while (next) {
        const r = await fetch(next, {
          headers: {
            Authorization: `Bearer ${req.session.token}`,
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
          },
        });
        if (!r.ok) {
          const txt = await r.text();
          throw new Error(`GitHub ${r.status}: ${txt}`);
        }
        const page = (await r.json()) as any[];
        accum.push(...page);
        const link = r.headers.get('link');
        const match = link?.match(/<([^>]+)>;\s*rel="next"/);
        next = match ? match[1] : null;
      }
      return accum;
    };

    try {
      const orgRepos = await depaginate(
        `https://api.github.com/orgs/${owner}/repos?per_page=100&type=all`
      );
      return res.json(orgRepos);
    } catch {
      const userRepos = await depaginate(
        `https://api.github.com/users/${owner}/repos?per_page=100&type=owner,member,public`
      );
      return res.json(userRepos);
    }
  } catch (e) {
    res.status(400).json({ error: String(e) });
  }
});

// --- Contributor stats (weekly commits/adds/dels by author)
app.get('/api/stats/contributors', async (req: Request, res: Response) => {
  if (!req.session.token) return res.status(401).json({ error: 'not_authed' });
  const owner = String(req.query.owner || '');
  const repo = String(req.query.repo || '');
  if (!owner || !repo)
    return res.status(400).json({ error: 'missing owner/repo' });

  const url = `https://api.github.com/repos/${owner}/${repo}/stats/contributors`;
  let attempts = 0;
  while (attempts < 7) {
    const r = await gh(req.session.token, url);
    if (r.status !== 202) return res.json(r.json);
    await new Promise((ok) => setTimeout(ok, 1500));
    attempts++;
  }
  return res.status(202).json({ status: 'still_computing' });
});

app.listen(Number(API_PORT), () => {
  console.log(`API on http://localhost:${API_PORT}`);
});
