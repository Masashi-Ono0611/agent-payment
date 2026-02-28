import { createOpenAI } from "@ai-sdk/openai";
import { streamText, convertToModelMessages, stepCountIs } from "ai";
import { z } from "zod";
import { getCdpClient } from "@/lib/cdp";
import { createPublicClient, http, formatEther, parseEther } from "viem";
import { baseSepolia } from "viem/chains";

export const maxDuration = 60;

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as const;
const ERC20_ABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Proxy mangles tool names in streaming: create_wallet → CreateWallet_tool
// Build reverse mapping to fix them in the SSE stream
const TOOL_NAMES = [
  "create_wallet",
  "list_wallets",
  "check_balance",
  "request_faucet",
  "send_payment",
];

function snakeToPascalTool(snake: string): string {
  return (
    snake
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join("") + "_tool"
  );
}

const MANGLED_TO_ORIGINAL: Record<string, string> = {};
for (const name of TOOL_NAMES) {
  MANGLED_TO_ORIGINAL[snakeToPascalTool(name)] = name;
}

// Custom fetch that fixes mangled tool names in SSE stream
function createFixedFetch(): typeof globalThis.fetch {
  return async (input, init) => {
    const res = await globalThis.fetch(input, init);
    if (!res.body) return res;

    const transformStream = new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        let text = new TextDecoder().decode(chunk);
        // Fix mangled tool names: CreateWallet_tool → create_wallet
        for (const [mangled, original] of Object.entries(MANGLED_TO_ORIGINAL)) {
          text = text.replaceAll(`"${mangled}"`, `"${original}"`);
        }
        // Fix tool_calls index: proxy sends index:1 instead of 0
        text = text.replaceAll('"index":1,"id":"toolu_', '"index":0,"id":"toolu_');
        text = text.replaceAll('"index":1,"function"', '"index":0,"function"');
        controller.enqueue(new TextEncoder().encode(text));
      },
    });

    return new Response(res.body.pipeThrough(transformStream), {
      status: res.status,
      statusText: res.statusText,
      headers: res.headers,
    });
  };
}

const SYSTEM_PROMPT = `You are PayAgent, an AI payment assistant on Base Sepolia testnet.
You help users manage crypto wallets and send payments through natural language.

You have access to these tools:
- create_wallet: Create a new agent wallet
- check_balance: Check ETH and USDC balance of a wallet
- send_payment: Send ETH or USDC from an agent wallet to any address
- request_faucet: Get testnet ETH or USDC from the faucet
- list_wallets: List all agent wallets

Guidelines:
- Be concise and friendly. Use short responses.
- Always confirm the details before sending a payment (amount, token, recipient).
- When showing addresses, abbreviate them (0x1234...abcd).
- When a user says "send X to Y", figure out which wallet to send from. If they only have one wallet, use that. If multiple, ask which one.
- Proactively suggest getting faucet funds if a wallet has zero balance.
- After successful transactions, share the BaseScan explorer link.
- You work on Base Sepolia testnet - remind users this is testnet if they seem confused about real funds.
- Format currency amounts nicely (e.g., "0.001 ETH", "5.00 USDC").`;

