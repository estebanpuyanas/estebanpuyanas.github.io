/**
 * Simple Node.js script to dynamically fetch list of repositories from my GitHub account and display them
 * by updating the `repos.json` file in the project root.
 * projects.html displays them according to the last project update date.
 */
import fs      from 'fs';
import path    from 'path';
import fetch   from 'node-fetch';
import dotenv  from 'dotenv';
dotenv.config();

const TOKEN = process.env.GITHUB_API_KEY;
const USER  = 'estebanpuyanas';

async function main() {
  const res = await fetch(
    `https://api.github.com/users/${USER}/repos?per_page=100&sort=updated`,
    { headers: { Authorization: `Bearer ${TOKEN}` } }
  );
  if (!res.ok) {
    console.error('GitHub API error', res.status, await res.text());
    process.exit(1);
  }
  const repos = await res.json();

  // ► write to <project-root>/repos.json
  const outPath = path.resolve(process.cwd(), 'repos.json');
  fs.writeFileSync(outPath, JSON.stringify(repos, null, 2));
  console.log('Wrote repos.json →', outPath);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
