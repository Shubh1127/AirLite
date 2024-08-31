mapboxgl.accessToken = mapToken;

const map = new mapboxgl.Map({
  container: "map", // container ID
  center: listing.geometry.coordinates, // starting position [lng, lat]. Note that lat must be set between -90 and 90
  zoom: 9, // starting zoom
});
// console.log("coordinates from ejs", listing.geometry.coordinates); // This should output something like [77.209, 28.6139]

const marker = new mapboxgl.Marker({ color: "red" })
  .setLngLat(listing.geometry.coordinates)
  .addTo(map)
  .setPopup(
    new mapboxgl.Popup({ offset: 25 }).setHTML(`<h4>${listing.location}
    </h4><p>Exact Location provided after the booking</p>`)
  );
