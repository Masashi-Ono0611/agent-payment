import { CdpClient } from "@coinbase/cdp-sdk";

let cdpClient: CdpClient | null = null;

export function getCdpClient(): CdpClient {
  if (!cdpClient) {
    const apiKeyId = process.env.CDP_API_KEY_ID;
    const apiKeySecret = process.env.CDP_API_KEY_SECRET;
    const walletSecret = process.env.CDP_WALLET_SECRET;

    if (!apiKeyId || !apiKeySecret || !walletSecret) {
      throw new Error(
        "Missing CDP credentials. Set CDP_API_KEY_ID, CDP_API_KEY_SECRET, and CDP_WALLET_SECRET in .env.local"
      );
    }

    cdpClient = new CdpClient({
      apiKeyId,
      apiKeySecret,
      walletSecret,
    });
  }

  return cdpClient;
}
