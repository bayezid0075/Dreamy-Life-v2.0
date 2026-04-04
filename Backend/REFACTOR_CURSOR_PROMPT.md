# Dreamy-Life Backend Refactor Prompt

Use this prompt in Cursor for further automated refactor tasks:

You are a senior Django backend engineer. Refactor this project with a production-safe, backward-compatible architecture.

Goals:
1. Keep all existing API contracts and behavior unchanged.
2. Use modular architecture:
   - apps/users, apps/mlm, apps/wallet, apps/payments, apps/notifications
   - core/services, core/selectors, core/tasks, core/utils
   - config/settings (base/dev/prod)
3. Ensure views are thin, business logic in services, read-queries in selectors.
4. Keep migrations and existing app labels stable.
5. Add production runtime with Gunicorn + Redis + Celery worker.
6. Add tests for services/selectors and registration/payment critical flows.

Execution constraints:
- Refactor incrementally (copy, wire, verify, then remove legacy logic).
- Never break existing endpoint paths.
- Preserve validation and permission checks.
- Add docstrings and minimal clear comments where needed.

Implementation order:
1) Move one flow at a time to service + selector + task.
2) Wire view to call service.
3) Run checks/tests.
4) Remove old duplicated logic after parity is confirmed.

