import { Check, Droplet, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/Button";
import { useBalance } from "@/hooks/useBalance";
import { useFaucet } from "@/hooks/useFaucet";

/**
 * First-run nudge: a brand-new wallet has no SUI, so registering files on-chain
 * would fail. Shown while the balance is zero; disappears once gas arrives.
 */
export function FaucetBanner() {
  const { data: balance, isLoading } = useBalance();
  const { request, status, available } = useFaucet();

  if (!available || isLoading || (balance ?? 0) > 0) return null;

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between gap-3 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3"
      initial={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-sm text-ink">Your wallet is ready — it just needs gas.</span>
        <span className="text-xs text-ink-subtle">
          Storing a file records it on Sui, which costs a little SUI. Testnet SUI is free.
        </span>
      </div>
      <Button
        className="shrink-0"
        isDisabled={status === "loading"}
        size="sm"
        variant={status === "error" ? "danger" : "primary"}
        onPress={request}
      >
        {status === "loading" ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : status === "ok" ? (
          <Check className="size-3.5" />
        ) : (
          <Droplet className="size-3.5" />
        )}
        {status === "ok" ? "On its way" : status === "error" ? "Failed — retry" : "Get free test SUI"}
      </Button>
    </motion.div>
  );
}
