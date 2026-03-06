'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Loader2, ImageIcon, ExternalLink } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { bannersApi, type BannerSlideAdmin } from '@/lib/api/banners';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function imageUrl(banner: BannerSlideAdmin): string {
  if (banner.image_url) return banner.image_url;
  if (banner.image && typeof banner.image === 'string' && banner.image.startsWith('http')) return banner.image;
  if (banner.image) return `${API_BASE}${banner.image}`;
  return '';
}

export default function AdminBannersPage() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerSlideAdmin | null>(null);
  const [deleteBanner, setDeleteBanner] = useState<BannerSlideAdmin | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formLink, setFormLink] = useState('');
  const [formOrder, setFormOrder] = useState(0);
  const [formActive, setFormActive] = useState(true);
  const [formImage, setFormImage] = useState<File | null>(null);

  const { data: banners = [], isLoading } = useQuery({
    queryKey: ['admin-banners'],
    queryFn: () => bannersApi.adminList(),
  });

  const createMutation = useMutation({
    mutationFn: (fd: FormData) => bannersApi.adminCreate(fd),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      queryClient.invalidateQueries({ queryKey: ['banners'] });
      toast.success('Banner created');
      closeForm();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, fd }: { id: number; fd: FormData }) => bannersApi.adminUpdate(id, fd),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      queryClient.invalidateQueries({ queryKey: ['banners'] });
      toast.success('Banner updated');
      closeForm();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => bannersApi.adminDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      queryClient.invalidateQueries({ queryKey: ['banners'] });
      toast.success('Banner deleted');
      setDeleteBanner(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function openCreate() {
    setEditingBanner(null);
    setFormTitle('');
    setFormLink('');
    setFormOrder(banners.length);
    setFormActive(true);
    setFormImage(null);
    setIsFormOpen(true);
  }

  function openEdit(b: BannerSlideAdmin) {
    setEditingBanner(b);
    setFormTitle(b.title || '');
    setFormLink(b.link || '');
    setFormOrder(b.order ?? 0);
    setFormActive(b.is_active ?? true);
    setFormImage(null);
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingBanner(null);
    setFormImage(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData();
    fd.append('title', formTitle);
    fd.append('link', formLink);
    fd.append('order', String(formOrder));
    fd.append('is_active', formActive ? 'true' : 'false');
    if (formImage) fd.append('image', formImage);

    if (editingBanner) {
      updateMutation.mutate({ id: editingBanner.id, fd });
    } else {
      if (!formImage) {
        toast.error('Please select an image');
        return;
      }
      createMutation.mutate(fd);
    }
  }

  const pending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Banners</h1>
          <p className="text-muted-foreground">
            Manage slider images and links shown on the mobile dashboard
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Banner
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Banners ({banners.length})</CardTitle>
          <CardDescription>
            Only active banners appear in the app. Order by &quot;Order&quot; (lower = first).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-40 rounded-lg" />
              ))}
            </div>
          ) : banners.length === 0 ? (
            <div className="text-center py-12 border border-dashed rounded-lg">
              <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-1">No banners yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add an image and link to show in the dashboard slider
              </p>
              <Button onClick={openCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Add Banner
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {banners.map((b) => (
                <div
                  key={b.id}
                  className="rounded-xl border bg-card overflow-hidden"
                >
                  <div className="aspect-video bg-muted relative">
                    {imageUrl(b) ? (
                      <img
                        src={imageUrl(b)}
                        alt={b.title || 'Banner'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <ImageIcon className="h-10 w-10 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex gap-1">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(b)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setDeleteBanner(b)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {!b.is_active && (
                      <div className="absolute bottom-2 left-2">
                        <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium">
                          Inactive
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-3 space-y-1">
                    <p className="font-medium text-sm truncate">{b.title || 'Untitled'}</p>
                    {b.link ? (
                      <a
                        href={b.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:underline flex items-center gap-1 truncate"
                      >
                        <ExternalLink className="h-3 w-3 shrink-0" />
                        <span className="truncate">{b.link}</span>
                      </a>
                    ) : (
                      <p className="text-xs text-muted-foreground">No link</p>
                    )}
                    <p className="text-xs text-muted-foreground">Order: {b.order}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={(open) => !open && closeForm()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingBanner ? 'Edit Banner' : 'Add Banner'}</DialogTitle>
            <DialogDescription>
              {editingBanner
                ? 'Update image and link. Leave image empty to keep current.'
                : 'Upload an image and set the link users will go to when they tap the slide.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="banner-image">
                Image {editingBanner && '(leave empty to keep current)'}
              </Label>
              <Input
                id="banner-image"
                type="file"
                accept="image/*"
                className="mt-1"
                onChange={(e) => setFormImage(e.target.files?.[0] ?? null)}
              />
            </div>
            <div>
              <Label htmlFor="banner-title">Title (optional, for admin reference)</Label>
              <Input
                id="banner-title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. Summer Sale"
              />
            </div>
            <div>
              <Label htmlFor="banner-link">Link URL</Label>
              <Input
                id="banner-link"
                type="url"
                value={formLink}
                onChange={(e) => setFormLink(e.target.value)}
                placeholder="https://... or /dashboard"
              />
            </div>
            <div>
              <Label htmlFor="banner-order">Order (lower = first)</Label>
              <Input
                id="banner-order"
                type="number"
                min={0}
                value={formOrder}
                onChange={(e) => setFormOrder(parseInt(e.target.value, 10) || 0)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="banner-active"
                checked={formActive}
                onCheckedChange={(v) => setFormActive(v === true)}
              />
              <Label htmlFor="banner-active">Active (show in slider)</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeForm}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingBanner ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteBanner} onOpenChange={(open) => !open && setDeleteBanner(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete banner</AlertDialogTitle>
            <AlertDialogDescription>
              Remove this banner from the slider? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteBanner && deleteMutation.mutate(deleteBanner.id)}
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
