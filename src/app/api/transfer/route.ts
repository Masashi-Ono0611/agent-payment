import { NextResponse } from "next/server";
import { isAddress, parseEther } from "viem";
import { getCdpClient } from "@/lib/cdp";
import { publicClient, parseUsdcUnits } from "@/lib/viem";

export const maxDuration = 60;

// POST /api/transfer - Send a payment
export async function POST(request: Request) {
  try {
    const { fromName, to, amount, token = "eth" } = await request.json();

    if (
      typeof fromName !== "string" ||
      !fromName ||
      typeof to !== "string" ||
      !to ||
      typeof amount !== "string" ||
      !amount
    ) {
      return NextResponse.json(
        { success: false, error: "fromName, to, and amount are required (all strings)" },
        { status: 400 }
      );
    }

    if (!/^\d+(\.\d+)?$/.test(amount)) {
      return NextResponse.json(
        { success: false, error: "amount must be a positive decimal number" },
        { status: 400 }
      );
    }

    if (!isAddress(to, { strict: false })) {
      return NextResponse.json(
        { success: false, error: "Invalid recipient address" },
        { status: 400 }
      );
    }

    if (token !== "eth" && token !== "usdc") {
      return NextResponse.json(
        { success: false, error: `Unsupported token: ${token}` },
        { status: 400 }
      );
    }

    const cdp = getCdpClient();
    const sender = await cdp.evm.getOrCreateAccount({ name: fromName });

    let transactionHash: `0x${string}`;

    if (token === "eth") {
      const baseAccount = await sender.useNetwork("base-sepolia");
      const result = await baseAccount.sendTransaction({
        transaction: {
          to,
          value: parseEther(amount),
        },
      });
      transactionHash = result.transactionHash;
    } else {
      const result = await sender.transfer({
        to,
        amount: parseUsdcUnits(amount),
        token: "usdc",
        network: "base-sepolia",
      });
      transactionHash = result.transactionHash;
    }

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
  } catch (error) {
    console.error("Transfer error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to send transfer",
      },
      { status: 500 }
    );
  }
}
