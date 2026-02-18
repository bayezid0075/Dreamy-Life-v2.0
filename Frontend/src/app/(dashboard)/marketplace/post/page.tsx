"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { marketplaceApi } from "@/lib/api/marketplace";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  Briefcase,
  Wallet,
  ImagePlus,
  Plus,
  Trash2,
  FileText,
  Coins,
  Upload,
  X,
} from "lucide-react";

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
  const [uploadingImages, setUploadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    const toUpload = Array.from(files).filter((f) => allowedTypes.includes(f.type));
    if (toUpload.length !== files.length) {
      toast.error("Only JPEG, PNG, GIF, and WebP images are allowed.");
    }
    if (!toUpload.length) return;
    setUploadingImages(true);
    try {
      for (const file of toUpload) {
        const { url } = await marketplaceApi.uploadJobImage(file);
        setImageUrls((prev) => [...prev, url]);
      }
      toast.success(toUpload.length === 1 ? "Image uploaded" : `${toUpload.length} images uploaded`);
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { detail?: string } } };
      toast.error(String(ax?.response?.data?.detail ?? "Upload failed"));
    } finally {
      setUploadingImages(false);
      e.target.value = "";
    }
  };

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
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-6 sm:space-y-8">
      {/* Back + Page title */}
      <header className="space-y-4">
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          Back to Marketplace
        </Link>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <span className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Briefcase className="h-4 w-4 sm:h-5 sm:w-5" />
            </span>
            Post a Job
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-xl">
            Budget will be reserved from your wallet until the job is completed or rejected.
          </p>
        </div>
      </header>

      {/* Wallet summary - always visible, compact on mobile */}
      <Card className="rounded-2xl border-border/50 bg-gradient-to-br from-muted/30 to-muted/10 shadow-sm overflow-hidden">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Available balance</p>
                <p className="text-xl sm:text-2xl font-bold tabular-nums">
                  ৳{available.toLocaleString()}
                </p>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground border-t sm:border-t-0 sm:border-l pt-3 sm:pt-0 sm:pl-4">
              Total budget will be locked when you submit.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Main form card */}
      <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="space-y-1 pb-4 sm:pb-6">
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            Job details
          </CardTitle>
          <CardDescription>
            Fill in the basics. Add images by URL or upload files to help workers understand the task.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
            {/* Title & Description */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium">
                  Job title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Data entry for 100 forms"
                  required
                  minLength={3}
                  className="rounded-xl h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Description <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the job requirements, deliverables, and any instructions..."
                  required
                  minLength={10}
                  rows={5}
                  className="rounded-xl resize-y min-h-[120px]"
                />
                <p className="text-xs text-muted-foreground">Rich text supported. Be clear so workers know what to deliver.</p>
              </div>
            </div>

            {/* Images: URL or file upload */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <ImagePlus className="h-4 w-4 text-muted-foreground" />
                Images (optional)
              </Label>
              <p className="text-xs text-muted-foreground">
                Paste image URLs or upload files (JPEG, PNG, GIF, WebP).
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl gap-1.5"
                  disabled={uploadingImages}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploadingImages ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {uploadingImages ? "Uploading…" : "Upload images"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addImageUrl}
                  className="rounded-xl gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  Add URL row
                </Button>
              </div>
              {/* Thumbnails for uploaded / pasted URLs */}
              {imageUrls.some(Boolean) && (
                <div className="flex flex-wrap gap-2">
                  {imageUrls.map(
                    (url, i) =>
                      url ? (
                        <div
                          key={`${i}-${url.slice(0, 30)}`}
                          className="relative group rounded-xl overflow-hidden border border-border bg-muted/30 w-20 h-20 shrink-0"
                        >
                          <img
                            src={url}
                            alt=""
                            className="object-cover w-full h-full"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6 rounded-full opacity-90 group-hover:opacity-100"
                            aria-label="Remove image"
                            onClick={() => removeImageUrl(i)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : null
                  )}
                </div>
              )}
              {/* URL input rows (for pasting links) */}
              <div className="space-y-2">
                {imageUrls.map((url, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      value={url}
                      onChange={(e) => setImageUrl(i, e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      type="url"
                      className="rounded-xl h-11 flex-1 min-w-0"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeImageUrl(i)}
                      className="rounded-xl h-11 w-11 shrink-0"
                      aria-label="Remove row"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Work type */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Work type</Label>
              <RadioGroup
                value={workType}
                onValueChange={(v) => setWorkType(v as "single" | "multi")}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              >
                <label
                  htmlFor="single"
                  className={`flex items-center gap-3 rounded-xl border-2 p-4 cursor-pointer transition-colors ${
                    workType === "single"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <RadioGroupItem value="single" id="single" className="shrink-0" />
                  <div>
                    <span className="font-medium block">Single unit</span>
                    <span className="text-xs text-muted-foreground">One task, fixed price</span>
                  </div>
                </label>
                <label
                  htmlFor="multi"
                  className={`flex items-center gap-3 rounded-xl border-2 p-4 cursor-pointer transition-colors ${
                    workType === "multi"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <RadioGroupItem value="multi" id="multi" className="shrink-0" />
                  <div>
                    <span className="font-medium block">Multi unit</span>
                    <span className="text-xs text-muted-foreground">Price per unit, multiple quantity</span>
                  </div>
                </label>
              </RadioGroup>
            </div>

            {/* Price & Quantity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Label htmlFor="price" className="text-sm font-medium flex items-center gap-1.5">
                  <Coins className="h-4 w-4 text-muted-foreground" />
                  {workType === "single" ? "Fixed price (৳)" : "Price per unit (৳)"}
                </Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  placeholder="0.00"
                  className="rounded-xl h-11"
                />
              </div>
              {workType === "multi" && (
                <div className="space-y-2">
                  <Label htmlFor="units" className="text-sm font-medium">
                    Total quantity
                  </Label>
                  <Input
                    id="units"
                    type="number"
                    min="1"
                    value={totalQuantity}
                    onChange={(e) => setTotalQuantity(e.target.value)}
                    required
                    className="rounded-xl h-11"
                  />
                </div>
              )}
            </div>

            {/* Budget summary */}
            <div
              className={`rounded-xl p-4 sm:p-5 text-sm ${
                totalBudget > available
                  ? "bg-destructive/10 text-destructive border border-destructive/20"
                  : "bg-muted/50 border border-border/50"
              }`}
            >
              <p className="font-medium">
                Total budget to reserve: <strong className="tabular-nums">৳{totalBudget.toLocaleString()}</strong>
              </p>
              {totalBudget > available && totalBudget > 0 && (
                <p className="mt-1.5">Insufficient balance. Add funds to your wallet first.</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
              <Link href="/marketplace" className="sm:flex-1 order-2 sm:order-1">
                <Button type="button" variant="outline" className="w-full sm:w-auto rounded-xl" size="lg">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                className="rounded-xl w-full sm:flex-[2] h-12 font-medium order-1 sm:order-2"
                size="lg"
                disabled={!canPost || loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  "Submit for approval"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
