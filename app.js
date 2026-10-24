const demoEvents = [
  {id:'supper',title:'A long-table supper club',category:'Food',city:'Bengaluru',venue:'The Courtyard, Indiranagar',day:'26',month:'OCT',price:850,popularity:96,time:'Sunday · 7:00 PM',image:'photo-1517248135467-4c7edcad34c4',alt:'Warm candlelit restaurant dining room',description:'A seasonal, family-style dinner with new friends and a menu made for lingering.'},
  {id:'clay',title:'Clay, coffee & slow mornings',category:'Creative',city:'Mumbai',venue:'Little Clay Studio, Bandra',day:'27',month:'OCT',price:650,popularity:83,time:'Monday · 10:30 AM',image:'photo-1565193566173-7a0ee3dbe261',alt:'Hands shaping pottery on a pottery wheel',description:'Get your hands messy in a beginner-friendly pottery session. Your first handmade mug is on us.'},
  {id:'jazz',title:'Jazz in the garden',category:'Music',city:'Chennai',venue:'The Garden Room, Alwarpet',day:'28',month:'OCT',price:500,popularity:91,time:'Tuesday · 6:30 PM',image:'photo-1516280440614-37939bbacd81',alt:'Singer performing at a live music show',description:'An intimate evening of live jazz, garden lights, and a little room to dance.'},
  {id:'walk',title:'A greener side of the city',category:'Outdoors',city:'Pune',venue:'Vetal Tekdi, Kothrud',day:'29',month:'OCT',price:0,popularity:88,time:'Wednesday · 7:00 AM',image:'photo-1441974231531-c6227db76b6e',alt:'Sunlight coming through a green forest trail',description:'A gentle guided walk through the trees, with chai and a slower start to the day.'},
  {id:'pasta',title:'Pasta from scratch, together',category:'Food',city:'Delhi',venue:'Olive & Thyme Kitchen, Hauz Khas',day:'30',month:'OCT',price:950,popularity:79,time:'Thursday · 5:00 PM',image:'photo-1551183053-bf91a1d81141',alt:'Fresh handmade pasta ready to cook',description:'Learn to make silky fresh pasta, share a meal, and take home a recipe you will keep.'},
  {id:'paint',title:'Paint, sip & let go',category:'Creative',city:'Bengaluru',venue:'Color House, Koramangala',day:'01',month:'NOV',price:700,popularity:87,time:'Saturday · 4:00 PM',image:'photo-1513364776144-60967b0f800f',alt:'Colorful art supplies and brushes on a table',description:'No experience, no pressure. Just color, a canvas, and a good afternoon with lovely people.'},
  {id:'openmic',title:'The neighborhood open mic',category:'Music',city:'Mumbai',venue:'The Sidewalk Cafe, Juhu',day:'02',month:'NOV',price:250,popularity:73,time:'Sunday · 6:00 PM',image:'photo-1501386761578-eac5c94b800a',alt:'Audience enjoying a live concert together',description:'Local voices, original songs, and an easygoing crowd. Come perform or just listen.'},
  {id:'cycle',title:'Sunrise cycle & filter coffee',category:'Outdoors',city:'Chennai',venue:'Marina Beach Meetup Point',day:'03',month:'NOV',price:150,popularity:77,time:'Monday · 6:00 AM',image:'photo-1471506480208-91b3a4cc78be',alt:'Bicycle ready for a morning ride outdoors',description:'An easy coastal ride, a sea breeze, and a proper South Indian coffee stop on the way.'}
];
let events = [...demoEvents];
const apiBaseUrl = (window.GATHERLY_API_URL || '').replace(/\/$/, '');
const liveBookingsEnabled = Boolean(apiBaseUrl);

const grid = document.querySelector('#event-grid');
const emptyState = document.querySelector('#empty-state');
const queryInput = document.querySelector('#search-input');
const locationFilter = document.querySelector('#location-filter');
const saved = new Set(JSON.parse(localStorage.getItem('gatherly-saved') || '[]'));
let currentCategory = 'All';
let selectedEvent = null;
let ticketCount = 1;
let toastTimer;

