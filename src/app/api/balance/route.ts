import { NextResponse } from "next/server";
import { createPublicClient, http, formatEther } from "viem";
import { baseSepolia } from "viem/chains";

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

// USDC contract on Base Sepolia
const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as const;
const ERC20_ABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// GET /api/balance?address=0x...
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address") as `0x${string}`;

    if (!address) {
      return NextResponse.json(
        { success: false, error: "Address is required" },
        { status: 400 }
      );
    }

    const [ethBalance, usdcBalance] = await Promise.all([
      publicClient.getBalance({ address }),
      publicClient
        .readContract({
          address: USDC_ADDRESS,
          abi: ERC20_ABI,
          functionName: "balanceOf",
          args: [address],
        })
        .catch(() => 0n),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        eth: formatEther(ethBalance),
        usdc: (Number(usdcBalance) / 1e6).toFixed(6),
      },
    });
  } catch (error) {
    console.error("Balance check error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to check balance",
      },
      { status: 500 }
    );
  }
}
