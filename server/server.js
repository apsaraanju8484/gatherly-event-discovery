require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const { Event, Booking } = require('./models');
const starterEvents = require('./event-data');

const app = express();
const port = Number(process.env.PORT) || 3000;
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(value => value.trim()).filter(Boolean);

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: (origin, callback) => {
  if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
  return callback(new Error('This website is not allowed to use the Gatherly API.'));
}, methods: ['GET', 'POST'], allowedHeaders: ['Content-Type'] }));
app.use(express.json({ limit: '20kb' }));

app.get('/api/health', (_request, response) => response.json({ status: 'ok', service: 'gatherly-api' }));

app.get('/api/events', async (_request, response, next) => {
  try {
    const events = await Event.find().sort({ createdAt: 1 });
    response.json({ events });
  } catch (error) { next(error); }
});

app.get('/api/events/:eventId', async (request, response, next) => {
  try {
    const event = await Event.findOne({ slug: request.params.eventId });
    if (!event) return response.status(404).json({ message: 'We could not find that event.' });
    response.json({ event });
  } catch (error) { next(error); }
});

app.post('/api/bookings', rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-7', legacyHeaders: false }), async (request, response, next) => {
  let reservedEvent;
  try {
    const { eventId, name, email, tickets } = request.body || {};
    const count = Number(tickets);
    const cleanName = typeof name === 'string' ? name.trim() : '';
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (typeof eventId !== 'string' || !/^[a-z0-9-]{1,80}$/.test(eventId)) return response.status(400).json({ message: 'Please choose a valid event.' });
    if (cleanName.length < 2 || cleanName.length > 100) return response.status(400).json({ message: 'Enter a name between 2 and 100 characters.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) || cleanEmail.length > 254) return response.status(400).json({ message: 'Enter a valid email address.' });
    if (!Number.isInteger(count) || count < 1 || count > 8) return response.status(400).json({ message: 'Choose between 1 and 8 spots.' });

    reservedEvent = await Event.findOneAndUpdate({ slug: eventId, spotsRemaining: { $gte: count } }, { $inc: { spotsRemaining: -count } }, { new: true });
    if (!reservedEvent) {
      const eventExists = await Event.exists({ slug: eventId });
      return response.status(eventExists ? 409 : 404).json({ message: eventExists ? 'Not enough spots remain for that event.' : 'We could not find that event.' });
    }

    try {
      const booking = await Booking.create({ eventId: reservedEvent.slug, eventTitle: reservedEvent.title, name: cleanName, email: cleanEmail, tickets: count, total: reservedEvent.price * count });
      return response.status(201).json({ message: `Your ${count === 1 ? 'spot is' : 'spots are'} reserved for ${reservedEvent.title}.`, booking: { id: booking.id, eventId: booking.eventId, eventTitle: booking.eventTitle, tickets: booking.tickets, total: booking.total, status: booking.status, createdAt: booking.createdAt } });
    } catch (error) {
      await Event.updateOne({ slug: reservedEvent.slug }, { $inc: { spotsRemaining: count } });
      reservedEvent = null;
      throw error;
    }
  } catch (error) { next(error); }
});

app.use((error, _request, response, _next) => {
  if (error.message === 'This website is not allowed to use the Gatherly API.') return response.status(403).json({ message: error.message });
  console.error(error);
  response.status(500).json({ message: 'Gatherly had a problem handling that request.' });
});

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    for (const event of starterEvents) await Event.updateOne({ slug: event.slug }, { $setOnInsert: event }, { upsert: true });
    app.listen(port, () => console.log(`Gatherly API listening on port ${port}`));
  })
  .catch(error => { console.error('Could not connect to MongoDB. Check MONGODB_URI.', error.message); process.exit(1); });
