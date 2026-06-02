Fix the Position Library and Vacancy Posting requirements flow.

Main goal:
When creating/posting a Vacancy, the system should get the selected position from the Position Library. Whatever requirements are saved/set in that Position Library item should automatically become the “List of Requirements” shown for that Vacancy.

Important wording change:
Rename all UI text/labels that use:
- Job
- Jobs
- job
- jobs

Rewrite them as:
- Vacancy
- Vacancies
- vacancy
- vacancies

Use the correct singular/plural form depending on the sentence.

Also rename:
“Upload Requirements”
to:
“List of Requirements”

Position Library requirements:
In Position Library, there are Add Position and Edit Position features.

When adding or editing a position, add or use a position category/type field:
- Teaching
- Non-Teaching

Based on the selected category, automatically set the default requirements list.

Teaching requirements:
b. Letter of Intent – Letter addressed to the SDS stating your purpose and subject/learning area.
c. PDS with Work Experience Sheet – CS Form 212 Revised 2025 and Work Experience Sheet.
d. Proof of Residency – Voter’s ID, barangay certificate, or utility bill.
e. PRC License/ID – Valid and updated PRC ID.
f. Board Rating – Certificate of Board Rating.
g. Academic Records – TOR and Diploma, including graduate/post-graduate records if available.
h. Service Record/COE – Service Record or Certificate of Employment.
i. Latest Appointment – Appointment paper for promotion applicants.
j. Training Certificates – Certificates of relevant trainings, seminars, or CPD programs.
k. TESDA Certificates – NC II or Trainers Methodology Certificate, if applicable.
l. Performance Ratings – IPCRF/OPCRF rating with Very Satisfactory or higher.
m. Checklist and Sworn Statement – Checklist of Requirements, Omnibus Sworn Statement, CAV, and Data Privacy Consent Form.
n. Other Documents – Portfolio, MOVs, teaching outputs, or other HRMPSB-required documents.
o. Outstanding Accomplishments – Documents showing awards, recognition, innovation, research, or other accomplishments based on DO 7 s. 2023.

Non-Teaching requirements:
a. Letter of Intent – Letter addressed to the Schools Division Superintendent.
b. PDS with Work Experience Sheet – CS Form No. 212 Revised 2025 and Work Experience Sheet, if applicable.
c. PRC License/ID – Valid and updated PRC ID, if applicable.
d. Eligibility/Rating – Certificate of Eligibility or Rating, if applicable.
e. Academic Records – TOR, Diploma, and graduate/post-graduate records, if available.
f. Training Certificates – Certificates of training, if applicable.
g. Employment Documents – Certificate of Employment, Contract of Service, or Service Record.
h. Latest Appointment – Latest appointment document, if applicable.
i. Performance Rating – Performance rating for the last 3 years in current/latest position, if applicable.
j. Checklist and Sworn Statement – Checklist of Requirements, Omnibus Sworn Statement, CAV, and Data Privacy Consent Form, notarized.
k. Outstanding Accomplishments – Documents showing awards, recognition, innovation, research, or other accomplishments based on DO 7 s. 2023.

Required Vacancy Posting behavior:
1. In the Vacancy Posting form/modal/page, when the user selects a position from the Position Library, automatically load that position’s saved requirements.
2. Display those loaded requirements under “List of Requirements”.
3. The Vacancy should save the requirements copied from the selected Position Library record at the time of posting.
4. When viewing Vacancy details, the displayed “List of Requirements” should be the requirements from the selected position.
5. If the selected position is Teaching, show Teaching requirements.
6. If the selected position is Non-Teaching, show Non-Teaching requirements.
7. Do not make the Vacancy Posting form use a separate/manual requirements source if the Position Library already provides the requirements.
8. If the selected position changes while creating/editing a Vacancy, update the displayed List of Requirements to match the newly selected position.

Implementation requirements:
1. Find all affected frontend files for:
   - Position Library
   - Add Position
   - Edit Position
   - Vacancy Posting
   - Vacancy list/details
2. Find all affected backend/API/database files if requirements/category need to be saved or returned.
3. Add or update the Position Library model/schema/API so each position can store:
   - category/type: Teaching or Non-Teaching
   - requirements/listOfRequirements
