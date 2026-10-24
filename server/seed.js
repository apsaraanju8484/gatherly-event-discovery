require('dotenv').config();
const mongoose = require('mongoose');
const { Event } = require('./models');
const events = require('./event-data');

async function seed(){
  if(!process.env.MONGODB_URI)throw new Error('Set MONGODB_URI before seeding.');
  await mongoose.connect(process.env.MONGODB_URI);
  for(const event of events) await Event.updateOne({slug:event.slug},{$setOnInsert:event},{upsert:true});
  console.log(`Seeded ${events.length} Gatherly events (existing events were kept).`);
  await mongoose.disconnect();
}

seed().catch(async error=>{console.error(error);await mongoose.disconnect().catch(()=>{});process.exit(1);});
