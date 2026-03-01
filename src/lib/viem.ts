import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";

export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

export const USDC_ADDRESS =
  "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as const;

export const ERC20_ABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

/**
 * Parse a decimal USDC amount string to its smallest unit (6 decimals).
 * Avoids floating-point precision loss by operating on string parts.
 */
export function parseUsdcUnits(amount: string): bigint {
  const [whole = "0", frac = ""] = amount.split(".");
  const paddedFrac = (frac + "000000").slice(0, 6);
  return BigInt(whole) * 1_000_000n + BigInt(paddedFrac);
}

/** Format USDC smallest units to human-readable string (6 decimals). */
export function formatUsdcUnits(units: bigint): string {
  const whole = units / 1_000_000n;
  const frac = units % 1_000_000n;
  return `${whole}.${frac.toString().padStart(6, "0")}`;
}