export async function POST(req: Request) {
  const { messages: uiMessages, wallets, connectedAddress } = await req.json();
  const modelMessages = await convertToModelMessages(uiMessages);

  // Build dynamic system prompt with wallet context
  const knownWallets = wallets as { name: string; address: string }[] | undefined;
  let systemPrompt = SYSTEM_PROMPT;
  if (connectedAddress) {
    systemPrompt += `\n\nThe user has connected their browser wallet: ${connectedAddress}\nYou can use this as a recipient address when the user says "send to my wallet" or "send to me".`;
  }
  if (knownWallets && knownWallets.length > 0) {
    const walletList = knownWallets
      .map((w: { name: string; address: string }) => `- "${w.name}": ${w.address}`)
      .join("\n");
    systemPrompt += `\n\nThe user has the following agent wallets:\n${walletList}\nUse these when the user refers to a wallet by name or asks about their wallets.`;
  }

  const provider = createOpenAI({
    baseURL: process.env.ANTHROPIC_BASE_URL + "/v1",
    apiKey: process.env.ANTHROPIC_AUTH_TOKEN,
    fetch: createFixedFetch(),
  });

  const tools = {
      create_wallet: {
        description: "Create a new agent wallet with a given name",
        inputSchema: z.object({
          name: z.string().describe("Name for the wallet, e.g. 'My Agent'"),
        }),
        execute: async ({ name }: { name: string }) => {
          const cdp = getCdpClient();
          const account = await cdp.evm.getOrCreateAccount({ name });
          return { success: true, name, address: account.address };
        },
      },

      list_wallets: {
        description:
          "List all agent wallets that have been created in this session. Call this when user asks about their wallets.",
        inputSchema: z.object({}),
        execute: async () => {
          return { success: true, signal: "LIST_WALLETS" };
        },
      },

      check_balance: {
        description:
          "Check the ETH and USDC balance of a wallet address on Base Sepolia",
        inputSchema: z.object({
          address: z.string().describe("The wallet address to check"),
        }),
        execute: async ({ address }: { address: string }) => {
          const addr = address as `0x${string}`;
          const [ethBalance, usdcBalance] = await Promise.all([
            publicClient.getBalance({ address: addr }),
            publicClient
              .readContract({
                address: USDC_ADDRESS,
                abi: ERC20_ABI,
                functionName: "balanceOf",
                args: [addr],
              })
              .catch(() => 0n),
          ]);
          return {
            success: true,
            address,
            eth: formatEther(ethBalance),
            usdc: (Number(usdcBalance) / 1e6).toFixed(6),
          };
        },
      },

      request_faucet: {
        description:
          "Request testnet ETH or USDC from the Base Sepolia faucet for a wallet",
        inputSchema: z.object({
          address: z.string().describe("The wallet address to fund"),
          token: z.enum(["eth", "usdc"]).describe("Which token to request"),
        }),
        execute: async ({
          address,
          token,
        }: {
          address: string;
          token: "eth" | "usdc";
        }) => {
          const cdp = getCdpClient();
          const { transactionHash } = await cdp.evm.requestFaucet({
            address: address as `0x${string}`,
            network: "base-sepolia",
            token,
          });
          await publicClient.waitForTransactionReceipt({
            hash: transactionHash,
          });
          return {
            success: true,
            token,
            transactionHash,
            explorerUrl: `https://sepolia.basescan.org/tx/${transactionHash}`,
          };
        },
      },

      send_payment: {
        description:
          "Send ETH or USDC from an agent wallet to a recipient address on Base Sepolia",
        inputSchema: z.object({
          fromWalletName: z
            .string()
            .describe("Name of the sender agent wallet"),
          toAddress: z
            .string()
            .describe("Recipient wallet address (0x...)"),
          amount: z
            .string()
            .describe("Amount to send as a decimal string, e.g. '0.001'"),
          token: z.enum(["eth", "usdc"]).describe("Token to send"),
        }),
        execute: async ({
          fromWalletName,
          toAddress,
          amount,
          token,
        }: {
          fromWalletName: string;
          toAddress: string;
          amount: string;
          token: "eth" | "usdc";
        }) => {
          const cdp = getCdpClient();
          const sender = await cdp.evm.getOrCreateAccount({
            name: fromWalletName,
          });

          let transactionHash: `0x${string}`;

          if (token === "eth") {
            const baseAccount = await sender.useNetwork("base-sepolia");
            const result = await baseAccount.sendTransaction({
              transaction: {
                to: toAddress as `0x${string}`,
                value: parseEther(amount),
              },
            });
            transactionHash = result.transactionHash;
          } else {
            const result = await sender.transfer({
              to: toAddress as `0x${string}`,
              amount: BigInt(Math.round(parseFloat(amount) * 1e6)),
              token: "usdc",
              network: "base-sepolia",
            });
            transactionHash = result.transactionHash;
          }

          const receipt = await publicClient.waitForTransactionReceipt({
            hash: transactionHash,
          });

          return {
            success: receipt.status === "success",
            from: sender.address,
            to: toAddress,
            amount,
            token,
            transactionHash,
            explorerUrl: `https://sepolia.basescan.org/tx/${transactionHash}`,
          };
        },
      },
  };

  const result = streamText({
    model: provider.chat("claude-sonnet-4-20250514"),
    system: systemPrompt,
    messages: modelMessages,
    stopWhen: stepCountIs(5),
    tools,
  });

  return result.toUIMessageStreamResponse();
}
