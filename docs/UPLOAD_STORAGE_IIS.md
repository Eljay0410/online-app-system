# Upload Storage Strategy for IIS Deployment

This project uses React JSX, Express, and PostgreSQL. Uploaded requirement files should not be stored in PostgreSQL or inside the OS/app disk.

## Recommended Disk Layout

Use a separate local partition on the same server, for example:

```text
D:\OASUploads
```

Set this in production:

```env
UPLOAD_ROOT=D:\OASUploads
UPLOAD_MAX_FILE_SIZE_BYTES=15728640
UPLOAD_IMAGE_MAX_WIDTH=1600
UPLOAD_IMAGE_MAX_HEIGHT=1600
UPLOAD_IMAGE_QUALITY=82
UPLOAD_DISK_WARN_PERCENT=85
UPLOAD_CLEANUP_RETENTION_DAYS=30
DB_POOL_MAX=20
DB_POOL_IDLE_TIMEOUT_MS=30000
DB_POOL_CONNECTION_TIMEOUT_MS=5000
DB_QUERY_TIMEOUT_MS=30000
DB_STATEMENT_TIMEOUT_MS=30000
RATE_LIMIT_UPLOAD_MAX=40
```

Keep `UPLOAD_ROOT` outside the app folder and outside the IIS site static files folder. Do not expose it as a public virtual directory.

## What Goes in PostgreSQL

PostgreSQL stores only metadata:

- file id
- owner/applicant id
- application/job id
- requirement field/label
- original filename
- generated stored filename
- relative path
- MIME type
- size
- checksum
- status
- timestamps

The binary file stays on `UPLOAD_ROOT`.

## Upload Safety

The Express upload route uses:

- `multipart/form-data`
- per-file size limit
- allowed MIME type list
- basic file signature validation
- generated UUID filenames
- folder organization by applicant, job/application, and date
- image resize/compression through `sharp`
- upload rate limiting

Files are organized like:

```text
D:\OASUploads\applicants\{userId}\applications\{jobOpeningId}\YYYY\MM\DD\generated-file-name.ext
```

## In-Site Preview

The React UI previews files inside a modal. It does not expose raw server paths.

- Images render directly.
- PDFs render inside an embedded viewer.
- Text files can render inline.
- Word, Excel, and PowerPoint files use a secure download fallback unless a PDF conversion service is added later.

The browser fetches files from protected Express routes using the logged-in user's auth token, then renders a local `blob:` URL in the modal.

## Access Control

Protected routes serve files only when allowed:

- applicants can view their own uploaded files
- admins and superadmins can view applicant files for review

Raw disk paths are never returned to the browser.

## Pagination and Indexing

Admin application listing now supports `limit` and `offset`, and database indexes were added for common application/file queries.

Indexes help PostgreSQL find rows faster. They do not solve upload/storage/server load by themselves. Upload slowdowns usually come from disk I/O, oversized files, image processing, app worker saturation, network throughput, antivirus scanning, or a full disk. File limits, separate storage, rate limits, cleanup, monitoring, and backups are still required.

## Monitoring

Use:

```text
GET /api/admin/storage
```

for upload disk usage and file counts. In production, also monitor:

- free space on `UPLOAD_ROOT`
- Windows Event Viewer disk warnings
- IIS/node process memory and CPU
- PostgreSQL connection count
- upload request duration and 413/429 errors

Alert before the disk reaches the configured warning threshold.

## Backup Strategy

Back up both:

- PostgreSQL database
- `UPLOAD_ROOT`

Use matching backup windows so database metadata and disk files remain consistent. A database backup without uploaded files is incomplete.

Recommended:

- daily incremental file backup
- weekly full file backup
- scheduled PostgreSQL dump/base backup
- periodic restore test
- exclude temp/quarantine folders if added later

## Cleanup Rules

The app marks replaced or removed uploads as non-active. A scheduled cleanup task should delete non-active files after `UPLOAD_CLEANUP_RETENTION_DAYS`.

Suggested Windows Task Scheduler job:

```text
Daily off-peak cleanup script:
- call POST /api/admin/storage/cleanup with an admin token, or run an equivalent server-side script
- the endpoint purges up to 200 replaced/deleted files older than retention per run
- keep the scheduler output as an audit trail
```

Do not immediately hard-delete files during user actions unless your backup and audit policy allows it.
