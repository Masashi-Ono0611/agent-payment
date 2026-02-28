import { NextResponse } from "next/server";
import { getCdpClient } from "@/lib/cdp";
import { createPublicClient, http, parseEther } from "viem";
import { baseSepolia } from "viem/chains";

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

// POST /api/transfer - Send a payment
export async function POST(request: Request) {
  try {
    const { fromName, to, amount, token = "eth" } = await request.json();

    if (!fromName || !to || !amount) {
      return NextResponse.json(
        { success: false, error: "fromName, to, and amount are required" },
        { status: 400 }
      );
    }

    const cdp = getCdpClient();
    const sender = await cdp.evm.getOrCreateAccount({ name: fromName });

    if (token === "eth") {
      // Send ETH using sendTransaction
      const baseAccount = await sender.useNetwork("base-sepolia");
      const { transactionHash } = await baseAccount.sendTransaction({
        transaction: {
          to: to as `0x${string}`,
          value: parseEther(amount),
        },
      });

      const receipt = await publicClient.waitForTransactionReceipt({
        hash: transactionHash,
      });

      return NextResponse.json({
        success: true,
        data: {
          transactionHash,
          from: sender.address,
          to,
          amount,
          token,
          status: receipt.status === "success" ? "confirmed" : "failed",
          explorerUrl: `https://sepolia.basescan.org/tx/${transactionHash}`,
        },
      });
    } else if (token === "usdc") {
      // Transfer USDC using the built-in transfer method
      const { transactionHash } = await sender.transfer({
        to: to as `0x${string}`,
        amount: BigInt(Math.round(parseFloat(amount) * 1e6)), // USDC has 6 decimals
        token: "usdc",
        network: "base-sepolia",
      });

      const receipt = await publicClient.waitForTransactionReceipt({
        hash: transactionHash,
      });

      return NextResponse.json({
        success: true,
        data: {
          transactionHash,
          from: sender.address,
          to,
          amount,
          token,
          status: receipt.status === "success" ? "confirmed" : "failed",
          explorerUrl: `https://sepolia.basescan.org/tx/${transactionHash}`,
        },
      });
    } else {
      return NextResponse.json(
        { success: false, error: `Unsupported token: ${token}` },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Transfer error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to send transfer",
      },
      { status: 500 }
    );
  }
}
