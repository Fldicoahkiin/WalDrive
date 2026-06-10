import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getFaucetHost, requestSuiFromFaucetV2 } from "@mysten/sui/faucet";
import { useWallet } from "@/stores/walletStore";
import { useSettings } from "@/stores/settingsStore";

export type FaucetStatus = "idle" | "loading" | "ok" | "error";

/** Request free gas from the network faucet for the active wallet (not on mainnet). */
export function useFaucet() {
  const address = useWallet((s) => s.address);
  const network = useSettings((s) => s.network);
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<FaucetStatus>("idle");
  const available = network !== "mainnet";

  const request = useCallback(async () => {
    if (!address || !available) return false;
    setStatus("loading");
    try {
      await requestSuiFromFaucetV2({
        host: getFaucetHost(network as "testnet" | "devnet" | "localnet"),
        recipient: address,
      });
      setStatus("ok");
      setTimeout(() => queryClient.invalidateQueries({ queryKey: ["balance"] }), 2000);
      setTimeout(() => setStatus("idle"), 3000);
      return true;
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
      return false;
    }
  }, [address, network, available, queryClient]);

  return { request, status, available };
}
