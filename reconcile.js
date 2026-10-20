// Payment reconciliation.
//
// Reads payments.jsonl and works out how much money we actually collected.
// Run:  node reconcile.js

const fs = require("fs");

const txns = new Map();

const lines = fs.readFileSync("payments.jsonl", "utf8").split("\n");
for (const line of lines) {
  if (!line.trim()) continue;
  let event;
  try {
    event = JSON.parse(line);
  } catch (e) {
    continue;
  }
  if (!event || typeof event !== "object" || !event.txn_id) {
    continue;
  }
  const prev = txns.get(event.txn_id);
  if (!prev || Date.parse(event.ts) > Date.parse(prev.ts)) {
    txns.set(event.txn_id, event);
  }
}

let total = 0;
let count = 0;

for (const event of txns.values()) {
  if (event.status === "success") {
    const amount = typeof event.amount === "string"
      ? Number(event.amount.replace(/,/g, "").trim())
      : Number(event.amount);
    total += amount;
    count += 1;
  }
}

const expected = parseInt(fs.readFileSync("expected.txt", "utf8").trim(), 10);

if (count !== expected) {
  console.log(`Check failed: counted ${count} successful payments, expected ${expected}.`);
  console.log("Something in the data isn't being handled the way the README describes.");
} else {
  console.log(`Check passed: ${count} successful payments.`);
  console.log(`Your code: KOYA-${Math.round(total)}`);
}
