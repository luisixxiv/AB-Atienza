# AB Atienza Construction Services - website

Open `index.html` to start. No install needed. For the best result open the site with
VS Code "Live Server" (or any local web server), because the admin dashboard and the
client dashboard share their data through the browser, and some browsers (Firefox)
do not share it between plain files.

## Folder structure

```
index.html          Home
about.html          About
services.html       Services
projects.html       Projects
quote.html          Get a free quote
contact.html        Contact

portal/             Client area
  login.html        One login page for clients and for the office
  dashboard.html    Client dashboard (left side panel)

admin/              Office area
  dashboard.html    Admin dashboard (left side panel)

css/
  styles.css        Shared: size scale, top bar, nav bar, buttons, CTA, footer, form controls
  intro.css         Home intro screen
  about.css, services.css, projects.css, quote.css, contact.css   One file per page
  login.css, dashboard.css                                        Client and admin dashboards
  admin.css                                                       Extra styles for the admin dashboard

js/
  data.js           Shared data: sample data, loading, saving, small helpers
  main.js, intro.js                                               Home
  about.js, services.js, projects.js, quote.js, contact.js        One file per page
  login.js                                                        Login (client and office)
  dashboard.js                                                    Client dashboard
  admin.js                                                        Admin dashboard

images/
  builds/  clients/  collage/  recent-projects/  services/        Photos by topic
  ab-logo.svg, ab-logo-footer.svg, before.jpg, after.jpg, team.jpg, team2.jpg
```

Each page loads `css/styles.css` first, then its own CSS, and its own JS at the bottom.
Pages that read or save shared data load `js/data.js` before their own JS.

## Logins (demo)

Set at the top of `js/login.js`:

| Account | Email | Password | Opens |
|---|---|---|---|
| Client | `client@abatienza.com` | `build2026` | `portal/dashboard.html` |
| Office | `admin@abatienza.com` | `admin2026` | `admin/dashboard.html` |

The dashboards send you back to the login if you are not logged in.

## How the admin dashboard updates the client dashboard

All data lives in one place in the browser (`localStorage`, key `abData`), created from the
sample data in `js/data.js` the first time any page needs it.

- The admin dashboard changes it: progress sliders, updates, photos, documents,
  payments, messages and project details.
- The client dashboard reads it and shows the change. If both dashboards are open in
  two tabs of the same browser, the client page redraws by itself.
- The client changes it too: signing a document, sending proof of payment, sending a file
  or a message. The admin dashboard shows these in "Needs your attention".
- The Get a Quote form saves a lead and the Contact form saves a message. Both appear in
  "Leads and inbox" in the admin dashboard.
- Only the project "Two-Storey Triplex Residential" is linked to the demo client login.
- "Activity" in the admin dashboard has a "Reset demo data" button.

## Still sample data

All client names, amounts, dates, phases and leads in `js/data.js`, the four reviews on the
home page (the names and photos are yours, the text is sample text), and the license
number in the footer. Replace them with real information before the final presentation.
