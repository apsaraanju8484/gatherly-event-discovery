# Gatherly

Gatherly is an event discovery and booking app. The static front end is HTML, CSS, and vanilla JavaScript. The API uses Node.js, Express, and MongoDB.

## Features

- Search events by name, category, venue, or city
- Filter by category and location; sort by date, price, or popularity
- Save favorite events in browser storage
- Persist reservations to MongoDB when the API is configured
- Check remaining spots atomically so concurrent reservations cannot oversell an event
- Demo-only local reservation mode when no API URL is configured
- Responsive layout and reduced-motion support

## Run the API locally

1. Install Node.js 20 or later and create a MongoDB database.
2. Copy `.env.example` to `.env`, then replace `MONGODB_URI` with your private MongoDB connection string.
3. From this folder, run `npm install`, then `npm start` to start the API at `http://localhost:3000`. The API inserts the sample events when it first connects; existing events and booking counts are preserved.
4. To add the sample events manually instead, run `npm run seed` once after setting `MONGODB_URI`.
5. Set `window.GATHERLY_API_URL` in `config.js` to the API base URL. For local work, use `http://localhost:3000` and serve the website from a local web server.

Never commit `.env` or put the MongoDB connection string in a front-end file. Set it as a private environment variable on the API host. Add both the local website origin and `https://apsaraanju8484.github.io` to `ALLOWED_ORIGINS`, separated by a comma, when using both.

## API routes

- `GET /api/health` — API status
- `GET /api/events` — event list and remaining spots
- `GET /api/events/:eventId` — event details
- `POST /api/bookings` — validate a reservation and save it to MongoDB

The booking endpoint collects a name and email for the reservation. This portfolio demo does not send confirmation emails, collect payments, or include an organizer dashboard.

## Live setup

GitHub Pages serves the front end only. Deploy the API separately, configure `MONGODB_URI` and `ALLOWED_ORIGINS` as private API-host environment variables, seed the database once, then update `config.js` with the API's HTTPS URL and republish the front end.
