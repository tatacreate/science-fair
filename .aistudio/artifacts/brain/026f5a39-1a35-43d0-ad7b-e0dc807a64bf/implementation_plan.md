# Implementation Plan: Split-View Auth & Flight Surgeon Dashboard

## 1. Authentication Redesign
- Modify `SignInIntroPage` to include a role toggle (Astronaut vs. Flight Surgeon).
- Add `missionCode` input field to the login flow.
- Extend `User` profile in Firestore to store `role` and `missionCode`.

## 2. Flight Surgeon Dashboard
- Create a `DoctorDashboard` component.
- Dashboard will:
    - List missions by unique `missionCode`.
    - Provide a table displaying crew members for the selected mission.
    - Show check-in status (submitted/pending) for each crew member.

## 3. Security Hardening
- Implement Firestore rules to ensure:
    - Flight Surgeons can only read data for their associated `missionCode`.
    - Astronauts can only read/write their own check-ins.
