from django.db import models


class BannerSlide(models.Model):
    """A slide for the dashboard image slider. Admin can add image + link."""

    title = models.CharField(max_length=120, blank=True, help_text="Optional label (e.g. for admin list)")
    image = models.ImageField(upload_to="banners/%Y/%m/", blank=False)
    link = models.URLField(max_length=500, blank=True, help_text="Where to go when user taps the slide")
    order = models.PositiveIntegerField(default=0, help_text="Lower = shown first")
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return self.title or f"Banner #{self.pk}"
