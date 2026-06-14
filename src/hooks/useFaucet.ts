import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getFaucetHost, requestSuiFromFaucetV2 } from "@mysten/sui/faucet";
import { useWallet } from "@/stores/walletStore";
import { useSettings } from "@/stores/settingsStore";

export type FaucetStatus = "idle" | "loading" | "ok" | "error";

/**
 * Request free gas for the active wallet. devnet/localnet serve it on the first
 * try; testnet's API works too (no captcha) but is globally rate-limited
 * (HTTP 429 — the token bucket is contended), so there we retry with backoff to
 * catch a free slot. Callers should still offer `webFaucetUrl` as a fallback.
 * mainnet has no faucet.
 */
export function useFaucet() {
  const address = useWallet((s) => s.address);
  const network = useSettings((s) => s.network);
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<FaucetStatus>("idle");
  const available = network !== "mainnet";
  const rateLimited = network === "testnet";
  const webFaucetUrl = address ? `https://faucet.sui.io/?address=${address}` : "https://faucet.sui.io/";

  const request = useCallback(async () => {
    if (!address || !available) return false;
    setStatus("loading");
    // testnet's bucket is contended — space out a handful of tries (~40s) to hit
    // a free slot. devnet/localnet answer on the first try.
    const backoff = rateLimited ? [0, 6000, 6000, 8000, 8000, 10000] : [0];
    for (const delay of backoff) {
      if (delay) await new Promise((r) => setTimeout(r, delay));
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
        // 429 (or transient) — keep retrying on the rate-limited testnet path.
      }
    }
    setStatus("error");
    return false;
  }, [address, network, available, rateLimited, queryClient]);

  return { request, status, available, rateLimited, webFaucetUrl };
}
