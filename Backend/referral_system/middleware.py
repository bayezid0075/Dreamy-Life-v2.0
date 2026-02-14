"""
Exempt /api/ from CSRF so JWT-authenticated API clients (SPA, mobile) are not blocked.
"""
from django.middleware.csrf import CsrfViewMiddleware


class DisableCSRFForAPI(CsrfViewMiddleware):
    """
    Same as CsrfViewMiddleware but skip CSRF check for any path that contains '/api/'.
    Use this *instead* of CsrfViewMiddleware so API requests (JWT auth) are not blocked.
    """

    def process_view(self, request, view_func, view_args, view_kwargs):
        if "/api/" in request.path:
            return None  # skip CSRF check
        return super().process_view(request, view_func, view_args, view_kwargs)