4. Add or update vacancy creation/update logic so it receives or derives the requirements from the selected Position Library item.
5. Make sure the frontend uses the selected position’s requirements when posting a Vacancy.
6. Replace all visible “Job/jobs” wording with “Vacancy/Vacancies”.
7. Replace all visible “Upload Requirements” wording with “List of Requirements”.
8. Keep the existing UI design and layout as much as possible.
9. Do not change unrelated logic.
10. Do not remove existing add/edit/delete/search/table/modal behavior.
11. Provide the complete updated code for every affected file.
12. Mention the exact path of each updated file.

Additional fix for Applicant Information stepper/forms:

In the Applicant Information multi-step form, allow users to click Next and Back even if the current step has incomplete required fields.

However, before allowing the user to move to the next or previous step, show a small confirmation modal.

Modal behavior:
1. When the user clicks Next and there are incomplete required fields, show a mini confirmation modal.
2. The modal should ask if they are sure they want to continue even though some fields are incomplete.
3. Display the list of missing/incomplete fields inside the modal.
4. Provide two actions:
   - Continue / Proceed: moves to the next step
   - Stay / Cancel: closes the modal and keeps the user on the current step
5. When the user clicks Back and there are incomplete required fields, show the same type of mini confirmation modal.
6. Display the list of missing/incomplete fields before going back.
7. Provide two actions:
   - Go Back / Continue: moves to the previous step
   - Stay / Cancel: closes the modal and keeps the user on the current step
8. If there are no missing required fields, Next and Back should work normally without showing the modal.

Stepper/back button UI change:
1. Remove the blue gradient back button from all stepper forms.
2. Add a new Back button near the Next button so they are beside each other.
3. The Back and Next buttons should be in the same footer/action area for better UX.
4. The Back button should only appear when there is a previous step.
5. Keep the button design clean and consistent with the current UI.
6. Apply this to all stepper forms/pages where the gradient Back button currently appears.
7. Do not break existing validation, submission, or step navigation logic.
8. Do not change unrelated form fields or layouts.
9. Provide the complete updated code for every affected file.
10. Mention the exact file path of each updated file.

Additional mobile responsiveness fix:

Add proper mobile view/responsive design for the Applicant Form and all user-related pages/modals.

Scope:
1. Applicant Form
2. Applicant Information stepper forms
3. All Users pages
4. All Users add/edit/view/details modals
5. Any modal connected to user management or applicant information

Requirements:
1. Make the layout responsive for mobile screens.
2. Do not simply shrink/resize the whole desktop layout.
3. Redesign the content flow so it looks clean and usable on mobile.
4. On mobile, form fields should stack properly in one column when needed.
5. Modals should fit within the screen height and width.
6. Modal headers and footers should stay accessible.
7. Modal body content should scroll if it is long.
8. Buttons should be easy to tap on mobile.
9. Tables should not break the layout on small screens.
10. For tables, use responsive handling such as horizontal scroll, stacked cards, or mobile-friendly rows depending on what fits the current design best.
11. Keep desktop layout/design unchanged as much as possible.
12. Apply responsive Tailwind classes properly instead of hardcoded fixed widths that break on mobile.
13. Make sure text, spacing, buttons, inputs, dropdowns, and modal content are readable and usable on mobile.
14. Do not remove existing fields, validations, actions, or modal behavior.
15. Do not change unrelated logic.
16. Provide the complete updated code for every affected file.
17. Mention the exact file path of each updated file.

Important:
- The goal is not to make everything smaller.
- The goal is to make the content properly designed for mobile.
- Applicant Form and all user-related modals should feel natural and easy to use on phones.
- Preserve existing desktop appearance as much as possible.

Important:
- Users should be able to move between steps even with incomplete fields.
- Missing required fields should still be clearly shown in the confirmation modal.
- Back and Next should be placed beside each other.
- Remove the old gradient Back button from every stepper.

Important:
- Position Library is the source of truth for requirements.
- Vacancy Posting must pull requirements from the selected Position Library item.
- Vacancies should display the copied requirements as “List of Requirements”.
- Teaching and Non-Teaching must have separate default requirement lists.
- All “Job” wording in the UI should become “Vacancy” wording.