Fix the My Applications view, Vacancy Post navigation, and Application Details UI consistency.

Context:
In the applicant side, there is a “My Applications” page. When the applicant views an application they applied for, a modal opens showing the application/vacancy details and uploaded requirements.

Required fixes:

1. Uploaded requirements document/file preview navigation
When viewing uploaded requirements from the My Applications application details modal:
- If the applicant opens/views an uploaded document or uploaded file, then clicks the Back button from the document/file view, it should return to the previous application details modal/view.
- It should NOT close the whole modal.
- It should NOT return to the wrong page.
- It should NOT exit My Applications.
- Preserve the previous modal state so the applicant can continue viewing the application details and uploaded requirements.
- This should work for all supported uploaded file/document preview views.

2. Remove duplicate Vacancy Post button
There are currently two Vacancy Post buttons, making it redundant.
- Remove the duplicate Vacancy Post button.
- Make sure only one Vacancy Post button remains.
- Keep the correct button based on the best UX and current layout.
- Do not remove any needed navigation or action connected to viewing the vacancy post.

3. Back button behavior from Vacancy Post view
When the user opens/views a Vacancy Post from My Applications or Application Details:
- Clicking Back should return the user to where they came from.
- If they came from My Applications, Back should return to My Applications/application details modal.
- If they came from another vacancy list/page, Back should return to that source page.
- Do not always hardcode Back to one route.
- Preserve navigation state or use history navigation properly so the user returns to the previous screen.

4. Make Application Details view consistent with Vacancy Post view
The Application Details view/modal should match the layout and content style of the posted Vacancy view.
- Use the same structure, spacing, labels, sections, and visual hierarchy as the Vacancy Post details view.
- The content should feel uniform between “view application details” and “view vacancy post”.
- Do not create a completely different layout for application details if a vacancy post layout already exists.

5. Still show applicant uploaded requirements
Even if Application Details should match the Vacancy Post details view, it must still show what the applicant uploaded.
- Show the vacancy/post information like the Vacancy Post view.
- Also show the applicant’s uploaded requirements/documents connected to that application.
- The uploaded requirements section should be clear and separate from the vacancy’s List of Requirements.
- The applicant should be able to view each uploaded file/document without losing the modal/page state.

Expected content structure:
Application Details should include:
- Vacancy title/position
- Office/department/school if available
- Salary grade/salary if available
- Place of assignment if available
- Job/Vacancy description or duties if available
- Qualification standards if available
- List of Requirements from the vacancy/position library
- Applicant uploaded requirements/documents
- Application status
- Date applied/submitted if available
- Other existing important application details

Wording rules:
- Replace visible “Job” or “Jobs” wording with “Vacancy” or “Vacancies” where applicable.
- Rename “Upload Requirements” to “List of Requirements” only when referring to the vacancy’s required documents.
- For files already submitted by the applicant, use labels like:
  - Uploaded Requirements
  - Submitted Documents
  - Uploaded Documents
Choose the label that best matches the existing UI, but keep it clear that these are the applicant’s uploaded files.

Implementation requirements:
1. Find the My Applications page/components.
2. Find the application details modal/view.
3. Find the uploaded file/document preview component or route.
4. Find the Vacancy Post details page/modal.
5. Reuse or align the Vacancy Post details layout for Application Details.
6. Fix Back button navigation so it returns to the previous view/source instead of closing or redirecting incorrectly.
7. Remove the duplicate Vacancy Post button and leave only one.
8. Preserve modal state when previewing uploaded documents/files.
9. Keep existing application data, uploaded file viewing, and status display working.
10. Keep existing desktop design as much as possible.
11. Ensure the fixed view is also responsive on mobile.
12. Do not remove unrelated features.
13. Do not change unrelated logic.
14. Provide the complete updated code for every affected file.
15. Mention the exact path of each updated file.

Important:
- Back from document/file preview must return to the application details modal, not close everything.
- Back from Vacancy Post view must return to the actual previous screen.
- Application Details should look uniform with the Vacancy Post details view.
- Application Details must still show what the applicant uploaded.
- Only one Vacancy Post button should remain.

Additional Admin Side fixes and new Applicant Management module:

A. Applicant List date/time filter UI cleanup

In the Admin Applicant List page, clean up the current time/date filtering UI.

Current problem:
The date/time filtration takes too much space and makes the page look cluttered.

Required behavior:
1. Replace the visible date/time filter fields with one clean filter button.
2. The button should have a date/calendar icon.
3. Button label can be:
   - Filter by Date
   - Date Filter
   - Date Range
4. When the admin clicks the date filter button, open a modal.
5. The modal content should allow filtering by:
   - Specific date
   - Start date
   - End date
   - Date range from Start Date to End Date
6. Include clear modal actions:
   - Apply Filter
   - Clear Filter
   - Cancel / Close
7. After applying the filter, show a small active filter indicator/chip near the button so the admin knows a date filter is active.
8. The Applicant List table should update based on the selected date filter.
9. Keep the existing table layout and other filters/search as much as possible.
10. Do not remove existing applicant list functionality.

