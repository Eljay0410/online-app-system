# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Production server settings

Set these values in the deployment environment:

```env
NODE_ENV=production
SERVER_PORT=5000
CLIENT_URL=https://your-frontend-domain.example
CORS_ORIGIN=https://your-frontend-domain.example
TRUST_PROXY=1
JSON_BODY_LIMIT=10mb
UPLOAD_ROOT=D:\OASUploads
UPLOAD_MAX_FILE_SIZE_BYTES=15728640
UPLOAD_IMAGE_MAX_WIDTH=1600
UPLOAD_IMAGE_MAX_HEIGHT=1600
UPLOAD_IMAGE_QUALITY=82
UPLOAD_DISK_WARN_PERCENT=85
UPLOAD_CLEANUP_RETENTION_DAYS=30
RATE_LIMIT_API_MAX=600
RATE_LIMIT_LOGIN_MAX=5
RATE_LIMIT_REGISTER_MAX=8
RATE_LIMIT_EMAIL_ACTION_MAX=5
RATE_LIMIT_ACTIVATION_MAX=20
RATE_LIMIT_AUTH_WRITE_MAX=120
RATE_LIMIT_UPLOAD_MAX=40
SESSION_TOKEN_MINUTES=30
```

Run `npm run migrate` before deployment so the database-backed limiter table is available.

For IIS, build the client with `npm run build` and point the IIS site to the
generated `dist` folder. The `public/web.config` file is copied into `dist`
during build and expects the Node API to run on `127.0.0.1:5000`.
