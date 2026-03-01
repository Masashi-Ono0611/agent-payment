import { formatEther } from "viem";
import { publicClient, USDC_ADDRESS, ERC20_ABI, formatUsdcUnits } from "./viem";

export interface BalanceResult {
  eth: string;
  usdc: string;
}

/**
 * Get ETH and USDC balances for an address on Base Sepolia.
 * 
 * @param address - The wallet address to check (must be a valid 0x address)
 * @returns Object containing eth and usdc balance as formatted strings
 */
export async function getBalances(address: `0x${string}`): Promise<BalanceResult> {
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

  return {
    eth: formatEther(ethBalance),
    usdc: formatUsdcUnits(usdcBalance as bigint),
  };
}
