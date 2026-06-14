import { openExternal } from "@/lib/openExternal";
import { Check, Droplet, ExternalLink, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/Button";
import { useBalance } from "@/hooks/useBalance";
import { useFaucet } from "@/hooks/useFaucet";

/**
 * First-run nudge: a brand-new wallet has no SUI, so registering files on-chain
 * would fail. Shown while the balance is zero; disappears once gas arrives.
 * testnet's programmatic faucet is closed, so there we point straight at the
 * captcha-gated web faucet; devnet/localnet can grab gas in one click.
 */
export function FaucetBanner() {
  const { data: balance, isLoading } = useBalance();
  const { request, status, available, programmatic, webFaucetUrl } = useFaucet();

  if (!available || isLoading || (balance ?? 0) > 0) return null;
  const useWeb = !programmatic || status === "error";

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between gap-3 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3"
      initial={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-sm text-ink">
          {useWeb ? "Your wallet needs gas to store files." : "Your wallet is ready — it just needs gas."}
        </span>
        <span className="text-xs text-ink-subtle">
          {useWeb
            ? "Testnet's auto-faucet is closed. Open the web faucet — captcha-gated, with your address pre-filled."
            : "Storing a file records it on Sui, which costs a little gas. Devnet SUI is free."}
        </span>
      </div>
      <div className="shrink-0">
        {useWeb ? (
          <Button size="sm" variant="primary" onPress={() => openExternal(webFaucetUrl)}>
            <ExternalLink className="size-3.5" />
            Open web faucet
          </Button>
        ) : (
          <Button isDisabled={status === "loading"} size="sm" variant="primary" onPress={request}>
            {status === "loading" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : status === "ok" ? (
              <Check className="size-3.5" />
            ) : (
              <Droplet className="size-3.5" />
            )}
            {status === "ok" ? "On its way" : "Get free test SUI"}
          </Button>
        )}
      </div>
    </motion.div>
  );
}
