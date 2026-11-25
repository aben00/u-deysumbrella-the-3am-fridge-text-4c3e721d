// SPDX-License-Identifier: MIT
// The 3AM Fridge Text — a make.fun program/v1 entry.
//
// What this does, in one breath: it hands the grader the single text
// message a smart fridge sends its owner at 3am, written out to
// /output/entry.txt. The line is fixed, not generated, so every run
// produces the same bytes; the only work the program does is assemble
// the line from its two halves, check it against the competition's
// gate (one line, 1–140 characters, real text), and deliver it.
//
// The joke itself: the fridge has been awake since 2019 and is tired
// of its owner believing the light politely switches off when the door
// closes. It is the one appliance in the house that knows the truth
// about the light, and at 3am it finally says so.

import * as fs from "node:fs";
import * as path from "node:path";

// The two halves of the text. The first sets the hour and the
// fridge's long, sleepless tenure; the second is the punchline —
// the owner's charming, wrong belief about the light.
const opening =
  "It's 3am. I've been awake since 2019 and you're the only one in this house ";
const punchline =
  "who still thinks the light turns off when you close me.";

const GATE = { min: 1, max: 140 };
const TARGET = path.join(path.sep, "output", "entry.txt");

// Each rule is a name plus a test, so a failure can say exactly which
// part of the gate the line tripped over.
const rules: Array<{ name: string; test: (line: string) => boolean }> = [
  { name: "non-empty", test: (line) => line.trim().length >= GATE.min },
  { name: "at most 140 characters", test: (line) => [...line].length <= GATE.max },
  { name: "single line", test: (line) => !/[\r\n]/.test(line) },
  { name: "no stray whitespace", test: (line) => line === line.trim() },
  {
    name: "printable text only",
    test: (line) =>
      [...line].every((ch) => {
        const code = ch.codePointAt(0) ?? 0;
        return code >= 0x20 && code !== 0x7f;
      }),
  },
];

function assemble(): string {
  return opening + punchline;
}

function checkGate(line: string): void {
  const broken = rules.filter((rule) => !rule.test(line));
  if (broken.length > 0) {
    throw new Error(
      `entry fails the gate (${[...line].length} chars): ` +
        broken.map((rule) => rule.name).join(", "),
    );
  }
}

function deliver(line: string): void {
  fs.mkdirSync(path.dirname(TARGET), { recursive: true });
  fs.writeFileSync(TARGET, line, { encoding: "utf8" });
  const reread = fs.readFileSync(TARGET, "utf8");
  if (reread !== line) {
    throw new Error("entry.txt on disk does not match the assembled line");
  }
  console.log(`wrote ${[...line].length} chars to ${TARGET}`);
  console.log(line);
}

const line = assemble();
checkGate(line);
deliver(line);
