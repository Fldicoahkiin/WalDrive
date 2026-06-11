import { Check, Droplet, ExternalLink, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/Button";
import { useBalance } from "@/hooks/useBalance";
import { useFaucet } from "@/hooks/useFaucet";

/**
 * First-run nudge: a brand-new wallet has no SUI, so registering files on-chain
 * would fail. Shown while the balance is zero; disappears once gas arrives.
 * The faucet API rate-limits by IP, so after a failure we hand over to the web
 * faucet (captcha-gated, reliably works).
 */
export function FaucetBanner() {
  const { data: balance, isLoading } = useBalance();
  const { request, status, available, webFaucetUrl } = useFaucet();

  if (!available || isLoading || (balance ?? 0) > 0) return null;
  const failed = status === "error";

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between gap-3 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3"
      initial={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-sm text-ink">
          {failed ? "The faucet API is rate-limited right now." : "Your wallet is ready — it just needs gas."}
        </span>
        <span className="text-xs text-ink-subtle">
          {failed
            ? "Open the web faucet instead — it has a captcha and works. Your address is pre-filled."
            : "Storing a file records it on Sui, which costs a little SUI. Testnet SUI is free."}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {failed && (
          <Button size="sm" variant="primary" onPress={() => window.open(webFaucetUrl, "_blank")}>
            <ExternalLink className="size-3.5" />
            Open web faucet
          </Button>
        )}
        <Button
          isDisabled={status === "loading"}
          size="sm"
          variant={failed ? "secondary" : "primary"}
          onPress={request}
        >
          {status === "loading" ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : status === "ok" ? (
            <Check className="size-3.5" />
          ) : (
            <Droplet className="size-3.5" />
          )}
          {status === "ok" ? "On its way" : failed ? "Retry" : "Get free test SUI"}
        </Button>
      </div>
    </motion.div>
  );
}
