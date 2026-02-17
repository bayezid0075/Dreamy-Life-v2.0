"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { marketplaceApi } from "@/lib/api/marketplace";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function PostJobPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [workType, setWorkType] = useState<"single" | "multi">("single");
  const [price, setPrice] = useState("");
  const [totalQuantity, setTotalQuantity] = useState("1");
  const [imageUrls, setImageUrls] = useState<string[]>([""]);

  const { data: walletCheck } = useQuery({
    queryKey: ["marketplace-wallet-check"],
    queryFn: () => marketplaceApi.walletCheck(),
  });

  const totalBudget =
    workType === "single"
      ? parseFloat(price) || 0
      : (parseFloat(price) || 0) * (parseInt(totalQuantity, 10) || 0);
  const available = walletCheck ? parseFloat(walletCheck.available_balance) : 0;
  const canPost = totalBudget > 0 && totalBudget <= available;

  const addImageUrl = () => setImageUrls((prev) => [...prev, ""]);
  const setImageUrl = (i: number, v: string) =>
    setImageUrls((prev) => {
      const next = [...prev];
      next[i] = v;
      return next;
    });
  const removeImageUrl = (i: number) =>
    setImageUrls((prev) => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPost) {
      toast.error("Insufficient wallet balance or invalid amount");
      return;
    }
    setLoading(true);
    try {
      const images = imageUrls
        .map((url) => url.trim())
        .filter(Boolean)
        .map((url, order) => ({ image_url: url, order }));
      await marketplaceApi.createJob({
        title: title.trim(),
        description: description.trim(),
        work_type: workType,
        price: parseFloat(price),
        total_quantity: workType === "single" ? 1 : Math.max(1, parseInt(totalQuantity, 10)),
        images: images.length ? images : undefined,
      });
      queryClient.invalidateQueries({ queryKey: ["marketplace-my-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["marketplace-wallet-check"] });
      toast.success("Job submitted for admin approval");
      router.push("/marketplace/my-jobs");
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { detail?: string } } };
      const msg = ax?.response?.data?.detail ?? "Failed to post job";
      toast.error(String(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Post a Job</h1>
        <p className="text-muted-foreground mt-1">
          Budget will be reserved from your wallet until the job is completed or rejected.
        </p>
      </div>

      <Card className="rounded-2xl border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle>Job details</CardTitle>
          <CardDescription>
            Available balance: ৳{available.toLocaleString()}. Total budget will be locked.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Job Title (required)</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Data entry for 100 forms"
                required
                minLength={3}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (rich text supported)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the job requirements..."
                required
                minLength={10}
                rows={6}
                className="rounded-xl resize-y"
              />
            </div>
            <div className="space-y-2">
              <Label>Image URLs (optional)</Label>
              {imageUrls.map((url, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={url}
                    onChange={(e) => setImageUrl(i, e.target.value)}
                    placeholder="https://..."
                    type="url"
                    className="rounded-xl"
                  />
                  <Button type="button" variant="outline" size="icon" onClick={() => removeImageUrl(i)} className="rounded-xl">
                    −
                  </Button>
                </div>
              ))}
              <Button type="button" variant="ghost" size="sm" onClick={addImageUrl} className="rounded-xl">
                + Add image URL
              </Button>
            </div>
            <div className="space-y-2">
              <Label>Work Type</Label>
              <RadioGroup value={workType} onValueChange={(v) => setWorkType(v as "single" | "multi")} className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="single" id="single" />
                  <Label htmlFor="single" className="font-normal">Single unit (fixed price)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="multi" id="multi" />
                  <Label htmlFor="multi" className="font-normal">Multi unit (price per unit)</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">{workType === "single" ? "Fixed Price (৳)" : "Price per unit (৳)"}</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  className="rounded-xl"
                />
              </div>
              {workType === "multi" && (
                <div className="space-y-2">
                  <Label htmlFor="units">Total quantity</Label>
                  <Input
                    id="units"
                    type="number"
                    min="1"
                    value={totalQuantity}
                    onChange={(e) => setTotalQuantity(e.target.value)}
                    required
                    className="rounded-xl"
                  />
                </div>
              )}
            </div>
            <div className="rounded-xl bg-muted/50 p-4 text-sm">
              Total budget to reserve: <strong>৳{totalBudget.toLocaleString()}</strong>
              {totalBudget > available && (
                <p className="text-destructive mt-1">Insufficient balance. Add funds first.</p>
              )}
            </div>
            <Button type="submit" className="rounded-xl w-full" size="lg" disabled={!canPost || loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit for approval"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
