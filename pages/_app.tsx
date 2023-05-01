import "@/styles/globals.css";
import { getDefaultWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import type { AppProps } from "next/app";
import { configureChains, createClient, sepolia, WagmiConfig } from "wagmi";
import { mainnet } from "wagmi/chains";
import { publicProvider } from "wagmi/providers/public";

export default function App({ Component, pageProps }: AppProps) {
  const { chains, provider } = configureChains(
    [mainnet, sepolia],
    [publicProvider()]
  );

  const { connectors } = getDefaultWallets({
    appName: "LitDemo",
    projectId: "YOUR_PROJECT_ID",
    chains,
  });

  const wagmiClient = createClient({
    autoConnect: true,
    connectors,
    provider,
  });
  return (
    <WagmiConfig client={wagmiClient}>
      <RainbowKitProvider chains={chains}>
        <Component {...pageProps} />
      </RainbowKitProvider>
    </WagmiConfig>
  );
}
