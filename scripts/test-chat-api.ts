/**
 * PayAgent Chat API automated test
 * Tests tool calling flow directly against the API
 * Covers QA_TEST_PLAN.md sections 2-7, 9, 11
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

function extractTextFromStream(lines: string[]): string {
  return lines
    .filter((l) => l.includes("text-delta"))
    .map((l) => {
      const m = l.match(/"delta":"([^"]*)"/);
      return m ? m[1] : "";
    })
    .join("");
}

// ── Section 2: Wallet Creation ──────────────────────────

async function test_createWallet() {
  console.log("\n── 2. create_wallet (QA 2-1〜2-3) ──");
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

// ── Section 2: Wallet Context ──────────────────────────

async function test_walletContext() {
  console.log("\n── 2. wallet context (QA 2-4, no tool needed) ──");
  const wallets = [
    { name: "MyAgent", address: "0xAAAABBBBCCCCDDDD1111222233334444AAAABBBB" },
  ];
  const { raw, lines } = await chatRequest(
    [makeUserMessage("What wallets do I have? Just tell me from what you know.")],
    wallets,
  );

  const allText = extractTextFromStream(lines);
  console.log(`  📋 AI response: ${allText.slice(0, 300)}`);

  if (raw.includes("MyAgent")) pass("Response mentions MyAgent");
  else fail("Response does NOT mention MyAgent");

  if (raw.toLowerCase().includes("aaaa") || raw.toLowerCase().includes("bbbb")) pass("Response includes address");
  else fail("Response does NOT include address");
}

// ── Section 1-4: Connected Wallet ──────────────────────

async function test_connectedWallet() {
  console.log("\n── 1-4. connected wallet recognition ──");
  const { raw, lines } = await chatRequest(
    [makeUserMessage("What is my connected browser wallet address?")],
    [],
    "0xAbCdEf1234567890AbCdEf1234567890AbCdEf12",
  );

  const allText = extractTextFromStream(lines);
  console.log(`  📋 AI response: ${allText.slice(0, 300)}`);

  if (raw.toLowerCase().includes("abcdef") || raw.toLowerCase().includes("0xab")) pass("Connected address recognized");
  else fail("Connected address NOT recognized");
}

// ── Section 3: Check Balance ──────────────────────────

async function test_checkBalance() {
  console.log("\n── 3. check_balance (QA 3-1〜3-2) ──");
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

  const hasUSDC = raw.includes("USDC") || raw.includes("usdc");
  if (hasUSDC) pass("USDC mentioned in response");
  else fail("USDC not mentioned");
}

// ── Section 9: Balance API (Wallet tab backend) ──────────

async function test_balanceApi() {
  console.log("\n── 9. Balance API endpoint ──");

  // Valid address
  const res1 = await fetch(`${BASE}/api/balance?address=0x0000000000000000000000000000000000000000`);
  const json1 = await res1.json();
  if (json1.success && json1.data) pass("Balance API returns data for valid address");
  else fail("Balance API failed for valid address", JSON.stringify(json1));

  if (json1.data?.eth !== undefined) pass("ETH balance field present");
  else fail("ETH balance field missing");

  if (json1.data?.usdc !== undefined) pass("USDC balance field present");
  else fail("USDC balance field missing");

  // Invalid address
  const res2 = await fetch(`${BASE}/api/balance?address=invalid`);
  if (res2.status === 400) pass("Balance API rejects invalid address (400)");
  else fail(`Balance API did not reject invalid address (got ${res2.status})`);

  // Missing address
  const res3 = await fetch(`${BASE}/api/balance`);
  if (res3.status === 400) pass("Balance API rejects missing address (400)");
  else fail(`Balance API did not reject missing address (got ${res3.status})`);
}

// ── Section 9: Wallet API ──────────────────────────────

async function test_walletApi() {
  console.log("\n── 9. Wallet API endpoint ──");

  // Valid wallet creation
  const res1 = await fetch(`${BASE}/api/wallet`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: `test-wallet-${Date.now()}` }),
  });
  const json1 = await res1.json();
  if (json1.success && json1.data?.address) pass("Wallet API creates wallet");
  else fail("Wallet API failed to create wallet", JSON.stringify(json1));

  if (/^0x[a-fA-F0-9]{40}$/.test(json1.data?.address || "")) pass("Returns valid address format");
  else fail("Invalid address format", json1.data?.address);

  // Missing name validation
  const res2 = await fetch(`${BASE}/api/wallet`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "" }),
  });
  if (res2.status === 400) pass("Wallet API rejects empty name (400)");
  else fail(`Wallet API did not reject empty name (got ${res2.status})`);

  // Too long name validation
  const res3 = await fetch(`${BASE}/api/wallet`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "a".repeat(101) }),
  });
  if (res3.status === 400) pass("Wallet API rejects too long name (400)");
  else fail(`Wallet API did not reject too long name (got ${res3.status})`);
}

// ── Section 11: Edge Cases ──────────────────────────────

async function test_edgeCases() {
  console.log("\n── 11. Edge cases ──");

  // Empty messages array
  try {
    const res = await fetch(`${BASE}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [] }),
    });
    // Should either work (empty response) or return error, but not crash
    if (res.status < 500) pass("Empty messages array does not crash server");
    else fail("Empty messages array caused 500 error");
  } catch {
    fail("Empty messages array caused network error");
  }

  // Transfer API validation
  const res1 = await fetch(`${BASE}/api/transfer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fromName: "", to: "", amount: "" }),
  });
  if (res1.status === 400) pass("Transfer API rejects empty params (400)");
  else fail(`Transfer API did not reject empty params (got ${res1.status})`);

  // Transfer API invalid address
  const res2 = await fetch(`${BASE}/api/transfer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fromName: "test", to: "not-an-address", amount: "1.0", token: "eth" }),
  });
  if (res2.status === 400) pass("Transfer API rejects invalid address (400)");
  else fail(`Transfer API did not reject invalid address (got ${res2.status})`);

  // Transfer API invalid amount
  const res3 = await fetch(`${BASE}/api/transfer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fromName: "test",
      to: "0x0000000000000000000000000000000000000000",
      amount: "abc",
      token: "eth",
    }),
  });
  if (res3.status === 400) pass("Transfer API rejects invalid amount (400)");
  else fail(`Transfer API did not reject invalid amount (got ${res3.status})`);

  // Transfer API invalid token
  const res4 = await fetch(`${BASE}/api/transfer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fromName: "test",
      to: "0x0000000000000000000000000000000000000000",
      amount: "1.0",
      token: "btc",
    }),
  });
  if (res4.status === 400) pass("Transfer API rejects unsupported token (400)");
  else fail(`Transfer API did not reject unsupported token (got ${res4.status})`);

  // Faucet API validation
  const res5 = await fetch(`${BASE}/api/faucet`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address: "invalid" }),
  });
  if (res5.status === 400) pass("Faucet API rejects invalid address (400)");
  else fail(`Faucet API did not reject invalid address (got ${res5.status})`);

  // Faucet API invalid token
  const res6 = await fetch(`${BASE}/api/faucet`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      address: "0x0000000000000000000000000000000000000000",
      token: "btc",
    }),
  });
  if (res6.status === 400) pass("Faucet API rejects unsupported token (400)");
  else fail(`Faucet API did not reject unsupported token (got ${res6.status})`);
}

// ── Main ──────────────────────────────────────────────

async function main() {
  console.log("🧪 PayAgent QA Test Suite");
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

  // Chat API tests (QA sections 1-3)
  await test_createWallet();
  await test_walletContext();
  await test_connectedWallet();
  await test_checkBalance();

  // REST API tests (QA section 9, 11)
  await test_balanceApi();
  await test_walletApi();
  await test_edgeCases();

  console.log(`\n══ Results: ${passed} passed, ${failed} failed ══\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
