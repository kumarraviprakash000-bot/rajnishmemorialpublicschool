import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallAppButton({
  variant = "outline",
  className,
}: {
  variant?: "default" | "outline" | "secondary";
  className?: string;
}) {
  const [deferred, setDeferred] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as InstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    if (window.matchMedia("(display-mode: standalone)").matches) setInstalled(true);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  return (
    <div className={className}>
      <Button
        variant={variant}
        size="lg"
        onClick={() => {
          if (deferred) {
            void deferred.prompt().then(() => setDeferred(null));
            return;
          }
          setShowHelp(true);
        }}
      >
        <Download className="size-4" /> Download App
      </Button>
      {showHelp && !deferred ? (
        <p className="mt-2 max-w-xs text-xs text-muted-foreground">
          Browser menu (⋮) kholein aur <strong>“Add to Home screen” / “Install app”</strong> par tap karein.
        </p>
      ) : null}
    </div>
  );
}
