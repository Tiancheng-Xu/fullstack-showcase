import assert from "node:assert/strict";
import { access, readdir } from "node:fs/promises";
import { execFile as execFileCallback } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const execFile = promisify(execFileCallback);

async function exists(relativePath) {
  try {
    await access(path.join(root, relativePath));
    return true;
  } catch {
    return false;
  }
}

async function findNamed(directory, target) {
  const matches = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if ([".git", ".tc-flow", ".tc-worktrees", "node_modules"].includes(entry.name)) {
      continue;
    }
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      matches.push(...(await findNamed(absolute, target)));
    } else if (entry.name === target) {
      matches.push(path.relative(root, absolute));
    }
  }
  return matches;
}

async function isIgnored(relativePath) {
  try {
    await execFile("git", ["check-ignore", "--quiet", "--no-index", relativePath], {
      cwd: root,
    });
    return true;
  } catch (error) {
    if (error.code === 1) {
      return false;
    }
    throw error;
  }
}

test("uses one root workspace and lockfile", async () => {
  assert.deepEqual(await findNamed(root, "pnpm-workspace.yaml"), [
    "pnpm-workspace.yaml",
  ]);
  assert.deepEqual(await findNamed(root, "pnpm-lock.yaml"), ["pnpm-lock.yaml"]);
});

test("places the application and shared packages at root boundaries", async () => {
  for (const required of [
    "apps/web/package.json",
    "apps/web/src/main.tsx",
    "packages/ui/package.json",
    "packages/env/package.json",
    "packages/config/package.json",
    "apps/api/README.md",
  ]) {
    assert.equal(await exists(required), true, `${required} must exist`);
  }

  assert.equal(await exists("apps/web/apps"), false);
  assert.equal(await exists("apps/web/packages"), false);
  assert.equal(await exists("apps/api/package.json"), false);
});

test("ignores Cloudflare local application files", async () => {
  for (const localPath of ["apps/web/.dev.vars.local", "apps/web/.wrangler/state"]) {
    assert.equal(await isIgnored(localPath), true, `${localPath} must be ignored`);
  }
});
