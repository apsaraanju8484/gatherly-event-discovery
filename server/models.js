const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true, trim: true },
  title: { type: String, required: true, trim: true },
  category: { type: String, required: true, enum: ['Food', 'Creative', 'Music', 'Outdoors'] },
  city: { type: String, required: true, trim: true },
  venue: { type: String, required: true, trim: true },
  day: { type: String, required: true },
  month: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  popularity: { type: Number, default: 0, min: 0 },
  time: { type: String, required: true },
  image: { type: String, required: true },
  alt: { type: String, required: true },
  description: { type: String, required: true },
  capacity: { type: Number, required: true, min: 1 },
  spotsRemaining: { type: Number, required: true, min: 0 }
}, { timestamps: true, toJSON: { transform: (_doc, value) => { value.id = value.slug; delete value._id; delete value.__v; return value; } } });

const bookingSchema = new mongoose.Schema({
  eventId: { type: String, required: true, index: true },
  eventTitle: { type: String, required: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
  tickets: { type: Number, required: true, min: 1, max: 8 },
  total: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed' }
}, { timestamps: true });

module.exports = {
  Event: mongoose.models.Event || mongoose.model('Event', eventSchema),
  Booking: mongoose.models.Booking || mongoose.model('Booking', bookingSchema)
};
