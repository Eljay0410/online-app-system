# IIS Deployment Checklist

## IIS Site

1. Install IIS URL Rewrite and Application Request Routing.
2. Enable ARR proxy on the server.
3. Run `npm run build`.
4. Point the IIS site physical path to the generated `dist` folder.
5. Keep `dist\web.config` in place. It serves React routes and proxies `/api` to Node on `127.0.0.1:5000`.

## Node API

Run the API as a background Windows service with PM2, NSSM, or another service manager.

```powershell
npm --prefix server install
npm --prefix server run build
npm --prefix server run start
```

The IIS `web.config` expects:

```env
SERVER_PORT=5000
CLIENT_URL=https://your-domain.example
CORS_ORIGIN=https://your-domain.example
TRUST_PROXY=1
```

## Upload Storage

Use a folder outside the app and outside the IIS public site, for example:

```text
D:\OASUploads
```

Set:

```env
UPLOAD_ROOT=D:\OASUploads
UPLOAD_MAX_FILE_SIZE_BYTES=15728640
UPLOAD_IMAGE_MAX_WIDTH=1600
UPLOAD_IMAGE_MAX_HEIGHT=1600
UPLOAD_IMAGE_QUALITY=82
UPLOAD_DISK_WARN_PERCENT=85
UPLOAD_CLEANUP_RETENTION_DAYS=30
RATE_LIMIT_UPLOAD_MAX=40
```

Grant modify permission on `D:\OASUploads` to the Windows account running the Node API service. Do not expose this folder as an IIS virtual directory; uploaded files are served through protected `/api/files/:id/:mode` routes.

On startup, the API now creates/checks `UPLOAD_ROOT` and logs:

```text
Upload storage ready at D:\OASUploads
```
