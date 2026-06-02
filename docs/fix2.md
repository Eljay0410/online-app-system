Additional user-side My Applications view fix:

On the applicant/user side, when the applicant views their application details, the layout should be for reviewing and viewing only.

Required layout:
1. Show the Vacancy Posting details at the upper/top section.
2. Show the applicant’s submitted requirements below the vacancy posting details.

The view should be structured like this:

Top section: Vacancy Posting Details
- Vacancy title/position
- School/office/place of assignment if available
- Salary grade/salary if available
- Education
- Training
- Experience
- Eligibility
- Vacancy description/duties if available
- Application deadline and time
- Status if applicable
- List of Requirements from the vacancy/position library

Bottom section: Submitted Requirements
- Requirement name
- Uploaded file name
- View document/file button
- Download button if supported
- Missing/Not submitted label if no file was uploaded

Behavior:
1. This applicant-side view is only for reviewing/viewing.
2. Applicant should be able to view the vacancy posting information first.
3. Applicant should be able to review the requirements they submitted below.
4. When applicant opens an uploaded document/file, clicking Back should return to the same application details view/modal.
5. It should not close the whole modal.
6. It should not redirect to the wrong page.
7. Preserve the application details state while viewing uploaded documents.
8. Keep the layout consistent with the Vacancy Posting details view.
9. Keep the submitted requirements section visually separate from the vacancy’s List of Requirements.
10. Make the view responsive on mobile.

Important:
- Vacancy Posting details should appear above.
- Submitted requirements should appear below.
- The applicant should not edit requirement statuses here.
- This page/modal is for viewing and reviewing their own application only.
- Keep the content uniform with the vacancy details design.