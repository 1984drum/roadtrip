// Optional points of interest near the route: extra sites and notable historic
// pubs that didn't make the main 15-leg itinerary. Rendered as grey markers,
// toggleable via the "Optional Stops" chip. kind: 'history' | 'nature' | 'pub'.
// nearLeg groups them for the leg PDF sheets.
// Coordinates verified against Nominatim (OpenStreetMap) search results.

export const optionalSites = [
  // Legs 1-2 — Shropshire
  { id: "opt-acton", name: "Acton Burnell Castle", lat: 52.6136, lng: -2.6885, kind: "history", nearLeg: 2, wikiTitle: "Acton Burnell Castle", desc: "Red sandstone shell of a 13th-century fortified manor; England's first parliament arguably met here.", built: 1284, website: "https://www.english-heritage.org.uk/visit/places/acton-burnell-castle/" },
  { id: "opt-ludlow-castle", name: "Ludlow Castle", lat: 52.3673, lng: -2.722, kind: "history", nearLeg: 2, wikiTitle: "Ludlow Castle", desc: "Mighty Norman border fortress above the Teme, later seat of the Council of the Marches.", built: 1075, website: "https://www.ludlowcastle.com" },
  { id: "opt-feathers", name: "The Feathers, Ludlow", lat: 52.3679, lng: -2.7189, kind: "pub", nearLeg: 2, wikiTitle: "The Feathers Hotel, Ludlow", desc: "Extravagantly timbered Jacobean coaching inn, once called 'the most handsome inn in the world'.", built: 1619, website: "https://www.feathersatludlow.co.uk" },

  // Legs 4-5 — Cotswolds
  { id: "opt-belas", name: "Belas Knap Long Barrow", lat: 51.9265, lng: -1.9709, kind: "history", nearLeg: 4, wikiTitle: "Belas Knap", desc: "Restored Neolithic chambered long barrow high on Cleeve Hill, 5,500 years old.", built: -3000, website: "https://www.english-heritage.org.uk/visit/places/belas-knap-long-barrow/" },
  { id: "opt-woolpack", name: "The Woolpack, Slad", lat: 51.7642, lng: -2.187, kind: "pub", nearLeg: 5, wikiTitle: "Slad", desc: "Laurie Lee's beloved local in the Cider with Rosie valley, little changed since.", built: 1650, website: "https://www.thewoolpackslad.com" },

  // Leg 8 — Exmoor
  { id: "opt-watersmeet", name: "Watersmeet", lat: 51.2232, lng: -3.7993, kind: "nature", nearLeg: 8, wikiTitle: "Watersmeet", desc: "Plunging wooded gorge where the East Lyn and Hoar Oak Water collide.", website: "https://www.nationaltrust.org.uk/visit/devon/watersmeet" },
  { id: "opt-royaloak", name: "The Royal Oak, Winsford", lat: 51.1025, lng: -3.5642, kind: "pub", nearLeg: 8, wikiTitle: "Winsford, Somerset", desc: "Thatched 12th-century inn in one of Exmoor's prettiest villages.", built: 1150, website: "https://www.theroyaloakexmoor.co.uk" },

  // Legs 10-11 — Somerset / Wiltshire
  { id: "opt-george", name: "The George Inn, Norton St Philip", lat: 51.302, lng: -2.3252, kind: "pub", nearLeg: 10, wikiTitle: "The George Inn, Norton St Philip", desc: "Claims to be Britain's oldest continuously licensed pub — serving since c.1397.", built: 1397, website: "https://butcombe.com/the-george-inn-somerset/" },
  { id: "opt-tithebarn", name: "Tithe Barn, Bradford-on-Avon", lat: 51.3435, lng: -2.253, kind: "history", nearLeg: 10, wikiTitle: "Tithe Barn, Bradford-on-Avon", desc: "Magnificent 14th-century monastic barn with a cathedral-like cruck roof.", built: 1341, website: "https://www.english-heritage.org.uk/visit/places/bradford-on-avon-tithe-barn/" },
  { id: "opt-silbury", name: "Silbury Hill", lat: 51.4158, lng: -1.8574, kind: "history", nearLeg: 11, wikiTitle: "Silbury Hill", desc: "Europe's largest prehistoric mound — purpose still unknown after 4,400 years.", built: -2400, website: "https://www.english-heritage.org.uk/visit/places/silbury-hill/" },

  // Legs 14-15 — Peak District fringe
  { id: "opt-thors", name: "Thor's Cave", lat: 53.0918, lng: -1.8542, kind: "nature", nearLeg: 14, wikiTitle: "Thor's Cave", desc: "Yawning cave mouth high above the Manifold Valley; occupied since the Stone Age.", built: -10000, website: "https://www.nationaltrust.org.uk/visit/peak-district-derbyshire/ilam-park-dovedale-and-the-white-peak" },
  { id: "opt-threeshires", name: "Three Shires Head", lat: 53.214, lng: -1.9875, kind: "nature", nearLeg: 15, wikiTitle: "Three Shire Heads", desc: "Packhorse bridge and waterfalls where Cheshire, Derbyshire and Staffordshire meet.", website: "https://www.peakdistrict.gov.uk" },
  { id: "opt-gawsworth", name: "Gawsworth Hall", lat: 53.2238, lng: -2.1637, kind: "history", nearLeg: 15, wikiTitle: "Gawsworth Hall", desc: "Black-and-white Tudor manor, home of Mary Fitton — possibly Shakespeare's 'Dark Lady'.", built: 1480, website: "https://www.gawsworthhall.com" },
  { id: "opt-catfiddle", name: "The Cat & Fiddle", lat: 53.2439, lng: -2.0311, kind: "pub", nearLeg: 15, wikiTitle: "Cat and Fiddle Inn", desc: "Second-highest pub in England, on the moor-top road into Macclesfield — now a distillery-taproom.", built: 1813, website: "https://theforestdistillery.com" },
];

export function optionalSitesForLeg(legId) {
  return optionalSites.filter((s) => s.nearLeg === legId);
}
