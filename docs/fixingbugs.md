Fix document viewing, vacancy details uniformity, and Applicant Management pagination/filtering/UI.

Scope:
1. Uploaded document/file preview modal
2. Vacancy details view for Superadmin, Admin, and Applicant
3. Applicant Management page/table/cards
4. Applicant Management backend/API pagination, search, and filtering

A. Uploaded DOC/DOCX viewing issue

Current issue:
When a user uploads a document file such as .doc or .docx, it does not support viewing inside the modal.

Required fix:
1. Fix uploaded document viewing inside the modal.
2. Supported preview should include common file types:
   - PDF
   - Images
   - DOC
   - DOCX
3. If DOC/DOCX cannot be previewed directly by the browser, implement a proper solution.
4. Use a safe document preview library/package if needed.
5. If using npm package/library, choose a stable and appropriate package for React document preview.
6. If direct preview is not possible, provide a fallback:
   - show file name
   - show file type
   - show Download button
   - show Open in new tab if supported
7. Do not allow the modal to break or show blank content.
8. Keep Back button behavior working:
   - Back from document preview should return to the previous modal/details view.
   - It should not close the whole modal.
   - It should not redirect to the wrong page.
9. Make document preview modal responsive for mobile.

B. Uniform Vacancy Details view for all roles

Current issue:
The Admin/Superadmin view of vacancy details is different from the Applicant view.

Required fix:
Make the Vacancy Details view uniform across:
- Superadmin
- Admin
- Applicant

Behavior:
1. The vacancy details layout/content shown to Superadmin and Admin should match the Applicant vacancy details view.
2. Reuse a shared VacancyDetails component if possible.
3. Keep role-specific actions separate from the shared content.
   Example:
   - Applicant may see Apply button if applicable.
   - Admin/Superadmin may see Edit/Delete/Manage buttons if applicable.
4. The main vacancy content should be the same:
   - Vacancy title/position
   - Office/school/place of assignment if available
   - Salary grade/salary if available
   - Education
   - Training
   - Experience
   - Eligibility
   - Vacancy description/duties if available
   - Application deadline and time
   - Status
   - List of Requirements
5. Do not create different content structures per role.
6. Make the design consistent, clean, and responsive on mobile.
7. Do not remove role-specific permissions or actions; just separate them from the uniform details view.

C. Applicant Management applications count UI

Current issue:
In Applicant Management, the Applications section is shown as a pill/badge, but it should only be a count.

Required fix:
1. Remove the pill/badge style for applications count.
2. Show applications as plain counting text or simple number only.
3. Example:
   - Applications: 3
   - or just 3 under the Applications column
4. Keep the table clean and consistent.

D. Applicant Management pagination

Applicant Management must use proper pagination.

Required behavior:
1. Do not fetch all applicants at once.
2. Fetch only the first page on initial load.
3. When user clicks Next, fetch the next page from the backend.
4. When user clicks Back/Previous, fetch the previous page from the backend.
5. Pagination must be server-side, not frontend-only slicing.
6. API should support:
   - page
   - limit
   - search
   - letter filter
   - date filter if already existing
7. Show loading state while fetching new page.
8. Show empty state if no data.
9. Keep total count or total pages if backend supports it.
10. Avoid overwhelming the server.

Backend optimization:
1. Use skip/take or equivalent pagination.
2. Use select to return only needed table fields.
3. Do not include full uploaded files or full applications in the table response.
4. Use counts for uploaded files/applications instead of loading full records.
5. Fetch detailed applicant data only when View Details is clicked.
6. Avoid N+1 queries.
7. Add/confirm indexes for:
   - UAN
   - email
   - name fields if searchable
   - createdAt
   - applicant/user id
8. Validate pagination values.

E. Applicant Management mobile view

Fix mobile responsiveness for Applicant Management.

Required behavior:
1. Table/page should work well on mobile.
2. Do not just shrink the desktop table.
3. On mobile, use either:
   - horizontal scroll table, or
   - responsive content cards
4. Content cards should show key information clearly:
   - UAN
   - full name
   - email
   - contact number
   - applications count
   - uploaded files count
   - actions
5. Buttons should be easy to tap.
6. Modals should fit on mobile screens.
7. Modal body should scroll if content is long.
8. Header and footer actions should remain accessible.
9. Keep desktop view unchanged as much as possible.

F. Applicant Management letter filtering

Add letter filtering to Applicant Management.

Required behavior:
1. Add an A-Z letter filter.
2. Admin can click a letter to filter applicants by starting letter.
3. The filter should apply to the applicant’s name, preferably last name if available, otherwise first name/full name depending on current data model.
4. Add an “All” option to clear letter filter.
5. Letter filter must be server-side.
6. Do not fetch all applicants just to filter by letter on the frontend.
7. When letter filter changes:
   - reset to page 1
   - fetch filtered data from backend
8. Letter filter should work together with:
   - pagination
   - search
   - date filter if available
