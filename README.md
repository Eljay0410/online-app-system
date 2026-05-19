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
CLIENT_URL=https://your-frontend-domain.example
CORS_ORIGIN=https://your-frontend-domain.example
TRUST_PROXY=1
JSON_BODY_LIMIT=10mb
RATE_LIMIT_API_MAX=600
RATE_LIMIT_LOGIN_MAX=5
RATE_LIMIT_REGISTER_MAX=8
RATE_LIMIT_EMAIL_ACTION_MAX=5
RATE_LIMIT_ACTIVATION_MAX=20
RATE_LIMIT_AUTH_WRITE_MAX=120
```

Run `npm run migrate` before deployment so the database-backed limiter table is available.
