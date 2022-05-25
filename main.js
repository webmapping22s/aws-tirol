/* Wetterstationen Tirol Beispiel */

let innsbruck = {
    lat: 47.267222,
    lng: 11.392778,
    zoom: 11
};

// WMTS Hintergrundlayer von https://lawinen.report (CC BY avalanche.report) als Startlayer
let startLayer = L.tileLayer("https://static.avalanche.report/tms/{z}/{x}/{y}.webp", {
    attribution: '&copy; <a href="https://lawinen.report">CC BY avalanche.report</a>'
})

// Overlays Objekt für die thematischen Layer
let overlays = {
    stations: L.featureGroup(),
    temperature: L.featureGroup(),
    humidity: L.featureGroup(),
    snowheight: L.featureGroup(),
    wind: L.featureGroup(),
};

// Karte initialisieren
let map = L.map("map", {
    center: [innsbruck.lat, innsbruck.lng],
    zoom: innsbruck.zoom,
    layers: [
        startLayer
    ],
});

// Layer control mit WMTS Hintergründen und Overlays
let layerControl = L.control.layers({
    "Relief avalanche.report": startLayer,
    "Esri World Imagery": L.tileLayer.provider("Esri.WorldImagery"),
}, {
    "Wetterstationen": overlays.stations,
    "Temperatur": overlays.temperature,
    "Relative Luftfeuchtigkeit": overlays.humidity,
    "Schneehöhe": overlays.snowheight,
    "Wind": overlays.wind
}).addTo(map);

// Layer control ausklappen
layerControl.expand();

// Maßstab control
L.control.scale({
    imperial: false
}).addTo(map);

// Fullscreen control
L.control.fullscreen().addTo(map);

// diesen Layer beim Laden anzeigen
overlays.wind.addTo(map);

// Farben nach Wert und Schwellen ermitteln
let getColor = function(value, ramp) {
    //console.log(value,ramp);
    for (let rule of ramp) {
        //console.log(rule)
        if (value >= rule.min && value < rule.max) {
            return rule.color;
        }
    }
};
//console.log(getColor(-40, COLORS.temperature));

// Wetterstationen mit Icons und Popups
let drawStations = function(geojson) {
    L.geoJSON(geojson, {
        pointToLayer: function(geoJsonPoint, latlng) {
            let popup = `
                ${geoJsonPoint.properties.name} (${geoJsonPoint.geometry.coordinates[2]}m)
            `;
            return L.marker(latlng, {
                icon: L.icon({
                    iconUrl: "icons/wifi.png",
                    iconAnchor: [16, 37],
                    popupAnchor: [0, -37]
                })
            }).bindPopup(popup);
        }
    }).addTo(overlays.stations);
}

// Temperatur
let drawTemperature = function(geojson) {
    L.geoJSON(geojson, {
        filter: function(geoJsonPoint) {
            if (geoJsonPoint.properties.LT > -50 && geoJsonPoint.properties.LT < 50) {
                return true;
            }
        },
        pointToLayer: function(geoJsonPoint, latlng) {
            let popup = `
                ${geoJsonPoint.properties.name} (${geoJsonPoint.geometry.coordinates[2]}m)
            `;
            let color = getColor(
                geoJsonPoint.properties.LT,
                COLORS.temperature
            );

            return L.marker(latlng, {
                icon: L.divIcon({
                    className: "aws-div-icon",
                    html: `<span style="background-color:${color}">${geoJsonPoint.properties.LT.toFixed(1)}</span>`
                })
            }).bindPopup(popup);
        }
    }).addTo(overlays.temperature);
}

// Schneehöhen
let drawSnowheight = function(geojson) {
    L.geoJSON(geojson, {
        filter: function(geoJsonPoint) {
            if (geoJsonPoint.properties.HS > 0 && geoJsonPoint.properties.HS < 15000) {
                return true;
            }
        },
        pointToLayer: function(geoJsonPoint, latlng) {
            let popup = `
                ${geoJsonPoint.properties.name} (${geoJsonPoint.geometry.coordinates[2]}m)
            `;
            let color = getColor(
                geoJsonPoint.properties.HS,
                COLORS.snowheight
            );

            return L.marker(latlng, {
                icon: L.divIcon({
                    className: "aws-div-icon",
                    html: `<span style="background-color:${color}">${geoJsonPoint.properties.HS.toFixed(0)}</span>`
                })
            }).bindPopup(popup);
        }
    }).addTo(overlays.snowheight);
}

// Wind
let drawWind = function(geojson) {
    L.geoJSON(geojson, {
        filter: function(geoJsonPoint) {
            if (geoJsonPoint.properties.WG > 0 && geoJsonPoint.properties.WG < 300 && geoJsonPoint.properties.WR >=0 && geoJsonPoint.properties.WR <=360) {
                return true;
            }
        },
        pointToLayer: function(geoJsonPoint, latlng) {
            let popup = `
                ${geoJsonPoint.properties.name} (${geoJsonPoint.geometry.coordinates[2]}m)
            `;
            let color = getColor(
                geoJsonPoint.properties.WG,
                COLORS.wind
            );
            let deg = geoJsonPoint.properties.WR;
            //console.log(deg);

            return L.marker(latlng, {
                icon: L.divIcon({
                    className: "aws-div-icon",
                    html: `<span style="background-color:${color};transform: rotate(${deg}deg)"><i class="fa-solid fa-circle-arrow-up"></i> ${geoJsonPoint.properties.WG.toFixed(0)}</span>`
                })
            }).bindPopup(popup);
        }
    }).addTo(overlays.wind);
}

// Daten laden und Funktionen aufrufen
async function loadData(url) {
    let response = await fetch(url);
    let geojson = await response.json();

    drawStations(geojson);
    drawTemperature(geojson);
    drawSnowheight(geojson);
    drawWind(geojson);
}
loadData("https://static.avalanche.report/weather_stations/stations.geojson");