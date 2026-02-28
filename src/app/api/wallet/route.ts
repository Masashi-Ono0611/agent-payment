import { NextResponse } from "next/server";
import { getCdpClient } from "@/lib/cdp";

// POST /api/wallet - Create a new wallet (account)
export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    const cdp = getCdpClient();
    const account = await cdp.evm.getOrCreateAccount({
      name: name || `agent-wallet-${Date.now()}`,
    });

    return NextResponse.json({
      success: true,
      data: {
        name: name || account.address.slice(0, 10),
        address: account.address,
      },
    });
  } catch (error) {
    console.error("Wallet creation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create wallet",
      },
      { status: 500 }
    );
  }
}
