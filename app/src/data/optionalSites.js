// Optional points of interest near the route: extra medieval sites, natural
// wonders and notable historic pubs. Rendered as grey markers, toggleable.
// kind: 'history' | 'nature' | 'pub'. nearLeg groups them for the leg PDF.
// Coordinates verified against Nominatim (OpenStreetMap) search results.

export const optionalSites = [
  // Leg 1 — Cheshire / Shropshire Marches
  { id: "opt-moreton", name: "Little Moreton Hall", lat: 53.1271, lng: -2.2517, kind: "history", nearLeg: 1, wikiTitle: "Little Moreton Hall", desc: "Wonky Tudor moated manor, one of England's finest timber-framed houses.", built: 1504, website: "https://www.nationaltrust.org.uk/visit/cheshire-greater-manchester/little-moreton-hall" },
  { id: "opt-beeston", name: "Beeston Castle", lat: 53.1287, lng: -2.6932, kind: "history", nearLeg: 1, wikiTitle: "Beeston Castle", desc: "13th-century ruin on a dramatic crag with views across eight counties.", built: 1226, website: "https://www.english-heritage.org.uk/visit/places/beeston-castle-and-woodland-park/" },
  { id: "opt-wroxeter", name: "Wroxeter Roman City", lat: 52.6742, lng: -2.6441, kind: "history", nearLeg: 1, wikiTitle: "Viroconium Cornoviorum", desc: "Ruins of the fourth-largest city in Roman Britain, with a reconstructed townhouse.", built: 58, website: "https://www.english-heritage.org.uk/visit/places/wroxeter-roman-city/" },
  { id: "opt-acton", name: "Acton Burnell Castle", lat: 52.6136, lng: -2.6885, kind: "history", nearLeg: 1, wikiTitle: "Acton Burnell Castle", desc: "Red sandstone shell of a 13th-century fortified manor; England's first parliament arguably met here.", built: 1284, website: "https://www.english-heritage.org.uk/visit/places/acton-burnell-castle/" },
  { id: "opt-ludlow-castle", name: "Ludlow Castle", lat: 52.3673, lng: -2.722, kind: "history", nearLeg: 1, wikiTitle: "Ludlow Castle", desc: "Mighty Norman border fortress above the Teme, later seat of the Council of the Marches.", built: 1075, website: "https://www.ludlowcastle.com" },
  { id: "opt-feathers", name: "The Feathers, Ludlow", lat: 52.3679, lng: -2.7189, kind: "pub", nearLeg: 1, wikiTitle: "The Feathers Hotel, Ludlow", desc: "Extravagantly timbered Jacobean coaching inn, once called 'the most handsome inn in the world'.", built: 1619, website: "https://www.feathersatludlow.co.uk" },

  // Leg 2 — Herefordshire / Severn Vale / Cotswolds
  { id: "opt-kilpeck", name: "Kilpeck Church", lat: 51.9694, lng: -2.806, kind: "history", nearLeg: 2, wikiTitle: "Church of St Mary and St David, Kilpeck", desc: "Small Norman church with astonishing 12th-century carvings, barely weathered in 900 years.", built: 1140, website: "https://www.visitherefordshire.co.uk" },
  { id: "opt-hereford", name: "Hereford Cathedral & Mappa Mundi", lat: 52.0539, lng: -2.716, kind: "history", nearLeg: 2, wikiTitle: "Hereford Cathedral", desc: "Home of the c.1300 Mappa Mundi and the world's largest chained library.", built: 1079, website: "https://www.herefordcathedral.org" },
  { id: "opt-goodrich", name: "Goodrich Castle", lat: 51.8757, lng: -2.6163, kind: "history", nearLeg: 2, wikiTitle: "Goodrich Castle", desc: "Best-preserved medieval castle in the Wye Valley, red sandstone above a river bend.", built: 1101, website: "https://www.english-heritage.org.uk/visit/places/goodrich-castle/" },
  { id: "opt-tewkesbury", name: "Tewkesbury Abbey", lat: 51.9905, lng: -2.1607, kind: "history", nearLeg: 2, wikiTitle: "Tewkesbury Abbey", desc: "Vast Norman abbey church with the finest Romanesque tower in Europe.", built: 1087, website: "https://tewkesburyabbey.org.uk" },
  { id: "opt-sudeley", name: "Sudeley Castle", lat: 51.9474, lng: -1.9564, kind: "history", nearLeg: 2, wikiTitle: "Sudeley Castle", desc: "Cotswold castle where Katherine Parr, Henry VIII's last queen, lies buried.", built: 1443, website: "https://sudeleycastle.co.uk" },
  { id: "opt-belas", name: "Belas Knap Long Barrow", lat: 51.9265, lng: -1.9709, kind: "history", nearLeg: 2, wikiTitle: "Belas Knap", desc: "Restored Neolithic chambered long barrow high on Cleeve Hill, 5,500 years old.", built: -3000, website: "https://www.english-heritage.org.uk/visit/places/belas-knap-long-barrow/" },
  { id: "opt-woolpack", name: "The Woolpack, Slad", lat: 51.7642, lng: -2.187, kind: "pub", nearLeg: 2, wikiTitle: "Slad", desc: "Laurie Lee's beloved local in the Cider with Rosie valley, little changed since.", built: 1650, website: "https://www.thewoolpackslad.com" },

  // Leg 3 — Somerset / Exmoor
  { id: "opt-berkeley", name: "Berkeley Castle", lat: 51.6884, lng: -2.4573, kind: "history", nearLeg: 3, wikiTitle: "Berkeley Castle", desc: "Ancient fortress where Edward II was murdered in 1327; held by the Berkeleys for 900 years.", built: 1067, website: "https://www.berkeley-castle.com" },
  { id: "opt-wells", name: "Wells Cathedral", lat: 51.2104, lng: -2.6437, kind: "history", nearLeg: 3, wikiTitle: "Wells Cathedral", desc: "England's first fully Gothic cathedral with its extraordinary scissor arches.", built: 1175, website: "https://www.wellscathedral.org.uk" },
  { id: "opt-glastonbury", name: "Glastonbury Tor", lat: 51.1442, lng: -2.6986, kind: "history", nearLeg: 3, wikiTitle: "Glastonbury Tor", desc: "Mythic terraced hill crowned by a roofless medieval tower — Avalon itself, by legend.", built: 1360, website: "https://www.nationaltrust.org.uk/visit/somerset/glastonbury-tor" },
  { id: "opt-cleeve", name: "Cleeve Abbey", lat: 51.1565, lng: -3.366, kind: "history", nearLeg: 3, wikiTitle: "Cleeve Abbey", desc: "Cistercian abbey with the most complete monastic cloister buildings in England.", built: 1198, website: "https://www.english-heritage.org.uk/visit/places/cleeve-abbey/" },
  { id: "opt-dunster", name: "Dunster Castle", lat: 51.1811, lng: -3.4453, kind: "history", nearLeg: 3, wikiTitle: "Dunster Castle", desc: "Dramatic hilltop castle above a perfect medieval yarn-market village.", built: 1086, website: "https://www.nationaltrust.org.uk/visit/somerset/dunster-castle-and-watermill" },
  { id: "opt-tarr", name: "Tarr Steps", lat: 51.0782, lng: -3.6178, kind: "nature", nearLeg: 3, wikiTitle: "Tarr Steps", desc: "Prehistoric clapper bridge of giant stone slabs across the River Barle.", built: -1000, website: "https://www.exmoor-nationalpark.gov.uk" },
  { id: "opt-watersmeet", name: "Watersmeet", lat: 51.2232, lng: -3.7993, kind: "nature", nearLeg: 3, wikiTitle: "Watersmeet", desc: "Plunging wooded gorge where the East Lyn and Hoar Oak Water collide.", website: "https://www.nationaltrust.org.uk/visit/devon/watersmeet" },
  { id: "opt-royaloak", name: "The Royal Oak, Winsford", lat: 51.1025, lng: -3.5642, kind: "pub", nearLeg: 3, wikiTitle: "Winsford, Somerset", desc: "Thatched 12th-century inn in one of Exmoor's prettiest villages.", built: 1150, website: "https://www.theroyaloakexmoor.co.uk" },

  // Leg 4 — Somerset / Wiltshire
  { id: "opt-nunney", name: "Nunney Castle", lat: 51.2093, lng: -2.3784, kind: "history", nearLeg: 4, wikiTitle: "Nunney Castle", desc: "Moated French-style castle in a village centre — small, romantic, free to visit.", built: 1373, website: "https://www.english-heritage.org.uk/visit/places/nunney-castle/" },
  { id: "opt-farleigh", name: "Farleigh Hungerford Castle", lat: 51.3165, lng: -2.2853, kind: "history", nearLeg: 4, wikiTitle: "Farleigh Hungerford Castle", desc: "Ruined castle with rare medieval wall paintings and a crypt of lead coffins.", built: 1377, website: "https://www.english-heritage.org.uk/visit/places/farleigh-hungerford-castle/" },
  { id: "opt-george", name: "The George Inn, Norton St Philip", lat: 51.302, lng: -2.3252, kind: "pub", nearLeg: 4, wikiTitle: "The George Inn, Norton St Philip", desc: "Claims to be Britain's oldest continuously licensed pub — serving since c.1397.", built: 1397, website: "https://butcombe.com/the-george-inn-somerset/" },
  { id: "opt-tithebarn", name: "Tithe Barn, Bradford-on-Avon", lat: 51.3435, lng: -2.253, kind: "history", nearLeg: 4, wikiTitle: "Tithe Barn, Bradford-on-Avon", desc: "Magnificent 14th-century monastic barn with a cathedral-like cruck roof.", built: 1341, website: "https://www.english-heritage.org.uk/visit/places/bradford-on-avon-tithe-barn/" },
  { id: "opt-avebury", name: "Avebury Stone Circle", lat: 51.4284, lng: -1.854, kind: "history", nearLeg: 4, wikiTitle: "Avebury", desc: "The largest stone circle in the world, with a village inside it. Walk among the stones freely.", built: -2850, website: "https://www.nationaltrust.org.uk/visit/wiltshire/avebury" },
  { id: "opt-silbury", name: "Silbury Hill", lat: 51.4158, lng: -1.8574, kind: "history", nearLeg: 4, wikiTitle: "Silbury Hill", desc: "Europe's largest prehistoric mound — purpose still unknown after 4,400 years.", built: -2400, website: "https://www.english-heritage.org.uk/visit/places/silbury-hill/" },

  // Leg 5 — up the spine
  { id: "opt-worcester", name: "Worcester Cathedral", lat: 52.1888, lng: -2.2207, kind: "history", nearLeg: 5, wikiTitle: "Worcester Cathedral", desc: "Riverside cathedral holding King John's tomb and a superb Norman crypt.", built: 1084, website: "https://www.worcestercathedral.org.uk" },
  { id: "opt-lichfield", name: "Lichfield Cathedral", lat: 52.6857, lng: -1.8306, kind: "history", nearLeg: 5, wikiTitle: "Lichfield Cathedral", desc: "The only medieval English cathedral with three spires — 'the Ladies of the Vale'.", built: 1195, website: "https://www.lichfield-cathedral.org" },
  { id: "opt-tutbury", name: "Tutbury Castle", lat: 52.8598, lng: -1.6903, kind: "history", nearLeg: 5, wikiTitle: "Tutbury Castle", desc: "Ruined fortress that imprisoned Mary, Queen of Scots — four separate times.", built: 1071, website: "https://www.tutburycastle.com" },

  // Leg 6 — Peak District fringe
  { id: "opt-thors", name: "Thor's Cave", lat: 53.0918, lng: -1.8542, kind: "nature", nearLeg: 6, wikiTitle: "Thor's Cave", desc: "Yawning cave mouth high above the Manifold Valley; occupied since the Stone Age.", built: -10000, website: "https://www.nationaltrust.org.uk/visit/peak-district-derbyshire/ilam-park-dovedale-and-the-white-peak" },
  { id: "opt-threeshires", name: "Three Shires Head", lat: 53.214, lng: -1.9875, kind: "nature", nearLeg: 6, wikiTitle: "Three Shire Heads", desc: "Packhorse bridge and waterfalls where Cheshire, Derbyshire and Staffordshire meet.", website: "https://www.peakdistrict.gov.uk" },
  { id: "opt-gawsworth", name: "Gawsworth Hall", lat: 53.2238, lng: -2.1637, kind: "history", nearLeg: 6, wikiTitle: "Gawsworth Hall", desc: "Black-and-white Tudor manor, home of Mary Fitton — possibly Shakespeare's 'Dark Lady'.", built: 1480, website: "https://www.gawsworthhall.com" },
  { id: "opt-catfiddle", name: "The Cat & Fiddle", lat: 53.2439, lng: -2.0311, kind: "pub", nearLeg: 6, wikiTitle: "Cat and Fiddle Inn", desc: "Second-highest pub in England, on the moor-top road into Macclesfield — now a distillery-taproom.", built: 1813, website: "https://theforestdistillery.com" },
];

export function optionalSitesForLeg(legId) {
  return optionalSites.filter((s) => s.nearLeg === legId);
}
