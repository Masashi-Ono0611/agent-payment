import { NextResponse } from "next/server";
import { getCdpClient } from "@/lib/cdp";
import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

// POST /api/faucet - Request testnet funds
export async function POST(request: Request) {
  try {
    const { address, token = "eth" } = await request.json();

    if (!address) {
      return NextResponse.json(
        { success: false, error: "Address is required" },
        { status: 400 }
      );
    }

    const cdp = getCdpClient();
    const { transactionHash } = await cdp.evm.requestFaucet({
      address,
      network: "base-sepolia",
      token,
    });

    // Wait for confirmation
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: transactionHash,
    });

    return NextResponse.json({
      success: true,
      data: {
        transactionHash,
        status: receipt.status === "success" ? "confirmed" : "failed",
        explorerUrl: `https://sepolia.basescan.org/tx/${transactionHash}`,
      },
    });
  } catch (error) {
    console.error("Faucet error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to request faucet",
      },
      { status: 500 }
    );
  }
}
