# AGENTS.md

## Cursor Cloud specific instructions

### Architecture overview
- **Backend**: Python FastAPI app (`backend/server.py`) on port 8001, using MongoDB via Motor (async driver).
- **Frontend**: React 19 app (`frontend/`) using CRACO (CRA override), Tailwind CSS, shadcn/ui. Dev server on port 3000.
- **Database**: MongoDB 7.0 (no auth required for local dev).

### Starting services

1. **MongoDB**: `mongod --dbpath /tmp/mongodb/data --logpath /tmp/mongodb/log/mongod.log --bind_ip 127.0.0.1 --fork`
2. **Backend**: `cd /workspace/backend && MONGO_URL=mongodb://localhost:27017 DB_NAME=admin_panel uvicorn server:app --host 0.0.0.0 --port 8001 &`
3. **Frontend**: `cd /workspace/frontend && REACT_APP_BACKEND_URL=http://localhost:8001 BROWSER=none PORT=3000 yarn start &`

### Environment variables

| Variable | Value for local dev |
|---|---|
| `MONGO_URL` | `mongodb://localhost:27017` |
| `DB_NAME` | `admin_panel` |
| `REACT_APP_BACKEND_URL` | `http://localhost:8001` |

### Gotchas

- `emergentintegrations==0.1.0` in `backend/requirements.txt` is not available on PyPI and is not actually imported in `server.py`. Install with: `pip install $(grep -v emergentintegrations backend/requirements.txt | tr '\n' ' ')` or ignore the error — all needed packages install fine without it.
- The frontend has no lockfile (`yarn.lock`); `yarn install` generates one from scratch each time. This may cause version drift.
- ESLint v9 is specified in `devDependencies` but there's no `eslint.config.js` (flat config). CRA's built-in ESLint (v8) works during `yarn start`/`yarn build` via react-scripts, but running `npx eslint` standalone will fail without a flat config.
- Backend linters (`flake8`, `black`, `isort`) report pre-existing style issues in `server.py` — these are not regressions.

### Running tests

- **Backend integration tests**: `python3 backend_test.py` (requires backend running on the remote URL or adjust `base_url` in code). For local testing: `python3 -c "from backend_test import AdminPanelAPITester; t = AdminPanelAPITester('http://localhost:8001'); t.run_all_tests()"`
- **Backend linting**: `cd backend && flake8 server.py --max-line-length=120 && black --check server.py && isort --check-only server.py`
- **Frontend**: `cd frontend && yarn build` (compile check)

### Ports

| Service | Port |
|---|---|
| MongoDB | 27017 |
| Backend API | 8001 |
| Frontend dev server | 3000 |
