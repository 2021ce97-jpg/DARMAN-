# DARMAN

DARMAN is a healthcare discovery and telemedicine platform for Afghanistan.

This repo now focuses on the core demo flow:

- Patient login
- Doctor login
- Patient doctor browsing from Firestore
- Admin dashboard counts from Firestore
- A clean project layout that is easier to share and understand

## What Works Now

- Patients can sign in and browse verified doctors from the `doctors` collection in Firebase Firestore.
- Doctors can sign in and open the doctor area.
- Admins can sign in and see platform totals such as registered patients, doctors, pending doctors, and appointments.
- Role routing is handled from the Flutter app in `medi_connect`.

## Demo Access

Use these demo accounts to test the current flow:

| Role | Email | Password |
| --- | --- | --- |
| Patient | `patient@darman.af` | `Darman2026!` |
| Doctor | `doctor@darman.af` | `Darman2026!` |
| Admin | `admin@darman.af` | `Darman2026!` |

Login screen:

- `https://mediconnect-4b155.web.app/login`

Direct routes after login:

- Patient: `/`
- Doctor: `/doctor`
- Admin: `/admin`

## Data Model Used For This Demo

- `users` collection stores the user role and profile basics.
- `doctors` collection stores doctor profiles shown to patients.
- `appointments` collection is used for admin totals and booking history.

## Active App

The active app is the Flutter project in `medi_connect/`.

```bash
cd medi_connect
flutter pub get
flutter run -d chrome
```

## Current Status

- Patient login: working
- Doctor login: working
- Doctor listing from Firestore: working
- Admin counts: implemented in the Flutter admin screen
- Legacy backend, admin dashboard, functions, scripts, and docs: archived
- Documentation cleanup: complete for the demo slice

## Next Important Steps

1. Confirm the live Firebase data has the correct `users`, `doctors`, and `appointments` documents.
2. Add or refresh verified doctor records so patients see useful listings.
3. Confirm the admin account can read Firestore counts in your live Firebase project.
4. Restore archived folders only if you want to continue the broader platform roadmap.
5. Continue the unfinished features only after the core login and Firestore flows are stable.

## Notes

- The repo now keeps older material under `archive/` so the shareable version is simpler.
- If you want me to verify live Firebase counts or fix any missing role data, I can do that with the Firebase service-account JSON you attached.
