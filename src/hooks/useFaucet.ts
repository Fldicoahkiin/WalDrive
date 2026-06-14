import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getFaucetHost, requestSuiFromFaucetV2 } from "@mysten/sui/faucet";
import { useWallet } from "@/stores/walletStore";
import { useSettings } from "@/stores/settingsStore";

export type FaucetStatus = "idle" | "loading" | "ok" | "error";

/**
 * Request free gas for the active wallet. testnet's programmatic faucet is
 * effectively closed — it answers every API caller with HTTP 429 and points to
 * the captcha-gated web UI — so only devnet/localnet can self-serve over the
 * API (`programmatic`). Everywhere else, send the user to `webFaucetUrl`
 * (their address is pre-filled).
 */
export function useFaucet() {
  const address = useWallet((s) => s.address);
  const network = useSettings((s) => s.network);
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<FaucetStatus>("idle");
  const available = network !== "mainnet";
  const programmatic = network === "devnet" || network === "localnet";
  const webFaucetUrl = address ? `https://faucet.sui.io/?address=${address}` : "https://faucet.sui.io/";

  const request = useCallback(async () => {
    if (!address || !available || !programmatic) return false;
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
      // Keep the error state until the user acts so the web-faucet fallback
      // stays visible.
      setStatus("error");
      return false;
    }
  }, [address, network, available, programmatic, queryClient]);

  return { request, status, available, programmatic, webFaucetUrl };
}