B. Add Applicant Management to sidebar

Add a new sidebar menu item called:
Applicant Management

This should be available on the admin side.

Purpose:
Applicant Management is a separate admin page where admins can view all applicant users and manage their basic information.

C. Applicant Management page requirements

Create a new Applicant Management page.

The page should display all applicant users in a table, similar to the existing Applicant List table UI.

Applicant Management table should include important applicant/user details such as:
- UAN
- Full name
- Email
- Contact number
- Account status if available
- Date registered
- Number/status of applications if available
- Uploaded files/documents count if available
- Actions column

Actions should include:
- View details
- Edit basic information

Important restriction:
Admins can edit basic applicant information similar to what Superadmin can do, but admins must NOT be able to deactivate accounts.

D. Applicant Management details view/modal

When clicking View Details:
Show applicant/user details, including:
- UAN
- Full name
- Email
- Contact number
- Address if available
- Personal/basic profile details if available
- Uploaded files/documents
- Applications submitted by the applicant if available
- Application statuses if available
- Date registered
- Last updated if available

For uploaded files:
- Show uploaded file/document names clearly.
- Allow admin to view/open uploaded files if the current system already supports it.
- Preserve modal/page state when viewing uploaded files.
- Do not break existing file preview behavior.

E. Applicant Management edit modal

When clicking Edit Basic Information:
Allow admin to edit only safe/basic user information, such as:
- First name
- Middle name
- Last name
- Suffix if available
- Contact number
- Address/basic profile fields if already editable in the system

Do NOT allow admin to:
- Change applicant role
- Change password directly unless already safely supported
- Deactivate account
- Delete account
- Modify uploaded documents unless already supported
- Modify application status from this page unless explicitly existing behavior supports it

F. Applicant Management date filtration

Use the same clean date filter UI and logic as Applicant List:
1. A single date filter button with a calendar/date icon.
2. Opens a date filter modal.
3. Modal supports specific date, start date, end date, and date range.
4. Has Apply Filter, Clear Filter, and Cancel/Close.
5. Shows active filter indicator/chip after applying.
6. Updates the Applicant Management table based on the selected date filter.

G. Backend/API performance and optimization

Important:
The Applicant Management page may load many users, uploaded files, and applications, so optimize properly.

Backend requirements:
1. Use pagination for Applicant Management list.
2. Use server-side search and filters.
3. Use date range filtering on the backend.
4. Do not fetch all users, all uploaded files, and all applications at once.
5. Avoid overloading the server.
6. Only return the fields needed for the table list.
7. Fetch detailed applicant data only when View Details is clicked.
8. Add or confirm proper database indexing for:
   - user/applicant ID
   - UAN
   - email
   - createdAt/dateRegistered
   - application applicant/user relation
   - uploaded file applicant/user relation if applicable
9. Avoid N+1 queries.
10. Use selective includes/selects instead of returning full nested objects.
11. If using Prisma, use `select`, `skip`, `take`, `where`, and proper relation counts.
12. If showing uploaded file/application counts, use efficient counts instead of loading all records.
13. Keep API response payload small.
14. Add backend validation for date filters and pagination values.
15. Ensure the table still works smoothly even with many applicants.

H. Frontend performance and UX

Frontend requirements:
1. Use pagination on Applicant Management table.
2. Debounce search input if there is search.
3. Keep loading states clear.
4. Show empty states when no applicants match the filter.
5. Keep modals scrollable on smaller screens.
6. Make the Applicant Management page responsive for mobile.
7. Do not render huge lists of uploaded files in the table; show counts instead.
8. Load full uploaded file details only in the View Details modal.
9. Keep the UI consistent with the existing Applicant List style.
10. Do not change unrelated pages or logic.

I. Implementation tasks

1. Find the Admin Applicant List page and replace the current date/time filter UI with the new date filter button + modal.
2. Add a new Applicant Management sidebar item.
3. Create the Applicant Management route/page.
4. Build the Applicant Management table similar to Applicant List.
5. Add View Details modal.
6. Add Edit Basic Information modal.
7. Add date filter modal for Applicant Management.
8. Add/update backend endpoints needed for:
   - paginated applicant management list
   - applicant detail by ID
   - update applicant basic information
9. Ensure admin permissions allow viewing/editing basic information but not deactivation.
10. Add/confirm database indexes for performance.
11. Make sure both Applicant List and Applicant Management date filters use clean reusable logic/components if possible.
12. Provide complete updated code for every affected file.
13. Mention the exact file path of each updated file.

Important:
- Applicant List date filtering should be one clean button that opens a modal.
- Applicant Management should be a new sidebar module.
- Applicant Management is for viewing all applicant users and editing basic info only.
- Admin cannot deactivate applicant accounts.
- Use optimized backend queries, pagination, indexing, and selective data loading.
- Do not overwhelm the server.
- Preserve existing UI and logic outside the requested changes.
