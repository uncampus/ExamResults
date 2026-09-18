# UN Campus Results Portal

## Included
- `index.html` — main portal
- `css/style.css` — modern responsive styling and animations
- `js/config.js` — institute settings and demo staff credentials
- `js/data.js` — separate results data file (no database required)
- `assets/logo.png` — supplied UN Campus logo
- `tools/excel-to-data.html` — browser-side Excel → `data.js` converter

## Run
Open `index.html` in a modern browser. For best results, serve the folder through a simple local web server or your normal hosting.

## Staff login
Demo credentials are in `js/config.js`:
- Username: `admin`
- Password: `admin123`

Change them before deployment.

## Updating from Excel
1. Open `tools/excel-to-data.html`.
2. Select your updated `.xlsx`/`.xls` file.
3. Set the batch ID/name/course.
4. Click **Convert & Download data.js**.
5. Replace the portal's `js/data.js` with the generated file.
6. For multiple batches, merge the generated batch objects into the same `window.RESULTS_DATA` object.

### Excel headers
Use:
`No. | Name | Full Name | NIC | Registration Number | M01 | M02 | ... | M12 | Final | Average | Attendance`

## Important security note
This is intentionally a frontend-only solution. Any username/password stored in JavaScript can be inspected by a user. It is not suitable for high-security staff authentication or confidential result systems. For production confidentiality, add server-side authentication/API/database later.


## Updated features
- Staff view no longer displays a grade beside the Average value.
- Average and Attendance are displayed to two decimal places.
- Registration Number is displayed in the student result view and staff table after NIC.
- Excel converter reads `Registration Number` and generates a registration number automatically when the Excel cell is blank.
- Staff Print / Preview asks for lecturer name and date before opening the browser print preview.
- Printed results include the supplied UN CAMPUS logo, institute addresses, email, website, telephone number, batch/course details, and lecturer certification/signature area.
