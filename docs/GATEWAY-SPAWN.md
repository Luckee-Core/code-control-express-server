# Code Control API — gateway spawn profile

When **code-control-express-dispatcher-server** (`3055`) spawns the API, it sets:

| Variable | Value |
|----------|--------|
| `PORT` | `3082` |
| `STORAGE_MODE` | `remote` |
| `CODE_CONTROL_STORAGE_URL` | `http://127.0.0.1:3080` |
| `CODE_CONTROL_STORAGE_SECRET` | Same as storage `STORAGE_DISPATCHER_SECRET` |

Studio Hub: `PORT=3012`, `CODE_CONTROL_STORAGE_URL=http://127.0.0.1:3080`, `CODE_CONTROL_STORAGE_SECRET`.

Laptop: `MAIN_GATEWAY_URL=http://<STUDIO>:3010`, `DISPATCHER_GATE_SECRET` only.

Do not use `3082` and `3012` at the same time on one host unless only one process is running.
