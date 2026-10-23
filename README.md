# AB Atienza Construction Services - website

Open `index.html` to start. No install needed.

## Folder structure

```
index.html          Home
about.html          About
services.html       Services
projects.html       Projects
quote.html          Get a free quote
contact.html        Contact

portal/             Client area
  login.html        Client login
  dashboard.html    Client dashboard (left side panel)
  (admin pages will go in an admin/ folder next to this one)

css/
  styles.css        Shared: size scale, top bar, nav bar, buttons, CTA, footer, form controls
  intro.css         Home intro screen
  about.css, services.css, projects.css, quote.css, contact.css   One file per page
  login.css, dashboard.css                                        Client area

js/
  main.js, intro.js                                               Home
  about.js, services.js, projects.js, quote.js, contact.js        One file per page
  login.js, dashboard.js                                          Client area

images/
  builds/  clients/  collage/  recent-projects/  services/        Photos by topic
  ab-logo.svg, ab-logo-footer.svg, before.jpg, after.jpg, team.jpg, team2.jpg
```

Each page loads `css/styles.css` first, then its own CSS, and its own JS at the bottom.

## Client login (demo)

Set at the top of `js/login.js`:

- `correctEmail` = `client@abatienza.com`
- `correctPassword` = `build2026`

A correct login opens `portal/dashboard.html`. The dashboard sends you back to the login if you are not logged in.

## Pages that pass data to each other (localStorage)

- `services.html` saves `pickedServices`, and `quote.html` reads it.
- `quote.html` saves `lastQuote`, and `contact.html` saves `lastMessage` (for the admin side later).
- `login.js` saves `clientLoggedIn`, and `dashboard.js` checks it.

## Still sample data

All names, amounts, dates and phases on the dashboard, the three client reviews on the home page, and the license number in the footer.