function escapeHTML(value){return String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));}
function imageUrl(photo,width=700){return `https://images.unsplash.com/${photo}?auto=format&fit=crop&w=${width}&q=82`;}
function renderEvents(){
  const query=queryInput.value.trim().toLowerCase();
  const city=locationFilter.value;
  const sort=document.querySelector('#sort-select').value;
  let visible=events.filter(event=>{
    const matchesCategory=currentCategory==='All'||event.category===currentCategory;
    const matchesCity=city==='all'||event.city===city;
    const haystack=`${event.title} ${event.category} ${event.city} ${event.venue} ${event.description}`.toLowerCase();
    return matchesCategory&&matchesCity&&haystack.includes(query);
  });
  if(sort==='price-low')visible.sort((a,b)=>a.price-b.price);
  if(sort==='popular')visible.sort((a,b)=>b.popularity-a.popularity);
  if(sort==='soonest')visible.sort((a,b)=>events.indexOf(a)-events.indexOf(b));
  grid.innerHTML=visible.map((event,index)=>`<article class="event-card" style="animation-delay:${index*45}ms">
    <div class="event-image-wrap"><img class="event-image" src="${imageUrl(event.image)}" alt="${escapeHTML(event.alt)}" loading="lazy"><span class="event-date"><small>${event.month}</small><strong>${event.day}</strong></span><button class="save-event ${saved.has(event.id)?'saved':''}" data-save="${event.id}" aria-label="${saved.has(event.id)?'Remove saved event':'Save'} ${escapeHTML(event.title)}" aria-pressed="${saved.has(event.id)}">${saved.has(event.id)?'♥':'♡'}</button></div>
    <div class="event-card-content"><p class="event-tag">${event.category} <span>·</span> ${event.time}</p><h3 class="event-title">${escapeHTML(event.title)}</h3><p class="event-location"><span>⌖</span>${escapeHTML(event.venue)}, ${event.city}</p><div class="event-card-bottom"><span class="event-price">${event.price===0?'Free':`₹${event.price.toLocaleString('en-IN')}`} <small>/ person</small></span><button class="book-button" data-book="${event.id}">I'm in <span>↗</span></button></div></div>
  </article>`).join('');
  emptyState.hidden=visible.length>0;
  document.querySelector('#show-more').hidden=visible.length===0;
  document.querySelector('.category-chip[data-category="All"] b').textContent=String(visible.length).padStart(2,'0');
}

function showToast(message){const toast=document.querySelector('#toast');toast.textContent=message;toast.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('visible'),2500);}
function openBooking(event){selectedEvent=event;ticketCount=1;document.querySelector('#dialog-art').style.backgroundImage=`url("${imageUrl(event.image,900)}")`;document.querySelector('#dialog-category').textContent=`${event.category} · ${event.city}`;document.querySelector('#dialog-event-name').textContent=event.title;document.querySelector('#dialog-meta').innerHTML=`<span>◷ ${event.time}</span><span>⌖ ${escapeHTML(event.venue)}</span><span>${event.price===0?'Free':`₹${event.price.toLocaleString('en-IN')} / spot`}</span>`;document.querySelector('#ticket-count').textContent='1';document.querySelector('#booking-total').textContent=event.price===0?'Free':`₹${event.price.toLocaleString('en-IN')}`;document.querySelector('#booking-form').hidden=false;document.querySelector('.booking-note').hidden=false;document.querySelector('.booking-note').textContent=liveBookingsEnabled?'Your reservation will be saved by Gatherly. No payment is collected in this demo.':'Demo only: this reservation stays in this browser and does not reserve a real event spot.';document.querySelector('#booking-success').hidden=true;document.querySelector('#booking-dialog').showModal();}
function updateBookingTotal(){document.querySelector('#ticket-count').textContent=String(ticketCount);const total=(selectedEvent?.price||0)*ticketCount;document.querySelector('#booking-total').textContent=total===0?'Free':`₹${total.toLocaleString('en-IN')}`;}

