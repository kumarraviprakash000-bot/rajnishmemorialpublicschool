import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Phone } from "lucide-react";
import { getMyPhone, updateMyPhone } from "@/lib/profile.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function MyPhoneCard() {
  const fetchPhone = useServerFn(getMyPhone);
  const savePhone = useServerFn(updateMyPhone);
  const current = useQuery({ queryKey: ["my-phone"], queryFn: () => fetchPhone({ data: undefined }) });
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (current.data?.phone) setPhone(current.data.phone);
  }, [current.data?.phone]);

  const submit = async () => {
    setBusy(true);
    try {
      const res = await savePhone({ data: { phone } });
      if (!res.ok) {
        toast.error(res.message);
        return;
      }
      toast.success("Mobile number save ho gaya. Ab isi number se login karein.");
      void current.refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Number save nahi ho paya.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card-surface space-y-3 p-5">
      <div className="flex items-center gap-2">
        <Phone className="size-4 text-primary" />
        <h2 className="font-semibold">Mera mobile number</h2>
      </div>
      <p className="text-xs text-muted-foreground">
        Apna personal number yahan likhein — isi number par OTP aayega aur login hoga.
      </p>
      <div className="space-y-2">
        <Label htmlFor="my-phone">Mobile number</Label>
        <Input
          id="my-phone"
          type="tel"
          inputMode="numeric"
          maxLength={10}
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
          placeholder="98XXXXXXXX"
        />
      </div>
      <Button onClick={() => void submit()} disabled={busy || phone.length !== 10}>
        {busy ? "Saving…" : "Number save karein"}
      </Button>
    </div>
  );
}
