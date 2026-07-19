// Route data for the Electrified Antiquity road trip.
// Waypoint ids are used to build the OSRM routing chain for each leg.

export const routeData = [
  {
    id: 1,
    title: "LEG 1: The Shropshire Marches",
    direction: "Outbound",
    stats: "~65 miles",
    estimatedTimeRange: "1h 45m – 2h 20m",
    optimalTravelTime:
      "Depart mid-morning (approx 10:00 AM). Avoid the A49 around Shrewsbury during the 08:00 AM commuter rush.",
    desc: "Leaving the Cheshire Plain, you cross into the Welsh Marches via the A530/A49. Skip busy towns for Stokesay Castle, a fine 13th-century fortified manor house.",
    waypoints: [
      { id: "macc-start", name: "Macclesfield (Start)", lat: 53.259, lng: -2.127, type: "start", desc: "The industrial silk-weaving town.", wikiTitle: "Macclesfield", website: "https://visitcheshire.com" },
      { id: "stokesay", name: "Stokesay Castle", lat: 52.435, lng: -2.83, type: "history", desc: "Finest preserved 13th-century fortified manor house in England.", website: "https://www.english-heritage.org.uk/visit/places/stokesay-castle/" },
      { id: "ludlow-sc", name: "Ludlow Supercharger", lat: 52.373, lng: -2.718, type: "charger", desc: "Top up near Stokesay.", wikiTitle: "Ludlow", website: "https://www.tesla.com/en_GB/supercharger" },
      { id: "yha-clun", name: "YHA Clun Mill", lat: 52.423, lng: -3.03, type: "stay", desc: "Restored 18th-century watermill tucked into a quiet historic valley.", wikiTitle: "Clun", website: "https://www.yha.org.uk/hostel/yha-clun-mill" },
    ],
    stopOrder: ["macc-start", "stokesay", "ludlow-sc", "yha-clun"],
  },
  {
    id: 2,
    title: "LEG 2: The Severn Vale & Cotswolds",
    direction: "Outbound",
    stats: "~70 miles",
    estimatedTimeRange: "1h 50m – 2h 30m",
    optimalTravelTime:
      "Early afternoon travel. The A417 'Missing Link' near Gloucester and Birdlip is a notorious bottleneck from 15:30 to 18:30.",
    desc: "Drive south through Hereford. Aim for the dramatic escarpment of Haresfield Beacon and the stark ruins of Hailes Abbey, sitting silently in a fold of the hills.",
    waypoints: [
      { id: "hailes", name: "Hailes Abbey", lat: 51.966, lng: -1.923, type: "history", desc: "Former Cistercian monastery dissolved by Henry VIII.", website: "https://www.english-heritage.org.uk/visit/places/hailes-abbey/" },
      { id: "haresfield", name: "Haresfield Beacon", lat: 51.776, lng: -2.234, type: "nature", desc: "Spectacular sweeping views over the Severn Estuary.", website: "https://www.nationaltrust.org.uk/visit/gloucestershire-cotswolds/haresfield-beacon-and-standish-wood" },
      { id: "michaelwood-sc", name: "Dursley / Michaelwood SC", lat: 51.658, lng: -2.408, type: "charger", desc: "Supercharger positioned just off the route.", wikiTitle: "Michaelwood services", website: "https://www.tesla.com/en_GB/supercharger" },
      { id: "yha-slimbridge", name: "YHA Slimbridge", lat: 51.74, lng: -2.404, type: "stay", desc: "Nestled along the quiet lanes near the Berkeley Estate.", wikiTitle: "Slimbridge", website: "https://www.yha.org.uk" },
    ],
    stopOrder: ["hailes", "haresfield", "michaelwood-sc", "yha-slimbridge"],
  },
  {
    id: 3,
    title: "LEG 3: Exmoor & North Devon Coast",
    direction: "Outbound",
    stats: "~85 miles",
    estimatedTimeRange: "2h 00m – 2h 45m",
    optimalTravelTime:
      "Early Saturday morning or midweek late morning. Avoid M5 southbound on Friday afternoons, which severely impacts the Bridgwater corridor.",
    desc: "Cross into Somerset, skirting the Quantock Hills. Destination is the jaw-dropping Valley of Rocks, bypassing typical commercial seaside traps for ancient, jagged landscapes.",
    waypoints: [
      { id: "tiverton-sc", name: "Tiverton Supercharger", lat: 50.91, lng: -3.424, type: "charger", desc: "Grab a charge before heading into deep coastal valleys.", wikiTitle: "Tiverton, Devon", website: "https://www.tesla.com/en_GB/supercharger" },
      { id: "valley-rocks", name: "Valley of Rocks", lat: 51.233, lng: -3.85, type: "nature", desc: "Wild, dry river valley defined by surreal Devonian rock formations.", website: "https://www.visitlyntonandlynmouth.com" },
      { id: "yha-exford", name: "YHA Exford", lat: 51.134, lng: -3.528, type: "stay", desc: "Authentic lodge in the heart of Exmoor, perfect for stargazing.", wikiTitle: "Exford", website: "https://www.yha.org.uk" },
    ],
    stopOrder: ["tiverton-sc", "valley-rocks", "yha-exford"],
  },
  {
    id: 4,
    title: "LEG 4: The Wiltshire Downs",
    direction: "Return",
    stats: "~80 miles",
    estimatedTimeRange: "2h 00m – 2h 40m",
    optimalTravelTime:
      "Arrive at West Kennet and Lacock either early morning or late afternoon to bypass peak commercial tourism hours.",
    desc: "Swing east tracking old monastic routes. Head to high chalk downs, visiting Lacock Abbey's medieval cloisters and the prehistoric West Kennet Long Barrow.",
    waypoints: [
      { id: "lacock", name: "Lacock Abbey", lat: 51.414, lng: -2.116, type: "history", desc: "Preserved 13th-century village and monastic brewing house.", website: "https://www.nationaltrust.org.uk/visit/wiltshire/lacock" },
      { id: "west-kennet", name: "West Kennet Long Barrow", lat: 51.408, lng: -1.85, type: "history", desc: "Massive Neolithic burial chamber, walk inside ancient stone cells.", website: "https://www.english-heritage.org.uk/visit/places/west-kennet-long-barrow/" },
      { id: "chippenham-sc", name: "Chippenham SC", lat: 51.472, lng: -2.138, type: "charger", desc: "Top up in Wiltshire.", wikiTitle: "Chippenham", website: "https://www.tesla.com/en_GB/supercharger" },
      { id: "yha-bath", name: "YHA Bath Mill", lat: 51.378, lng: -2.395, type: "stay", desc: "Tucked in a wooded valley on the Cotswold fringe.", wikiTitle: "Bath, Somerset", website: "https://www.yha.org.uk/hostel/yha-bath" },
    ],
    stopOrder: ["chippenham-sc", "lacock", "west-kennet", "yha-bath"],
  },
  {
    id: 5,
    title: "LEG 5: Staffordshire Moorlands",
    direction: "Return",
    stats: "~95 miles",
    estimatedTimeRange: "2h 15m – 3h 10m",
    optimalTravelTime:
      "Mid-day (11:00-14:00) or Sundays. Bypassing Birmingham via M5/M6 is highly susceptible to severe weekday commuter delays (07:00-09:30 & 16:00-18:30).",
    desc: "Push north up the spine of the country via historic backroads. Stop at Croxden Abbey, majestic 12th-century limestone ruins ignored by mainstream tourism.",
    waypoints: [
      { id: "croxden", name: "Croxden Abbey", lat: 52.955, lng: -1.905, type: "history", desc: "Soaring 12th-century Cistercian abbey ruins.", website: "https://www.english-heritage.org.uk/visit/places/croxden-abbey/" },
      { id: "uttoxeter-sc", name: "Uttoxeter SC", lat: 52.898, lng: -1.848, type: "charger", desc: "Perfectly positioned minutes from Croxden.", wikiTitle: "Uttoxeter", website: "https://www.tesla.com/en_GB/supercharger" },
      { id: "yha-ilam", name: "YHA Ilam Hall", lat: 53.054, lng: -1.802, type: "stay", desc: "Gothic manor house at the entrance to Dovedale.", wikiTitle: "Ilam, Staffordshire", website: "https://www.yha.org.uk/hostel/yha-ilam-hall" },
    ],
    stopOrder: ["uttoxeter-sc", "croxden", "yha-ilam"],
  },
  {
    id: 6,
    title: "LEG 6: The Peak District Fringe",
    direction: "Return",
    stats: "~25 miles",
    estimatedTimeRange: "45m – 1h 10m",
    optimalTravelTime:
      "Late afternoon. The Peak District fringe routes (A53/A54) are much quieter post-16:00, allowing a scenic sunset cruise.",
    desc: "A short final leg through rugged gritstone ridges. Stop at Lud's Church, a moss-covered chasm, before cruising back into Macclesfield.",
    waypoints: [
      { id: "luds-church", name: "Lud's Church", lat: 53.188, lng: -2.009, type: "nature", desc: "Profound, moss-covered deep green chasm in gritstone bedrock.", website: "https://www.staffs-wildlife.org.uk/nature-reserves/roaches" },
      { id: "macc-end", name: "Macclesfield (End)", lat: 53.26, lng: -2.128, type: "start", desc: "Return to the Silk Capital.", wikiTitle: "Macclesfield", website: "https://visitcheshire.com" },
    ],
    stopOrder: ["luds-church", "macc-end"],
  },
];

const wpIndex = new Map();
routeData.forEach((leg) => leg.waypoints.forEach((wp) => wpIndex.set(wp.id, wp)));

export function getWaypoint(id) {
  return wpIndex.get(id);
}

export const allWaypoints = [...wpIndex.values()];

// Ordered [lat, lng] routing stops for a leg, chained from the previous leg's final stop.
export function legRoutingCoords(leg) {
  const idx = routeData.findIndex((l) => l.id === leg.id);
  const stops = leg.stopOrder.map((id) => wpIndex.get(id));
  if (idx > 0) {
    const prev = routeData[idx - 1];
    const prevLast = wpIndex.get(prev.stopOrder[prev.stopOrder.length - 1]);
    stops.unshift(prevLast);
  }
  return stops.map((wp) => [wp.lat, wp.lng]);
}

export const typeLabels = {
  charger: "EV Rapid Charger",
  history: "Antiquity & Ruins",
  nature: "Landscape",
  stay: "Historic Lodging",
  start: "Waypoint",
};
