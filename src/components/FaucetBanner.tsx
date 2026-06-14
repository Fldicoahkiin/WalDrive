import { openExternal } from "@/lib/openExternal";
import { Check, Droplet, ExternalLink, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/Button";
import { useBalance } from "@/hooks/useBalance";
import { useFaucet } from "@/hooks/useFaucet";

/**
 * First-run nudge: a brand-new wallet has no SUI, so registering files on-chain
 * would fail. Shown while the balance is zero; disappears once gas arrives.
 * The one-click request retries with backoff (testnet is rate-limited); the web
 * faucet stays available as a fallback there and after a failure.
 */
export function FaucetBanner() {
  const { data: balance, isLoading } = useBalance();
  const { request, status, available, rateLimited, webFaucetUrl } = useFaucet();

  if (!available || isLoading || (balance ?? 0) > 0) return null;
  const loading = status === "loading";
  const failed = status === "error";
  const showWeb = rateLimited || failed;

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between gap-3 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3"
      initial={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-sm text-ink">Your wallet needs gas to store files.</span>
        <span className="text-xs text-ink-subtle">
          {failed
            ? "The faucet is busy right now. Open the web faucet — captcha-gated, address pre-filled."
            : rateLimited
              ? "Testnet's faucet is rate-limited — “Get test SUI” retries for a slot, or use the web faucet."
              : "Storing a file records it on Sui, which costs a little gas. It's free."}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {showWeb && (
          <Button
            size="sm"
            variant={failed ? "primary" : "secondary"}
            onPress={() => openExternal(webFaucetUrl)}
          >
            <ExternalLink className="size-3.5" />
            Web faucet
          </Button>
        )}
        <Button isDisabled={loading} size="sm" variant="primary" onPress={request}>
          {loading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : status === "ok" ? (
            <Check className="size-3.5" />
          ) : (
            <Droplet className="size-3.5" />
          )}
          {loading ? "Requesting…" : status === "ok" ? "On its way" : "Get free test SUI"}
        </Button>
      </div>
    </motion.div>
  );
}
