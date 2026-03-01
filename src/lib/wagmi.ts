import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { baseSepolia } from "wagmi/chains";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
if (!projectId && typeof window !== "undefined") {
  console.warn(
    "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set. WalletConnect QR pairing will not work. " +
      "Get a free project ID at https://cloud.walletconnect.com/"
  );
}

export const config = getDefaultConfig({
  appName: "PayAgent",
  projectId: projectId || "placeholder",
  chains: [baseSepolia],
  ssr: true,
});
