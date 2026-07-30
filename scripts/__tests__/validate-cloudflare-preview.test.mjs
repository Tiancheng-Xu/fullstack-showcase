import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { execFile as execFileCallback } from "node:child_process";
import { promisify } from "node:util";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const validator = path.join(root, "scripts/validate-cloudflare-preview.mjs");
const workflow = path.join(root, ".github/workflows/cloudflare-preview.yml");
const execFile = promisify(execFileCallback);

async function runValidator(workflowPath) {
  try {
    const result = await execFile(process.execPath, [validator, workflowPath], {
      cwd: root,
    });
    return { ...result, exitCode: 0 };
  } catch (error) {
    return {
      stdout: error.stdout ?? "",
      stderr: error.stderr ?? "",
      exitCode: error.code,
    };
  }
}

test("accepts the repository preview workflow", async () => {
  const result = await runValidator(workflow);

  assert.equal(result.exitCode, 0, result.stderr);
  assert.match(result.stdout, /workflow validation passed/i);
});

test("rejects a required command that appears only in a YAML comment", async (t) => {
  const fixtureDirectory = await mkdtemp(
    path.join(tmpdir(), "cloudflare-preview-validator-"),
  );
  t.after(() => rm(fixtureDirectory, { recursive: true, force: true }));

  const fixturePath = path.join(fixtureDirectory, "comment-only-command.yml");
  const source = await readFile(workflow, "utf8");
  await writeFile(
    fixturePath,
    source.replace("run: pnpm test", "run: echo tests-skipped # pnpm test"),
  );

  const result = await runValidator(fixturePath);

  assert.notEqual(result.exitCode, 0);
  assert.match(result.stderr, /pnpm test/i);
});

test("rejects malformed YAML even when all required text remains", async (t) => {
  const fixtureDirectory = await mkdtemp(
    path.join(tmpdir(), "cloudflare-preview-validator-"),
  );
  t.after(() => rm(fixtureDirectory, { recursive: true, force: true }));

  const fixturePath = path.join(fixtureDirectory, "malformed.yml");
  const source = await readFile(workflow, "utf8");
  await writeFile(fixturePath, `${source}\nmalformed: [\n`);

  const result = await runValidator(fixturePath);

  assert.notEqual(result.exitCode, 0);
  assert.match(result.stderr, /invalid yaml/i);
});
