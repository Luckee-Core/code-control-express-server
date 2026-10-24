# Code Control API — gateway spawn profile

When **code-control-express-dispatcher-server** (`3055`) spawns the API, it sets:

| Variable | Value |
|----------|--------|
| `PORT` | `3082` |
| `STORAGE_MODE` | `remote` |
| `STORAGE_EXPRESS_URL` | `http://127.0.0.1:3080` |
| `STORAGE_EXPRESS_SECRET` | Same as storage `STORAGE_DISPATCHER_SECRET` |

Hub or manual development typically uses `PORT=3012` and `STORAGE_EXPRESS_URL` pointing at studio or laptop storage per [DEPLOYMENT.md](./DEPLOYMENT.md).

Do not use `3082` and `3012` at the same time on one host unless only one process is running.
