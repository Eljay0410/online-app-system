Specific error to fix in Vacancy Posting:

When creating/posting a vacancy, this error appears:

“Title, district, barangay, application deadline, and time are required.”

This validation is outdated and does not match the current Vacancy Posting form.

Required fix:
1. Search the backend for the exact error message:
   “Title, district, barangay, application deadline, and time are required.”
2. Find where it is thrown, likely in the vacancy/job posting create controller, route validation, service, DTO, or middleware.
3. Update this validation to match the current Vacancy Posting form.

Current expected Vacancy Posting behavior:
- The vacancy should use the selected Position Library item for the position/title.
- The List of Requirements should come from the selected Position Library item.
- Qualification fields like Education, Training, Experience, and Eligibility are typed manually in the vacancy form.
- Application deadline and deadline time are still required if they exist in the form.
- Do not require district or barangay if they are no longer selected or used in the current form.
- Do not require title as a separate manual field if the title/position now comes from the selected Position Library item.

Validation should be changed to:
- Require selected position / positionId instead of manual title, if the current form uses Position Library.
- Require application deadline if the form still has it.
- Require deadline time if the form still has it.
- Require other current required fields only if they are actually present in the current UI.
- Remove district and barangay from required validation if they are leftover old fields.
- Remove school from required validation too if it is no longer part of the current form.
- Make the error message match the current form fields.

Frontend/API payload fix:
1. Check what the Vacancy Posting frontend sends to the backend.
2. Make sure it sends:
   - positionId or selected Position Library ID
   - education
   - training
   - experience
   - eligibility
   - applicationDeadline
   - deadlineTime/time
   - status
   - requirements/listOfRequirements if needed, copied from Position Library
3. Remove old frontend payload fields if they are no longer used:
   - district
   - barangay
   - school
   - manual title
4. If backend still needs title for database display, derive it from the selected Position Library record instead of requiring manual title.
5. If backend still needs requirements for database display, derive/copy them from the selected Position Library record.

Backend/API fix:
1. Update the create vacancy endpoint so it fetches the selected Position Library record using positionId.
2. Use that Position Library record to fill:
   - title/position title if needed
   - requirements/listOfRequirements
   - category/type if needed
3. Save the vacancy successfully using the current payload.
4. Update edit vacancy endpoint with the same validation rules.
5. Make sure old validation messages no longer appear.

Expected result:
Posting a vacancy should no longer show:
“Title, district, barangay, application deadline, and time are required.”

Instead, if something is missing, the error should be specific and current, for example:
- “Position is required.”
- “Application deadline is required.”
- “Deadline time is required.”

Important:
Do not re-add district, barangay, school, or manual title fields just to satisfy the old validation.
Fix the outdated validation and align the backend with the current Vacancy Posting flow.