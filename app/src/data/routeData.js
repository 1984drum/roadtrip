// Route data for the Road Trip app. 15 legs, each verified against real OSRM
// driving times to stay within the ~2h-per-leg rule (worst leg 2h15m).
// Waypoint ids are used to build the routing chain; each leg starts where the
// previous one ended. Ids beginning "opt-" were promoted from the optional
// sites layer — keep the ids stable (ratings/postcodes/venue data key on them).

export const routeData = [
  {
    id: 1,
    title: "LEG 1: Cheshire Plain & the Sandstone Ridge",
    direction: "Outbound",
    stats: "~82 miles",
    estimatedTimeRange: "2h 05m – 2h 35m",
    optimalTravelTime:
      "Depart by 09:30 to clear the M6/A534 junctions before lunch traffic; Beeston's car park fills by 11:00 on weekends.",
    desc: "Ease out of Macclesfield past the wonkiest Tudor house in England, then along the sandstone ridge to Beeston's crag-top castle and the ruins of Roman Wroxeter.",
    waypoints: [
      { id: "macc-start", name: "Macclesfield (Start)", lat: 53.259, lng: -2.127, type: "start", desc: "The industrial silk-weaving town.", wikiTitle: "Macclesfield", website: "https://visitcheshire.com" },
      { id: "opt-moreton", name: "Little Moreton Hall", lat: 53.1271, lng: -2.2517, type: "history", desc: "Wonky Tudor moated manor, one of England's finest timber-framed houses.", built: 1504, wikiTitle: "Little Moreton Hall", website: "https://www.nationaltrust.org.uk/visit/cheshire-greater-manchester/little-moreton-hall" },
      { id: "opt-beeston", name: "Beeston Castle", lat: 53.1287, lng: -2.6932, type: "history", desc: "13th-century ruin on a dramatic crag with views across eight counties.", built: 1226, wikiTitle: "Beeston Castle", website: "https://www.english-heritage.org.uk/visit/places/beeston-castle-and-woodland-park/" },
      { id: "opt-wroxeter", name: "Wroxeter Roman City", lat: 52.6742, lng: -2.6441, type: "history", desc: "Ruins of the fourth-largest city in Roman Britain, with a reconstructed townhouse.", built: 58, wikiTitle: "Viroconium Cornoviorum", website: "https://www.english-heritage.org.uk/visit/places/wroxeter-roman-city/" },
    ],
    stopOrder: ["macc-start", "opt-moreton", "opt-beeston", "opt-wroxeter"],
  },
  {
    id: 2,
    title: "LEG 2: The Shropshire Marches",
    direction: "Outbound",
    stats: "~47 miles",
    estimatedTimeRange: "1h 10m – 1h 35m",
    optimalTravelTime:
      "Avoid the A49 around Shrewsbury during the 08:00 commuter rush; Stokesay is quietest before noon.",
    desc: "South down the A49 through the Marches to Stokesay Castle, a top-up at Ludlow, and a night at the old watermill in Clun.",
    waypoints: [
      { id: "stokesay", name: "Stokesay Castle", lat: 52.435, lng: -2.83, type: "history", desc: "Finest preserved 13th-century fortified manor house in England.", built: 1281, wikiTitle: "Stokesay Castle", website: "https://www.english-heritage.org.uk/visit/places/stokesay-castle/" },
      { id: "ludlow-sc", name: "Ludlow Supercharger", lat: 52.373, lng: -2.718, type: "charger", desc: "Top up near Stokesay.", wikiTitle: "Ludlow", website: "https://www.tesla.com/en_GB/supercharger" },
      { id: "yha-clun", name: "YHA Clun Mill", lat: 52.423, lng: -3.03, type: "stay", desc: "Restored 18th-century watermill tucked into a quiet historic valley.", built: 1750, wikiTitle: "Clun", website: "https://www.yha.org.uk/hostel/yha-clun-mill" },
    ],
    stopOrder: ["stokesay", "ludlow-sc", "yha-clun"],
  },
  {
    id: 3,
    title: "LEG 3: Herefordshire & the Wye",
    direction: "Outbound",
    stats: "~64 miles",
    estimatedTimeRange: "1h 45m – 2h 15m",
    optimalTravelTime:
      "Hereford's ring road clogs 16:30–18:00; aim to be at Goodrich by mid-afternoon.",
    desc: "Border lanes south to Hereford's Mappa Mundi, the astonishing Norman carvings at Kilpeck, and the Wye Valley's finest castle at Goodrich.",
    waypoints: [
      { id: "opt-hereford", name: "Hereford Cathedral & Mappa Mundi", lat: 52.0539, lng: -2.716, type: "history", desc: "Home of the c.1300 Mappa Mundi and the world's largest chained library.", built: 1079, wikiTitle: "Hereford Cathedral", website: "https://www.herefordcathedral.org" },
      { id: "opt-kilpeck", name: "Kilpeck Church", lat: 51.9694, lng: -2.806, type: "history", desc: "Small Norman church with astonishing 12th-century carvings, barely weathered in 900 years.", built: 1140, wikiTitle: "Church of St Mary and St David, Kilpeck", website: "https://www.visitherefordshire.co.uk" },
      { id: "opt-goodrich", name: "Goodrich Castle", lat: 51.8757, lng: -2.6163, type: "history", desc: "Best-preserved medieval castle in the Wye Valley, red sandstone above a river bend.", built: 1101, wikiTitle: "Goodrich Castle", website: "https://www.english-heritage.org.uk/visit/places/goodrich-castle/" },
    ],
    stopOrder: ["opt-hereford", "opt-kilpeck", "opt-goodrich"],
  },
  {
    id: 4,
    title: "LEG 4: The Severn Vale",
    direction: "Outbound",
    stats: "~47 miles",
    estimatedTimeRange: "1h 20m – 1h 45m",
    optimalTravelTime:
      "Cross the M50/M5 corridor before 15:30 to miss the school-run crush around Tewkesbury.",
    desc: "Across the vale to Tewkesbury's mighty Norman abbey, the silent ruins of Hailes, and Sudeley Castle where Katherine Parr lies buried.",
    waypoints: [
      { id: "opt-tewkesbury", name: "Tewkesbury Abbey", lat: 51.9905, lng: -2.1607, type: "history", desc: "Vast Norman abbey church with the finest Romanesque tower in Europe.", built: 1087, wikiTitle: "Tewkesbury Abbey", website: "https://www.tewkesburyabbey.org.uk" },
      { id: "hailes", name: "Hailes Abbey", lat: 51.966, lng: -1.923, type: "history", desc: "Former Cistercian monastery dissolved by Henry VIII.", built: 1246, wikiTitle: "Hailes Abbey", website: "https://www.english-heritage.org.uk/visit/places/hailes-abbey/" },
      { id: "opt-sudeley", name: "Sudeley Castle", lat: 51.9474, lng: -1.9564, type: "history", desc: "Cotswold castle where Katherine Parr, Henry VIII's last queen, lies buried.", built: 1443, wikiTitle: "Sudeley Castle", website: "https://sudeleycastle.co.uk" },
    ],
    stopOrder: ["opt-tewkesbury", "hailes", "opt-sudeley"],
  },
  {
    id: 5,
    title: "LEG 5: The Cotswold Edge",
    direction: "Outbound",
    stats: "~48 miles",
    estimatedTimeRange: "1h 30m – 1h 55m",
    optimalTravelTime:
      "The A417 'Missing Link' at Birdlip is a notorious bottleneck 15:30–18:30 — be through it by mid-afternoon.",
    desc: "Along the escarpment to Haresfield Beacon's sweeping Severn views, a top-up at Michaelwood, and a quiet night near the Berkeley Estate.",
    waypoints: [
      { id: "haresfield", name: "Haresfield Beacon", lat: 51.776, lng: -2.234, type: "nature", desc: "Spectacular sweeping views over the Severn Estuary.", wikiTitle: "Haresfield Beacon", website: "https://www.nationaltrust.org.uk/visit/gloucestershire-cotswolds/haresfield-beacon-and-standish-wood" },
      { id: "michaelwood-sc", name: "Dursley / Michaelwood SC", lat: 51.658, lng: -2.408, type: "charger", desc: "Supercharger positioned just off the route.", wikiTitle: "Michaelwood services", website: "https://www.tesla.com/en_GB/supercharger" },
      { id: "yha-slimbridge", name: "YHA Slimbridge", lat: 51.74, lng: -2.404, type: "stay", desc: "Nestled along the quiet lanes near the Berkeley Estate.", wikiTitle: "Slimbridge", website: "https://www.yha.org.uk" },
    ],
    stopOrder: ["haresfield", "michaelwood-sc", "yha-slimbridge"],
  },
  {
    id: 6,
    title: "LEG 6: Berkeley to Avalon",
    direction: "Outbound",
    stats: "~55 miles",
    estimatedTimeRange: "1h 40m – 2h 10m",
    optimalTravelTime:
      "Avoid the M5 southbound on Friday afternoons; Glastonbury Tor at golden hour is worth timing the day around.",
    desc: "Edward II's murder site at Berkeley, England's first Gothic cathedral at Wells, then up the Tor for sunset over the Somerset Levels.",
    waypoints: [
      { id: "opt-berkeley", name: "Berkeley Castle", lat: 51.6884, lng: -2.4573, type: "history", desc: "Ancient fortress where Edward II was murdered in 1327; held by the Berkeleys for 900 years.", built: 1067, wikiTitle: "Berkeley Castle", website: "https://www.berkeley-castle.com" },
      { id: "opt-wells", name: "Wells Cathedral", lat: 51.2104, lng: -2.6437, type: "history", desc: "England's first fully Gothic cathedral with its extraordinary scissor arches.", built: 1175, wikiTitle: "Wells Cathedral", website: "https://www.wellscathedral.org.uk" },
      { id: "opt-glastonbury", name: "Glastonbury Tor", lat: 51.1442, lng: -2.6986, type: "history", desc: "Mythic terraced hill crowned by a roofless medieval tower — Avalon itself, by legend.", built: 1360, wikiTitle: "Glastonbury Tor", website: "https://www.nationaltrust.org.uk/visit/somerset/glastonbury-tor" },
    ],
    stopOrder: ["opt-berkeley", "opt-wells", "opt-glastonbury"],
  },
  {
    id: 7,
    title: "LEG 7: To the Exmoor Fringe",
    direction: "Outbound",
    stats: "~77 miles",
    estimatedTimeRange: "2h 15m – 2h 45m",
    optimalTravelTime:
      "The longest leg — charge fully at Tiverton. The M5 around Bridgwater is grim on summer Saturdays; go early.",
    desc: "The one long haul: charge at Tiverton, then England's most complete monastic cloister at Cleeve and the hilltop castle above Dunster's medieval yarn market.",
    waypoints: [
      { id: "tiverton-sc", name: "Tiverton Supercharger", lat: 50.91, lng: -3.424, type: "charger", desc: "Grab a full charge before heading into deep coastal valleys.", wikiTitle: "Tiverton, Devon", website: "https://www.tesla.com/en_GB/supercharger" },
      { id: "opt-cleeve", name: "Cleeve Abbey", lat: 51.1565, lng: -3.366, type: "history", desc: "Cistercian abbey with the most complete monastic cloister buildings in England.", built: 1198, wikiTitle: "Cleeve Abbey", website: "https://www.english-heritage.org.uk/visit/places/cleeve-abbey/" },
      { id: "opt-dunster", name: "Dunster Castle", lat: 51.1811, lng: -3.4453, type: "history", desc: "Dramatic hilltop castle above a perfect medieval yarn-market village.", built: 1086, wikiTitle: "Dunster Castle", website: "https://www.nationaltrust.org.uk/visit/somerset/dunster-castle-and-watermill" },
    ],
    stopOrder: ["tiverton-sc", "opt-cleeve", "opt-dunster"],
  },
  {
    id: 8,
    title: "LEG 8: Exmoor & the North Devon Coast",
    direction: "Outbound",
    stats: "~49 miles",
    estimatedTimeRange: "1h 35m – 2h 00m",
    optimalTravelTime:
      "Coastal lanes are single-track in places — drive them mid-morning before day-trippers arrive. Stargazing from Exford is superb.",
    desc: "The far point of the trip: the surreal Valley of Rocks above the sea, the prehistoric clapper bridge at Tarr Steps, and a night in the heart of Exmoor.",
    waypoints: [
      { id: "valley-rocks", name: "Valley of Rocks", lat: 51.233, lng: -3.85, type: "nature", desc: "Wild, dry river valley defined by surreal Devonian rock formations.", wikiTitle: "Valley of Rocks", website: "https://visitlyntonandlynmouth.com" },
      { id: "opt-tarr", name: "Tarr Steps", lat: 51.0782, lng: -3.6178, type: "nature", desc: "Prehistoric clapper bridge of giant stone slabs across the River Barle.", built: -1000, wikiTitle: "Tarr Steps", website: "https://www.exmoor-nationalpark.gov.uk" },
      { id: "yha-exford", name: "YHA Exford", lat: 51.134, lng: -3.528, type: "stay", desc: "Authentic lodge in the heart of Exmoor, perfect for stargazing.", wikiTitle: "Exford", website: "https://www.yha.org.uk" },
    ],
    stopOrder: ["valley-rocks", "opt-tarr", "yha-exford"],
  },
  {
    id: 9,
    title: "LEG 9: Exmoor to East Somerset",
    direction: "Return",
    stats: "~70 miles",
    estimatedTimeRange: "1h 45m – 2h 10m",
    optimalTravelTime:
      "A transit morning — leave Exford by 10:00 and you'll have Nunney's moat to yourself before lunch.",
    desc: "Turn for home across the Brendon Hills and the Levels to Nunney — a perfect little French-style moated castle in a village centre.",
    waypoints: [
      { id: "opt-nunney", name: "Nunney Castle", lat: 51.2093, lng: -2.3784, type: "history", desc: "Moated French-style castle in a village centre — small, romantic, free to visit.", built: 1373, wikiTitle: "Nunney Castle", website: "https://www.english-heritage.org.uk/visit/places/nunney-castle/" },
    ],
    stopOrder: ["opt-nunney"],
  },
  {
    id: 10,
    title: "LEG 10: The Frome Valley",
    direction: "Return",
    stats: "~23 miles",
    estimatedTimeRange: "40m – 1h 00m",
    optimalTravelTime:
      "Short hop — take it slow. Farleigh Hungerford's crypt is at its atmospheric best in low afternoon light.",
    desc: "A gentle afternoon: Farleigh Hungerford's wall paintings and lead coffins, then down into the wooded valley at Bath Mill for the night.",
    waypoints: [
      { id: "opt-farleigh", name: "Farleigh Hungerford Castle", lat: 51.3165, lng: -2.2853, type: "history", desc: "Ruined castle with rare medieval wall paintings and a crypt of lead coffins.", built: 1377, wikiTitle: "Farleigh Hungerford Castle", website: "https://www.english-heritage.org.uk/visit/places/farleigh-hungerford-castle/" },
      { id: "yha-bath", name: "YHA Bath Mill", lat: 51.378, lng: -2.395, type: "stay", desc: "Tucked in a wooded valley on the Cotswold fringe.", wikiTitle: "Bath, Somerset", website: "https://www.yha.org.uk/hostel/yha-bath" },
    ],
    stopOrder: ["opt-farleigh", "yha-bath"],
  },
  {
    id: 11,
    title: "LEG 11: The Wiltshire Downs",
    direction: "Return",
    stats: "~39 miles",
    estimatedTimeRange: "1h 20m – 1h 45m",
    optimalTravelTime:
      "Arrive at Lacock and Avebury early morning or late afternoon to bypass peak tourist hours.",
    desc: "High chalk country: Lacock Abbey's cloisters, a top-up at Chippenham, then walk among the stones at Avebury and into the West Kennet long barrow.",
    waypoints: [
      { id: "lacock", name: "Lacock Abbey", lat: 51.414, lng: -2.116, type: "history", desc: "Preserved 13th-century village and monastic brewing house.", built: 1232, wikiTitle: "Lacock Abbey", website: "https://www.nationaltrust.org.uk/visit/wiltshire/lacock" },
      { id: "chippenham-sc", name: "Chippenham SC", lat: 51.472, lng: -2.138, type: "charger", desc: "Top up in Wiltshire.", wikiTitle: "Chippenham", website: "https://www.tesla.com/en_GB/supercharger" },
      { id: "opt-avebury", name: "Avebury Stone Circle", lat: 51.4284, lng: -1.854, type: "history", desc: "The largest stone circle in the world, with a village inside it. Walk among the stones freely.", built: -2850, wikiTitle: "Avebury", website: "https://www.nationaltrust.org.uk/visit/wiltshire/avebury" },
      { id: "west-kennet", name: "West Kennet Long Barrow", lat: 51.408, lng: -1.85, type: "history", desc: "Massive Neolithic burial chamber, walk inside ancient stone cells.", built: -3650, wikiTitle: "West Kennet Long Barrow", website: "https://www.english-heritage.org.uk/visit/places/west-kennet-long-barrow/" },
    ],
    stopOrder: ["lacock", "chippenham-sc", "opt-avebury", "west-kennet"],
  },
  {
    id: 12,
    title: "LEG 12: Up the Severn",
    direction: "Return",
    stats: "~72 miles",
    estimatedTimeRange: "1h 35m – 2h 00m",
    optimalTravelTime:
      "Mostly motorway transit (M4/M5) — mid-day or Sunday keeps it painless. Worcester's cloisters close at 17:00.",
    desc: "A purposeful push north to Worcester, where King John lies entombed beside one of England's finest Norman crypts.",
    waypoints: [
      { id: "opt-worcester", name: "Worcester Cathedral", lat: 52.1888, lng: -2.2207, type: "history", desc: "Riverside cathedral holding King John's tomb and a superb Norman crypt.", built: 1084, wikiTitle: "Worcester Cathedral", website: "https://www.worcestercathedral.org.uk" },
    ],
    stopOrder: ["opt-worcester"],
  },
  {
    id: 13,
    title: "LEG 13: Cathedral Country",
    direction: "Return",
    stats: "~85 miles",
    estimatedTimeRange: "1h 55m – 2h 20m",
    optimalTravelTime:
      "Bypassing Birmingham is highly susceptible to weekday commuter delays (07:00–09:30 & 16:00–18:30) — travel 11:00–14:00 or on a Sunday.",
    desc: "Skirt Birmingham to the three spires of Lichfield, then Tutbury Castle — prison of Mary, Queen of Scots, four times over — and a charge at Uttoxeter.",
    waypoints: [
      { id: "opt-lichfield", name: "Lichfield Cathedral", lat: 52.6857, lng: -1.8306, type: "history", desc: "The only medieval English cathedral with three spires — 'the Ladies of the Vale'.", built: 1195, wikiTitle: "Lichfield Cathedral", website: "https://www.lichfield-cathedral.org" },
      { id: "opt-tutbury", name: "Tutbury Castle", lat: 52.8598, lng: -1.6903, type: "history", desc: "Ruined fortress that imprisoned Mary, Queen of Scots — four separate times.", built: 1071, wikiTitle: "Tutbury Castle", website: "https://www.tutburycastle.com" },
      { id: "uttoxeter-sc", name: "Uttoxeter SC", lat: 52.898, lng: -1.848, type: "charger", desc: "Perfectly positioned minutes from Croxden.", wikiTitle: "Uttoxeter", website: "https://www.tesla.com/en_GB/supercharger" },
    ],
    stopOrder: ["opt-lichfield", "opt-tutbury", "uttoxeter-sc"],
  },
  {
    id: 14,
    title: "LEG 14: Staffordshire Moorlands",
    direction: "Return",
    stats: "~18 miles",
    estimatedTimeRange: "40m – 55m",
    optimalTravelTime:
      "Half an hour of lanes — spend the saved time at Croxden, which mainstream tourism has never found.",
    desc: "A short, lovely run: the soaring 12th-century ruins of Croxden Abbey, then up to the Gothic manor at Ilam Hall on the edge of Dovedale.",
    waypoints: [
      { id: "croxden", name: "Croxden Abbey", lat: 52.955, lng: -1.905, type: "history", desc: "Soaring 12th-century Cistercian abbey ruins.", built: 1176, wikiTitle: "Croxden Abbey", website: "https://www.english-heritage.org.uk/visit/places/croxden-abbey/" },
      { id: "yha-ilam", name: "YHA Ilam Hall", lat: 53.054, lng: -1.802, type: "stay", desc: "Gothic manor house at the entrance to Dovedale.", built: 1826, wikiTitle: "Ilam, Staffordshire", website: "https://www.yha.org.uk/hostel/yha-ilam-hall" },
    ],
    stopOrder: ["croxden", "yha-ilam"],
  },
  {
    id: 15,
    title: "LEG 15: The Peak District Fringe",
    direction: "Return",
    stats: "~32 miles",
    estimatedTimeRange: "1h 10m – 1h 30m",
    optimalTravelTime:
      "The A53/A54 fringe roads are much quieter post-16:00, allowing a scenic sunset cruise home.",
    desc: "The final leg through rugged gritstone ridges: Lud's Church, a moss-covered chasm, before cruising back into Macclesfield.",
    waypoints: [
      { id: "luds-church", name: "Lud's Church", lat: 53.188, lng: -2.009, type: "nature", desc: "Profound, moss-covered deep green chasm in gritstone bedrock.", wikiTitle: "Lud's Church", website: "https://www.staffs-wildlife.org.uk/nature-reserves/roaches" },
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
