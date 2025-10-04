let map, layerGroup, impactMarker;

document.addEventListener("DOMContentLoaded", () => {
  map = L.map("map").setView([20, 78], 3);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 10,
  }).addTo(map);

  layerGroup = L.layerGroup().addTo(map);

  // 📍 Click to mark impact point
  map.on("click", async (e) => {
    const lat = e.latlng.lat.toFixed(3);
    const lng = e.latlng.lng.toFixed(3);
    document.getElementById("lat").value = lat;
    document.getElementById("lng").value = lng;

    if (impactMarker) map.removeLayer(impactMarker);
    impactMarker = L.marker([lat, lng], { title: "Impact Center" })
      .addTo(map)
      .bindPopup("☄️ Impact Center")
      .openPopup();
  });

  // Buttons
  document.getElementById("impactBtn").addEventListener("click", showImpact);
  document.getElementById("quakeBtn").addEventListener("click", showEarthquake);
  document.getElementById("tsunamiBtn").addEventListener("click", showTsunami);
  document.getElementById("clear").addEventListener("click", clearMap);
  document.getElementById("deflect").addEventListener("input", (e) => {
    document.getElementById("deflectVal").textContent = e.target.value + " km/s";
  });
  document.getElementById("loadNEO").addEventListener("click", loadNEO);

  // 🧭 Add Legend
  addLegend();
});

function clearMap() {
  layerGroup.clearLayers();
  if (impactMarker) {
    map.removeLayer(impactMarker);
    impactMarker = null;
  }
  document.getElementById("results").innerHTML = "";
}

function getInputValues() {
  return {
    lat: parseFloat(document.getElementById("lat").value),
    lng: parseFloat(document.getElementById("lng").value),
    diameter: parseFloat(document.getElementById("diameter").value),
    velocity: parseFloat(document.getElementById("velocity").value),
    density: parseFloat(document.getElementById("density").value),
  };
}

async function loadNEO() {
  const key = document.getElementById("apiKey").value || "DEMO_KEY";
  try {
    const res = await fetch(`https://api.nasa.gov/neo/rest/v1/neo/browse?api_key=${key}`);
    const data = await res.json();
    const asteroid =
      data.near_earth_objects[Math.floor(Math.random() * data.near_earth_objects.length)];

    document.getElementById("neoName").value = asteroid.name;
    const avgDiameter =
      (asteroid.estimated_diameter.meters.estimated_diameter_min +
        asteroid.estimated_diameter.meters.estimated_diameter_max) /
      2;
    document.getElementById("diameter").value = avgDiameter.toFixed(1);
    document.getElementById("velocity").value = parseFloat(
      asteroid.close_approach_data[0]?.relative_velocity?.kilometers_per_second || 20
    ).toFixed(1);
  } catch {
    alert("Error loading NEO. Try again or use DEMO_KEY.");
  }
}

/* ---------- IMPACT ---------- */
function showImpact() {
  clearMap();
  const { lat, lng, diameter, velocity, density } = getInputValues();
  if (!lat || !lng) return alert("Select an impact point first!");

  impactMarker = L.marker([lat, lng], { title: "Impact Center" })
    .addTo(map)
    .bindPopup("☄️ Impact Center")
    .openPopup();

  const v = velocity * 1000;
  const mass = (4 / 3) * Math.PI * Math.pow(diameter / 2, 3) * density;
  const energy = 0.5 * mass * Math.pow(v, 2);
  const crater = Math.pow(energy, 0.25) / 100;

  L.circle([lat, lng], { radius: crater * 500, color: "red", fillOpacity: 0.4 }).addTo(layerGroup);
  L.circle([lat, lng], { radius: crater * 3000, color: "#ff7b00", fillOpacity: 0.2 }).addTo(layerGroup);
  animatePulse(lat, lng);

  document.getElementById("results").innerHTML = `
    <h3>☄️ Impact Simulation</h3>
    <p><b>Diameter:</b> ${diameter} m</p>
    <p><b>Velocity:</b> ${velocity} km/s</p>
    <p><b>Energy:</b> ${(energy / 4.184e9).toExponential(2)} tons TNT</p>
    <p><b>Crater Diameter:</b> ${crater.toFixed(1)} m</p>`;
}