9. Keep the UI clean and not cluttered.

G. Applicant Management search by UAN

Fix Applicant Management search.

Required behavior:
1. UAN must be searchable.
2. Search should support:
   - UAN
   - full name
   - email
3. Search should be server-side.
4. Add debounce on frontend search input.
5. When search changes:
   - reset to page 1
   - fetch results from backend
6. Do not fetch all records before searching.

H. Remove duplicated UAN text under UAN title

Current issue:
There is already a column/card label titled “UAN”, but below it the value still displays as something like:
“UAN-actual uan”

Required fix:
1. Keep the column/header label as “UAN”.
2. Under the UAN column/card field, show only the actual UAN value.
3. Remove unnecessary duplicated prefix text.
4. Example:
   - Header: UAN
   - Value: 2026-000123
5. Do not display:
   - UAN-2026-000123
   - UAN: 2026-000123
   if the label/header already says UAN.

I. Implementation requirements

1. Find uploaded file/document preview modal/component.
2. Fix DOC/DOCX preview or add a safe fallback/download/open behavior.
3. Find Admin/Superadmin vacancy details view.
4. Find Applicant vacancy details view.
5. Create or reuse one shared VacancyDetails component for uniform display.
6. Keep role-specific buttons/actions outside the shared content section.
7. Find Applicant Management page/table/cards.
8. Remove pill style from applications count.
9. Add server-side pagination.
10. Add server-side letter filtering.
11. Add server-side UAN/name/email search.
12. Fix mobile responsive layout and content cards.
13. Fix duplicated UAN display text.
14. Optimize backend queries and avoid fetching all records.
15. Keep existing UI style as much as possible.
16. Do not remove unrelated functionality.
17. Provide complete updated code for every affected file.
18. Mention the exact file path for each updated file.

Important:
- DOC/DOCX uploaded files should not break the modal.
- Vacancy details should be uniform for Superadmin, Admin, and Applicant.
- Applicant Management must not fetch all data at once.
- Pagination, search, and letter filtering must be backend-driven.
- UAN should be searchable.
- Remove duplicated UAN prefix/value display.
- Make Applicant Management mobile-friendly.

Additional fix for Applicant List pagination behavior and optimization:

Apply the same optimized pagination behavior to the Admin Applicant List.

Current issue:
Applicant List pagination should not load all application/applicant records at once. It must behave like a real server-side paginated table.

Required behavior:
1. On initial page load, fetch only the first page of Applicant List records.
2. Do not fetch all applicants/applications and then slice/filter on the frontend.
3. When admin clicks Next, fetch the next page from the backend.
4. When admin clicks Previous/Back, fetch the previous page from the backend.
5. When admin changes filters or search, reset the pagination to page 1.
6. Show a loading state while fetching page data.
7. Show an empty state if no records match the current filters.
8. Keep current page, total pages, total records, and limit/page size accurate.
9. Disable Previous button on the first page.
10. Disable Next button on the last page.
11. Make pagination work together with:
    - search
    - position filter from Position Library
    - date filter modal
    - status filter if existing
12. Remove the old All Schools filter if still present.
13. Keep the table UI clean and responsive.

Backend/API optimization:
1. Applicant List API must support server-side:
   - page
   - limit
   - search
   - positionId
   - status
   - dateFrom
   - dateTo
2. Use optimized database queries.
3. Use skip/take or equivalent pagination.
4. Use `select` to return only fields needed for the table.
5. Do not include full uploaded documents/files in the list response.
6. Do not include huge nested applicant/application data in the list response.
7. Use counts or lightweight summary fields where needed.
8. Fetch full applicant/application details only when the admin opens View Details.
9. Avoid N+1 queries.
10. Add or confirm indexes for:
    - application createdAt/submittedAt
    - application status
    - applicant/user id
    - vacancy id
    - position id
    - UAN if searchable
    - applicant name/email if searchable
11. Validate pagination parameters:
    - page must be at least 1
    - limit must have a safe maximum
12. Return a consistent response shape, for example:
    {
      data: [...],
      pagination: {
        page,
        limit,
        totalRecords,
        totalPages,
        hasNextPage,
        hasPreviousPage
      }
    }

Frontend requirements:
1. Applicant List should request data using current page and filters.
2. Do not store all records just for pagination.
3. Debounce search input if search exists.
4. When applying date filter, position filter, status filter, or search, reset page to 1.
5. Keep pagination state synced with the current API response.
6. Do not overwhelm the server with repeated requests.
7. Avoid duplicate API calls on initial render.
8. Cancel or ignore stale requests if filters change quickly.
9. Keep View Details modal fetching full details only when needed.
10. Make sure pagination works on mobile too.

Important:
- Applicant List and Applicant Management should both use backend-driven pagination.
- Do not fetch all data at once.
- Filters and search must be applied on the backend.
- The list/table response should stay lightweight.
- Full details should only load when View Details is clicked.