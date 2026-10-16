import { getHealth } from "@/lib/api";
import { cn } from "@/lib/cn";

export async function ApiStatus() {
  const health = await getHealth();
  const online = health !== null;

  return (
    <p
      className={cn(
        "inline-flex items-center gap-2 rounded-pill border-2 px-4 py-2 text-sm font-semibold",
        online
          ? "border-primary/30 bg-primary-soft text-foreground"
          : "border-coral/40 bg-coral-soft text-foreground",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "size-2.5 rounded-full",
          online ? "bg-primary" : "bg-coral",
        )}
      />
      {online ? "API e banco de dados no ar" : "API offline no momento"}
    </p>
  );
}

export function ApiStatusFallback() {
  return (
    <p className="inline-flex items-center gap-2 rounded-pill border-2 border-border bg-surface px-4 py-2 text-sm font-semibold text-muted">
      <span aria-hidden className="size-2.5 rounded-full bg-border" />
      Verificando a API…
    </p>
  );
}
