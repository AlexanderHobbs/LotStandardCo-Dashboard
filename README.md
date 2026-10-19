# Lot Standard Co Dashboard

A single-page link dashboard for Lot Standard Co: quick access to Google Workspace, Google Cloud, email and the company website, with room to add more links.

Live site: [https://alexanderhobbs.github.io/LotStandardCo-Dashboard/](https://alexanderhobbs.github.io/LotStandardCo-Dashboard/)

## Password lock

The dashboard is encrypted (AES-256-GCM, key derived from the password with PBKDF2-SHA256, 600,000 rounds). `index.html` only contains a sign-in screen and the encrypted page, so neither the site nor this repo reveals the dashboard without the password. The password is asked for every time the page loads or refreshes; the Lock button in the top bar locks it on demand.

## Editing the dashboard

The readable page is never committed. To change it:

```sh
DASH_PASSWORD='your-password' node tools/lock.mjs unlock index.html dashboard.html
# edit dashboard.html
DASH_PASSWORD='your-password' node tools/lock.mjs lock dashboard.html index.html
rm dashboard.html
```

Run the same lock command with a new password to change the password. `dashboard.html` is in `.gitignore` so it can't be committed by accident.

Links added in the browser are saved to that browser's local storage.
