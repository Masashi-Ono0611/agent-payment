import { NextResponse } from "next/server";
import { isAddress, formatEther } from "viem";
import { publicClient, USDC_ADDRESS, ERC20_ABI, formatUsdcUnits } from "@/lib/viem";

export const maxDuration = 30;

// GET /api/balance?address=0x...
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");

    if (!address || !isAddress(address, { strict: false })) {
      return NextResponse.json(
        { success: false, error: "Valid address is required" },
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
        usdc: formatUsdcUnits(usdcBalance as bigint),
      },
    });
  } catch (error) {
    console.error("Balance check error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to check balance",
      },
      { status: 500 }
    );
  }
}
