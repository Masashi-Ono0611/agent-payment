/**
 * PayAgent Chat API automated test
 * Tests tool calling flow directly against the API
 *
 * Usage: npx tsx scripts/test-chat-api.ts
 */

const BASE = "http://localhost:3000";

interface UIMessage {
  id: string;
  role: "user" | "assistant";
  parts: Array<{ type: string; text?: string; [key: string]: unknown }>;
}

let messageId = 0;
function makeUserMessage(text: string): UIMessage {
  return {
    id: `msg-${++messageId}`,
    role: "user",
    parts: [{ type: "text", text }],
  };
}

async function chatRequest(
  messages: UIMessage[],
  wallets: { name: string; address: string }[] = [],
  connectedAddress?: string
): Promise<{ raw: string; lines: string[] }> {
  const res = await fetch(`${BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, wallets, connectedAddress }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 500)}`);
  }
  const raw = await res.text();
  const lines = raw.split("\n").filter((l) => l.trim().length > 0);
  return { raw, lines };
}

let passed = 0;
let failed = 0;
function pass(name: string, detail?: string) {
  passed++;
  console.log(`  ✅ ${name}${detail ? ` — ${detail}` : ""}`);
}
function fail(name: string, detail?: string) {
  failed++;
  console.log(`  ❌ ${name}${detail ? ` — ${detail}` : ""}`);
}

function analyzeStream(lines: string[]) {
  let text = 0, toolStart = 0, toolDelta = 0, toolAvail = 0, toolOutput = 0;
  let steps = 0, finish = 0;
  for (const l of lines) {
    if (l.includes('"type":"text-delta"')) text++;
    if (l.includes('"type":"tool-input-start"')) toolStart++;
    if (l.includes('"type":"tool-input-delta"')) toolDelta++;
    if (l.includes('"type":"tool-input-available"')) toolAvail++;
    if (l.includes('"type":"tool-output-available"')) toolOutput++;
    if (l.includes('"type":"start-step"')) steps++;
    if (l.includes('"type":"finish"')) finish++;
  }
  return { text, toolStart, toolDelta, toolAvail, toolOutput, steps, finish };
}

// ── Tests ──────────────────────────────────────────────

async function test1_createWallet() {
  console.log("\n── 1. create_wallet ──");
  const { raw, lines } = await chatRequest(
    [makeUserMessage("Please create a wallet called TestWallet now. Use the create_wallet tool.")],
  );
  const s = analyzeStream(lines);
  console.log(`  📊 stream: text=${s.text} steps=${s.steps} toolStart=${s.toolStart} toolAvail=${s.toolAvail} toolOutput=${s.toolOutput}`);

  if (s.toolStart > 0) pass("Tool call initiated");
  else fail("Tool call NOT initiated");

  if (s.toolAvail > 0) pass("Tool input parsed");
  else fail("Tool input NOT parsed");

  if (s.toolOutput > 0) pass("Tool executed successfully");
  else fail("Tool NOT executed");

  if (s.steps >= 2) pass(`Multi-step: ${s.steps} steps (AI responded after tool)`);
  else fail(`Only ${s.steps} step(s) — AI did NOT respond after tool result`);

  const hasAddress = /0x[a-fA-F0-9]{40}/.test(raw);
  if (hasAddress) pass("Wallet address in response");
  else fail("No wallet address in response");
}

async function test2_walletContext() {
  console.log("\n── 2. wallet context (no tool needed) ──");
  const wallets = [
    { name: "MyAgent", address: "0xAAAABBBBCCCCDDDD1111222233334444AAAABBBB" },
  ];
  const { raw, lines } = await chatRequest(
    [makeUserMessage("What wallets do I have? Just tell me from what you know.")],
    wallets,
  );

  // Debug: show all text content
  const textLines = lines.filter((l) => l.includes("text-delta"));
  const allText = textLines.map((l) => {
    const m = l.match(/"delta":"([^"]*)"/);
    return m ? m[1] : "";
  }).join("");
  console.log(`  📋 AI response: ${allText.slice(0, 300)}`);

  if (raw.includes("MyAgent")) pass("Response mentions MyAgent");
  else fail("Response does NOT mention MyAgent");

  if (raw.toLowerCase().includes("aaaa") || raw.toLowerCase().includes("bbbb")) pass("Response includes address");
  else fail("Response does NOT include address");
}

async function test3_connectedWallet() {
  console.log("\n── 3. connected wallet recognition ──");
  const { raw, lines } = await chatRequest(
    [makeUserMessage("What is my connected browser wallet address?")],
    [],
    "0xAbCdEf1234567890AbCdEf1234567890AbCdEf12",
  );

  const textLines = lines.filter((l) => l.includes("text-delta"));
  const allText = textLines.map((l) => {
    const m = l.match(/"delta":"([^"]*)"/);
    return m ? m[1] : "";
  }).join("");
  console.log(`  📋 AI response: ${allText.slice(0, 300)}`);

  if (raw.toLowerCase().includes("abcdef") || raw.toLowerCase().includes("0xab")) pass("Connected address recognized");
  else fail("Connected address NOT recognized");
}

async function test4_checkBalance() {
  console.log("\n── 4. check_balance ──");
  const wallets = [
    { name: "TestWallet", address: "0x0000000000000000000000000000000000000000" },
  ];
  const { raw, lines } = await chatRequest(
    [makeUserMessage("Check the balance of TestWallet. Use the check_balance tool with address 0x0000000000000000000000000000000000000000.")],
    wallets,
  );
  const s = analyzeStream(lines);
  console.log(`  📊 stream: text=${s.text} steps=${s.steps} toolStart=${s.toolStart} toolAvail=${s.toolAvail} toolOutput=${s.toolOutput}`);

  if (s.toolOutput > 0) pass("check_balance executed");
  else fail("check_balance NOT executed");

  if (s.steps >= 2) pass(`Multi-step: ${s.steps} steps`);
  else fail(`Only ${s.steps} step(s) — no follow-up response`);

  const hasETH = raw.includes("ETH") || raw.includes("eth");
  if (hasETH) pass("ETH mentioned in response");
  else fail("ETH not mentioned");
}

// ── Main ──────────────────────────────────────────────

async function main() {
  console.log("🧪 PayAgent Chat API Test Suite");
  console.log(`   Target: ${BASE}`);
  console.log(`   Time: ${new Date().toISOString()}\n`);

  try {
    const res = await fetch(BASE);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    pass("Server reachable");
  } catch (e) {
    fail("Server NOT reachable", String(e));
    process.exit(1);
  }

  await test1_createWallet();
  await test2_walletContext();
  await test3_connectedWallet();
  await test4_checkBalance();

  console.log(`\n══ Results: ${passed} passed, ${failed} failed ══\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
