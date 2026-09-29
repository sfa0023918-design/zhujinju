# Journal and mobile footer refinement — 2026-09-29

Implements the approved preview across desktop, tablet and phone.

- `/journal`: compact lead feature and consistent three/two/one-column list. Photos retain their original aspect ratio. Bilingual titles precede date and category; repeated author/column metadata remains available in article details. Regular-card excerpts are hidden on phones; the lead excerpt and all article links remain visible.
- `/`: one recommendation, “为什么我们持续做展览与图录”, with the approved large photo, bilingual title, Chinese excerpt and date. Other articles remain in `/journal`, reached through “更多阅读”.
- Inner-page mastheads share the existing content rail (24 px phone; 40 px tablet and desktop). The home masthead retains its approved geometry, including on client-side navigation.
- Below 768 px, the footer keeps email, telephone and social icons visible; additional contacts and the address use native keyboard-accessible disclosures. The existing WeChat QR dialog is retained. Wider footers remain expanded.

## Verification

- `npm run lint`: passed.
- `npm run build`: passed (97 generated pages).
- Local production build inspected in the in-app browser at 320, 390, 820, 1024 and 1366 px. No horizontal page overflow on the journal index.
- At 1366 px, the lead image is about 390 px high and regular images about 262 px; no image cropping. The index still contains six published articles.
- Home contains one article; “更多阅读” navigates to the six-article index.
- Logo/title left edges match on collection, exhibitions, journal, about and contact. Home remains aligned at its original rail.
- Mobile footer is about 329 px closed at 390 px. Click and Enter toggle both disclosures. WeChat QR opens and closes correctly. No browser console errors during these checks.
- `content/` and `public/` have no changes. No environment/configuration changes.
- These are browser viewport checks, not physical iPhone/iPad acceptance.

## Screenshots

![Desktop journal](screenshots/journal-desktop-20260929.jpg)

![Tablet journal](screenshots/journal-tablet-20260929.jpg)

![Phone reading feature](screenshots/reading-phone-20260929.jpg)

![Phone footer](screenshots/footer-phone-20260929.jpg)
