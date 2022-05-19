# Wetterstationen Tirol HOWTO (Teil 1) - Basiskarte mit Stationen

## 1. Das Template auspacken

[🔗 COMMIT](https://github.com/webmapping/aws-tirol/commit/2e036a4a5356a9b7b85c264cd70fda5644a91cd0)

### a) HTML Seite index.html

Die `index.html` Datei des Templates ist eine Kopie des Templates des Wien Beispiels mit einigen wenigen Änderungen:

* als *favicon* für den Browser dient das Icon, das wir später für die Stationen verwenden werden, es liegt unter [icons/wifi.png](https://webmapping.github.io/aws-tirol/icons/wifi.png).

* im &lt;head>-Bereich sind Leaflet und die Leaflet Plugins [Leaflet providers](https://github.com/leaflet-extras/leaflet-providers) sowie [Leaflet fullscreen](https://github.com/Leaflet/Leaflet.fullscreen) eingebaut.

* statt dem Wiener Wappen kommt das Font Awesome Icon [fa-solid fa-cloud-sun-rain](https://fontawesome.com/search?q=sun%20rain&s=solid%2Cbrands) direkt beim Titel zum Einsatz, der *Flexbereich* im Header besteht deshalb nur noch aus dem Titel links und dem Link zum Github Repo rechts.

* im Footerbereich finden wir einen Link zur Webseite [Lawinen.report](https://lawinen.report/) von der wir den Kartenhintergrund, die Stationsdaten und später auch die Farben für die thematische Darstellung verwenden werden. Ein weiterer Link führt zu den Metadaten der Stationen, die bei *data.gv.at* unter [Wetterstationsdaten Tirol](https://www.data.gv.at/katalog/dataset/bb43170b-30fb-48aa-893f-51c60d27056f) liegen. Das JSON File dort, können wir leider nicht direkt verwenden, deshalb kommt der Datensatz von [Lawinen.report](https://lawinen.report/) zum Einsatz. Mehr dazu später.

### b) Kartenskript main.js

Im Kartenskript wird die Karte mit Innsbruck als Zentrum im Zoomlevel 11 initialisiert. Maßstab und Fullscreen control sind gleich wie beim Wienbeispiel. Auf die Minimap verzichten wir. Ganz anders, als im Wienbeispiel, ist der Code für die Thematischen Overlays und der Code für die Kartenhintergründe, denn wir verwenden diesmal nicht nur Layer des Leaflet Providers Plugins, sondern auch einen Tilelayer der Webseite [Lawinen.report](https://lawinen.report/). Beide Features sehen wir uns jetzt noch genauer an.

## 2. WMTS Kartenhintergrund von Lawinen.report

Ein Blick auf das rechte untere Eck der Grundkarte von [Lawinen.report](https://lawinen.report/) zeigt, dass der Hintergrundlayer mit der [Creative Commons Lizenz CC BY](https://creativecommons.org/licenses/?lang=de) versehen ist. Inhalte mit dieser Lizenz dürfen wir in allen Projekten, egal ob privat oder kommerziell, verwenden, solange wir die Quelle nennen.

Es lohnt sich also einen Blick in die Seiteniformationen des Browsers unter *Extras / Seiteninformation* oder *STRG+I* zu werfen. Im Tab Medien finden wir die WMTS Kacheln im Format [Webp](https://de.wikipedia.org/wiki/WebP). Am Beispiel der Kachel mit Innsbruck und Kufstein können wir das Pattern für unseren [L.tileLayer](https://leafletjs.com/reference.html#tilelayer) Aufruf leicht ableiten:

Wir interpretieren

`https://static.avalanche.report/tms/8/136/89.webp`

Als URL-Pattern 

`https://static.avalanche.report/tms/{z}/{x}/{y}{r}.webp`

Unser `startLayer` lässt sich damit so definieren

```javascript
let startLayer = L.tileLayer("https://static.avalanche.report/tms/{z}/{x}/{y}.webp", {
    attribution: '&copy; <a href="https://lawinen.report">Lawinen.report</a>'
})
```

Wie in der Lizenz gefordert nennen wir in der `attribution` [Lawinen.report](https://lawinen.report/) als Quelle

Als zweiten Hintergrundlayer definieren wir `Esri.WorldImagery` vom Leaflet Providers Plugin und können die Layer control hinzufügen.

```javascript
let layerControl = L.control.layers({
    "Relief avalanche.report": startLayer,
    "Esri World Imagery": L.tileLayer.provider("Esri.WorldImagery"),
}
```

## 3. Overlays als Objekte vordefinieren

Ein Blick auf die Dokumentation von [L.control.layers](https://leafletjs.com/reference.html#control-layers) zeigt, dass wir als zweites Argument auch noch Overlays direkt angeben können. Dieses Feature machen wir uns zu Nütze um alle zukünftigen thematischen Overlays schon gleich beim Initialisieren der Layer control hinzuzufügen.

Dazu müssen wir uns zuerst ein Layer-Objekt basteln das so aussieht:

```javascript
let overlays = {
    stations: L.featureGroup(),
    temperature: L.featureGroup(),
    precipitation: L.featureGroup(),
    snowheight: L.featureGroup(),
    wind: L.featureGroup(),
};
```

Die Keys des Objekts verwenden wir später beim Hinzufügen der jeweiligen Marker, die Values sind [L.featureGroup()](https://leafletjs.com/reference.html#featuregroup) Objekte.

Zugreifen können wir auf die Overlays am Beispiel der Stationen mit `overlays.stations` und wir tun das gleich, indem wir die Stationen beim Laden schon anzeigen

```javascript
overlays.stations.addTo(map);
```

**Hinweis**: der Vorteil, Overlays zuerst als Objekt zu definieren und dann direkt beim Erzeugen der Layercontrol zu verwenden liegt darin, dass wir die Reihenfolge in der Layer control vorgeben können. Beim Wienbeispiel war das nicht der Fall und je nach Dauer der Ausführung unserer `async`-Funktionen sind die Einträge unterschiedlich sortiert angekommen.

## 4. GeoJSON Daten laden

Für die Visualisierung verwenden wir GeoJSON Daten von [Lawinen.report](https://lawinen.report/) unter der Adresse <https://static.avalanche.report/weather_stations/stations.geojson>, denn die beinhalten nicht nur Tiroler Stationen, sondern auch Stationen in Südtirol und dem Trentino. Die Metadaten dazu finden wir bei den Tiroler Daten auf *data.gv.at* unter [Wetterstationen Tirols](https://www.data.gv.at/katalog/dataset/bb43170b-30fb-48aa-893f-51c60d27056f).

### Sidestep: cross-origin

Auch bei *data.gv.at* ist eine JSON-Datei unter der Adresse <https://lawine.tirol.gv.at/data/produkte/ogd.geojson> verfügbar, die könnten wir allerdings gar nicht direkt verwenden, denn der Server *lawine.tirol.gv.at* erlaubt das nicht. Wir probieren es aus und verwenden den Tiroler Datensatz beim Aufruf von `loadData()`

```javascript
loadData("https://lawine.tirol.gv.at/data/produkte/ogd.geojson");
```

Die negative Antwort vom Server sehen wir in der Konsole:

*Quellübergreifende (Cross-Origin) Anfrage blockiert: Die Gleiche-Quelle-Regel verbietet das Lesen der externen Ressource auf <https://lawine.tirol.gv.at/data/produkte/ogd.geojson>.*

Die meisten Webserver sind so konfiguriert, dass sie direkte Datennutzung nur dann zulassen, wenn das ausführende Skript auch am selben Server läuft. Unsere Beispiele laufen entweder lokal unter `http://127.0.0.1:5500/` oder im Web unter z.B. `https://webmapping.github.io/aws-tirol`. Beides lässt der Server *lawine.tirol.gv.at* nicht zu und verweigert die Auslieferung der GeoJSON-Daten. 

Im Gegensatz dazu ist der Server `https://data.wien.gv.at` bei den Wiener Daten oder der Server `https://static.avalanche.report` von [Lawinen.report](https://lawinen.report/) großzügiger und erlaubt das direkte Einbinden der GeoJSON-Dateien.

**Hinweis**: solltet ihr bei euren Projekten Daten verwenden, die nicht *Cross-Origin* fähig sind, wird euch nichts anderes übrig bleiben, als eine lokale Kopie der Daten zu speichern und diese dann im Skript zu verwenden.

Wer noch mehr über das Thema *Cross Origin* wissen will, wird bei den [MDN webdocs unter CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) fündig

## 5. Stationslayer mit Icons und Popups implementieren

Der Code für den Stationslayer mit Icons und Popups ist eigentlich eine Kopie des Codes für die Sehenswürdigkeiten im Wienbeispiel mit drei kleinen Anpassung:

```javascript
// Wetterstationen mit Icons und Popups implementieren
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
```

* als Icon verwenden wir das [Wifi Icon](https://mapicons.mapsmarker.com/markers/restaurants-bars/wi-fi/?custom_color=3d9970) der Map Icons collection in der Farbe *OLIVE (#3D9970)* von <http://clrs.cc/>

* die Seehöhe finden wir im Array `geoJsonPoint.geometry.coordinates` als dritten Eintrag, also mit dem Index `[2]`

* die Marker hängen wir an unser vordefiniertes Overlay in `overlays.stations`

[🔗 COMMIT](https://github.com/webmapping/aws-tirol/commit/390d6f905c0be8d36655c1b9bfc1fc61df4f86f8)

Damit ist die Grundkarte fertig und wir könnten uns an das Implementieren der thematischen Layer machen.

## 6. Code für den Stationslayer in eine eigene Funktion auslagern

Doch bevor wir das tun ändern wir noch einmal die Struktur unseres Codes und lagern die Funktionalität zum Zeichnen der Stationsmarker in eine eigene Funktion `drawStations` aus. Aufgerufen wird sie, sobald die Daten in der Variablen `geojson` verfügbar sind und beim Aufruf übergeben wir diese GeoJSON-Daten gleich mit. So sieht die Funktion `drawStations` aus:

```javascript
// Wetterstationen mit Icons und Popups implementieren
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
```

Und so wird sie aus `loadData` heraus aufgerufen - wir ändern auch gleich noch den Kommentar vor der `async` Funktion

```javascript
// Daten laden und Funktionen aufrufen
async function loadData(url) {
    let response = await fetch(url);
    let geojson = await response.json();

    drawStations(geojson);
}
loadData("https://static.avalanche.report/weather_stations/stations.geojson");
```

[🔗 COMMIT](https://github.com/webmapping/aws-tirol/commit/)

Im Gegensatz zum Wienbeispiel laden wir hier nur einen einzigen Datensatz und verwenden dessen Inhalt zum Zeichnen der verschiedenen Layer. Das Auslagern des Codes in einzelne Funktionen macht deshalb Sinn und unseren Code wird sehr übersichtlich.