/* ---------- EARTHQUAKE ---------- */
function showEarthquake() {
  clearMap();
  const { lat, lng, diameter, velocity, density } = getInputValues();
  if (!lat || !lng) return alert("Select an impact point first!");

  impactMarker = L.marker([lat, lng], { title: "Impact Center" })
    .addTo(map)
    .bindPopup("🌋 Seismic Origin")
    .openPopup();

  const v = velocity * 1000;
  const mass = (4 / 3) * Math.PI * Math.pow(diameter / 2, 3) * density;
  const energy = 0.5 * mass * Math.pow(v, 2);
  const magnitude = (Math.log10(energy) / 1.5 - 5).toFixed(1);

  for (let i = 1; i <= 4; i++) {
    const ring = L.circle([lat, lng], {
      radius: i * 150000,
      color: "orange",
      opacity: 0.5,
      fill: false,
      weight: 2,
    }).addTo(layerGroup);
    animateCircle(ring);
  }

  document.getElementById("results").innerHTML = `
    <h3>🌋 Earthquake Simulation</h3>
    <p><b>Magnitude:</b> M ${magnitude}</p>
    <p>Seismic shockwaves expanding outward...</p>`;
}

/* ---------- TSUNAMI ---------- */
async function showTsunami() {
  clearMap();
  const { lat, lng, diameter, velocity } = getInputValues();
  if (!lat || !lng) return alert("Select an impact point first!");

  impactMarker = L.marker([lat, lng], { title: "Impact Center" })
    .addTo(map)
    .bindPopup("🌊 Oceanic Impact Center")
    .openPopup();

  const tsunamiHeight = (diameter / 100) * (velocity / 10);
  const tsunamiRadius = tsunamiHeight * 100000;
  const elevation = await getElevation(lat, lng);

  if (elevation > 20) {
    document.getElementById("results").innerHTML = `
      <h3>🌊 Tsunami Simulation</h3>
      <p>No tsunami generated — impact occurred on land.</p>
      <p><b>Elevation:</b> ${elevation.toFixed(1)} m</p>`;
    return;
  }

  for (let j = 1; j <= 3; j++) {
    const wave = L.circle([lat, lng], {
      radius: j * tsunamiRadius,
      color: "#005bff", // 🌊 Darker Blue
      dashArray: "8,6",
      opacity: 0.5,
      fill: false,
      weight: 2.5,
    }).addTo(layerGroup);
    animateCircle(wave);
  }

  document.getElementById("results").innerHTML = `
    <h3>🌊 Tsunami Simulation</h3>
    <p><b>Wave Height:</b> ${tsunamiHeight.toFixed(1)} m</p>
    <p><b>Wave Radius:</b> ${(tsunamiRadius / 1000).toFixed(1)} km</p>
    <p><b>Elevation:</b> ${elevation.toFixed(1)} m</p>`;
}

/* ---------- Animations ---------- */
function animatePulse(lat, lng) {
  const circle = L.circle([lat, lng], { radius: 10000, color: "red", fillOpacity: 0.6 }).addTo(layerGroup);
  let r = 10000,
    op = 0.6;
  const t = setInterval(() => {
    r += 20000;
    op -= 0.03;
    circle.setRadius(r);
    circle.setStyle({ fillOpacity: op });
    if (op <= 0) {
      clearInterval(t);
      layerGroup.removeLayer(circle);
    }
  }, 80);
}

function animateCircle(c) {
  let r = c.getRadius(),
    op = c.options.opacity;
  const t = setInterval(() => {
    r += 20000;
    op -= 0.01;
    c.setRadius(r);
    c.setStyle({ opacity: op });
    if (op <= 0.05) {
      clearInterval(t);
      layerGroup.removeLayer(c);
    }
  }, 100);
}

/* ---------- 🌍 GLOBAL ELEVATION (Open-Elevation API) ---------- */
async function getElevation(lat, lng) {
  try {
    const res = await fetch(`https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lng}`);
    const data = await res.json();
    return data.results[0].elevation;
  } catch (err) {
    console.error("Elevation error:", err);
    return 100;
  }
}

/* ---------- 🧭 LEGEND PANEL ---------- */
function addLegend() {
  const legend = L.control({ position: "bottomright" });

  legend.onAdd = function () {
    const div = L.DomUtil.create("div", "info legend");
    div.innerHTML = `
      <h4>🧭 Legend</h4>
      <p><span style="background:red;"></span> Impact Zone</p>
      <p><span style="background:orange;"></span> Earthquake Waves</p>
      <p><span style="background:#005bff;"></span> Tsunami Waves</p>
    `;
    return div;
  };

  legend.addTo(map);
}