import { readFileSync, writeFileSync } from "fs";

const OLD_MANIFEST = "/Users/ganggyunggyu/Programing/cafe-bot/tmp/v3-prompts/manifest.json";
const arr = JSON.parse(readFileSync(OLD_MANIFEST, "utf-8"));
const NEW_DIR = "/Users/ganggyunggyu/Programing/cafe-bot/tmp/v3-prompts";
for (const m of arr) {
  m.promptFile = m.promptFile.replace("/tmp/v3-prompts", NEW_DIR);
  m.outFile = m.outFile.replace("/tmp/v3-prompts", NEW_DIR);
}
writeFileSync(OLD_MANIFEST, JSON.stringify(arr, null, 2));
console.log("✓ manifest 경로 갱신:", NEW_DIR);
