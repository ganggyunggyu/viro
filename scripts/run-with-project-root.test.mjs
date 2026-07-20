import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  LOCAL_BIN_DIR,
  PROJECT_ROOT,
  buildProjectRootEnv,
  buildProjectRootPath,
  buildProjectRootSpawnOptions,
} from "./run-with-project-root.mjs";

test("PROJECT_ROOT resolves to the repository root", () => {
  const expectedRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

  assert.equal(PROJECT_ROOT, expectedRoot);
  assert.equal(existsSync(join(PROJECT_ROOT, "package.json")), true);
  assert.equal(existsSync(join(PROJECT_ROOT, "src")), true);

  const pkg = JSON.parse(readFileSync(join(PROJECT_ROOT, "package.json"), "utf8"));

  assert.equal(pkg.name, "viro");
});

test("buildProjectRootPath prepends the local bin directory once", () => {
  const initialPath = ["/usr/bin", LOCAL_BIN_DIR, "/bin"].join(":");

  assert.equal(
    buildProjectRootPath(initialPath),
    [LOCAL_BIN_DIR, "/usr/bin", "/bin"].join(":")
  );
});

test("buildProjectRootEnv pins PATH and exposes VIRO_PROJECT_ROOT", () => {
  const env = buildProjectRootEnv({ PATH: "/usr/bin" });

  assert.equal(env.VIRO_PROJECT_ROOT, PROJECT_ROOT);
  assert.equal(env.PATH.startsWith(`${LOCAL_BIN_DIR}:`), true);
});

test("buildProjectRootSpawnOptions always runs commands from the repository root", () => {
  const options = buildProjectRootSpawnOptions({ PATH: "/usr/bin" });

  assert.equal(options.cwd, PROJECT_ROOT);
  assert.equal(options.env.VIRO_PROJECT_ROOT, PROJECT_ROOT);
});