document.querySelectorAll('.category-chip').forEach(button=>button.addEventListener('click',()=>{document.querySelector('.category-chip.selected').classList.remove('selected');button.classList.add('selected');currentCategory=button.dataset.category;renderEvents();}));
queryInput.addEventListener('input',renderEvents);locationFilter.addEventListener('change',renderEvents);document.querySelector('#sort-select').addEventListener('change',renderEvents);
document.querySelector('#search-button').addEventListener('click',()=>{document.querySelector('#events').scrollIntoView({behavior:'smooth'});renderEvents();});
document.querySelector('#reset-filters').addEventListener('click',()=>{queryInput.value='';locationFilter.value='all';currentCategory='All';document.querySelector('.category-chip.selected').classList.remove('selected');document.querySelector('.category-chip[data-category="All"]').classList.add('selected');renderEvents();});
grid.addEventListener('click',event=>{const saveButton=event.target.closest('[data-save]');if(saveButton){const id=saveButton.dataset.save;if(saved.has(id)){saved.delete(id);showToast('Removed from your saved plans');}else{saved.add(id);showToast('Saved for later ♥');}localStorage.setItem('gatherly-saved',JSON.stringify([...saved]));renderEvents();return;}const bookButton=event.target.closest('[data-book]');if(bookButton){const selected=events.find(item=>item.id===bookButton.dataset.book);if(selected)openBooking(selected);}});
document.querySelector('#qty-minus').addEventListener('click',()=>{ticketCount=Math.max(1,ticketCount-1);updateBookingTotal();});document.querySelector('#qty-plus').addEventListener('click',()=>{ticketCount=Math.min(8,ticketCount+1);updateBookingTotal();});
document.querySelector('#close-dialog').addEventListener('click',()=>document.querySelector('#booking-dialog').close());document.querySelector('#done-button').addEventListener('click',()=>document.querySelector('#booking-dialog').close());document.querySelector('#booking-dialog').addEventListener('click',event=>{if(event.target===event.currentTarget)event.currentTarget.close();});
document.querySelector('#booking-form').addEventListener('submit',async event=>{event.preventDefault();if(!selectedEvent)return;const formData=new FormData(event.currentTarget);const submitButton=event.currentTarget.querySelector('button[type="submit"]');submitButton.disabled=true;try{let confirmation;if(liveBookingsEnabled){const response=await fetch(`${apiBaseUrl}/api/bookings`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({eventId:selectedEvent.id,name:formData.get('name'),email:formData.get('email'),tickets:ticketCount})});const result=await response.json();if(!response.ok)throw new Error(result.message||'Could not reserve these spots.');confirmation=result.message||`Your ${ticketCount===1?'spot':'spots'} are reserved for ${selectedEvent.title}.`;}else{const booking={id:`${Date.now()}`,eventId:selectedEvent.id,eventTitle:selectedEvent.title,name:formData.get('name'),email:formData.get('email'),tickets:ticketCount,total:selectedEvent.price*ticketCount,bookedAt:new Date().toISOString()};const bookings=JSON.parse(localStorage.getItem('gatherly-bookings')||'[]');bookings.push(booking);localStorage.setItem('gatherly-bookings',JSON.stringify(bookings));confirmation=`Demo only: ${ticketCount} ${ticketCount===1?'spot':'spots'} for ${selectedEvent.title} are saved in this browser. No real booking was made.`;}document.querySelector('#success-message').textContent=confirmation;document.querySelector('#booking-form').hidden=true;document.querySelector('.booking-note').hidden=true;document.querySelector('#booking-success').hidden=false;if(liveBookingsEnabled)loadEvents();}catch(error){showToast(error.message.includes('Failed to fetch')?'Booking service is unavailable. Please try again later.':error.message);}finally{submitButton.disabled=false;}});
document.querySelector('#newsletter-form').addEventListener('submit',event=>{event.preventDefault();const input=document.querySelector('#email-input');const subscribers=JSON.parse(localStorage.getItem('gatherly-newsletter')||'[]');if(!subscribers.includes(input.value.trim()))subscribers.push(input.value.trim());localStorage.setItem('gatherly-newsletter',JSON.stringify(subscribers));document.querySelector('#newsletter-message').textContent='You’re on the list. Watch for the good stuff ✳';input.value='';});
document.querySelector('#show-more').addEventListener('click',()=>showToast('You’re all caught up with the good stuff ✳'));
['host-button','host-cta','account-button'].forEach(id=>document.querySelector(`#${id}`).addEventListener('click',()=>showToast(id==='account-button'?'Saved plans stay right here in your browser.':'More hosting tools are coming soon ✳')));
const menuToggle=document.querySelector('#menu-toggle');menuToggle.addEventListener('click',()=>{const open=menuToggle.getAttribute('aria-expanded')==='true';menuToggle.setAttribute('aria-expanded',String(!open));document.querySelector('#main-nav').classList.toggle('open',!open);});document.querySelectorAll('.main-nav a').forEach(link=>link.addEventListener('click',()=>{menuToggle.setAttribute('aria-expanded','false');document.querySelector('#main-nav').classList.remove('open');}));
async function loadEvents(){
  try{
    const response=await fetch(`${apiBaseUrl}/api/events`);
    if(!response.ok)throw new Error('Could not load events.');
    const result=await response.json();
    if(!Array.isArray(result.events))throw new Error('Invalid event list.');
    events=result.events;
    renderEvents();
  }catch(error){
    renderEvents();
    showToast('Could not connect to Gatherly. Showing preview events.');
  }
}
if(liveBookingsEnabled)loadEvents();else renderEvents();
