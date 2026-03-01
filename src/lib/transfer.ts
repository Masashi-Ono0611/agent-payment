import { parseEther } from "viem";
import { getCdpClient } from "./cdp";
import { publicClient, parseUsdcUnits } from "./viem";

export interface TransferParams {
  fromWalletName: string;
  toAddress: `0x${string}`;
  amount: string;
  token: "eth" | "usdc";
}

export interface TransferResult {
  success: boolean;
  from: string;
  to: string;
  amount: string;
  token: "eth" | "usdc";
  transactionHash: `0x${string}`;
  explorerUrl: string;
}

/**
 * Execute a transfer of ETH or USDC from an agent wallet to a recipient.
 * 
 * @param params - Transfer parameters
 * @returns Transfer result with transaction details
 * @throws Error if the transfer fails
 */
export async function executeTransfer(params: TransferParams): Promise<TransferResult> {
  const { fromWalletName, toAddress, amount, token } = params;

  const cdp = getCdpClient();
  const sender = await cdp.evm.getOrCreateAccount({ name: fromWalletName });

  let transactionHash: `0x${string}`;

  if (token === "eth") {
    const baseAccount = await sender.useNetwork("base-sepolia");
    const result = await baseAccount.sendTransaction({
      transaction: {
        to: toAddress,
        value: parseEther(amount),
      },
    });
    transactionHash = result.transactionHash;
  } else {
    const result = await sender.transfer({
      to: toAddress,
      amount: parseUsdcUnits(amount),
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
}
