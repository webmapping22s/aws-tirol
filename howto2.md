# Wetterstationen Tirol HOWTO (Teil 2) - Temperatur Layer erzeugen und weitere Layer

## 1. die Funktion drawTemperature() vorbereiten

Wir erstellen zuerst die Funktion `drawTemperature` als Kopie von `drawStations`. Einzige Änderung (neben dem Namen der Funktion) ist die letzte Zeile, bei der wir die Marker an `overlays.temperature` hängen.

```javascript
// Temperaturdaten
let drawTemperature = function(geojson) {
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
    }).addTo(overlays.temperature);
}
```

Damit der Layer gezeigt wird, müssen wir `drawTemperature(geojson)` in unserer `async function loadData(url)` noch aufrufen

```javascript
async function loadData(url) {
    let response = await fetch(url);
    let geojson = await response.json();

    drawStations(geojson);
    drawTemperature(geojson);
}
```

[🔗 COMMIT](https://github.com/webmapping/aws-tirol/commit/7b65281bffcbafb433ebe0f0ad6b3a58b9c99d8c)

Damit wir beim Entwickeln nur unseren Temperatur Layer sehen, zeigen wir ihn statt dem Stationslayer beim Laden an. Den Kommentar der dort steht änderen wird gleich mit.

```javascript
// diesen Layer beim Laden anzeigen
overlays.temperature.addTo(map);
```

[🔗 COMMIT](https://github.com/webmapping/aws-tirol/commit/7f08cead3d434958336e5f29849374e48a3ceeb8)

## 2. L.divIcon() für Marker mit Text verwenden

Den Code der Option `icon` ersetzen wir mit einem [L.divIcon()](https://leafletjs.com/reference.html#divicon), dessen Optionen-Objekt aus zwei Key/Value Paaren besteht:

* die Option [className](https://leafletjs.com/reference.html#divicon-classname) gibt jedem &lt;div> Element das wir als Icon erstellen ein Klassenattribut `class="aws-div-icon"` - wir können es dann zum Stylen der Texte verwenden

* die Option [html](https://leafletjs.com/reference.html#divicon-html) bestimmt den HTML-Markup, der angezeigt werden soll. Wir setzen ihn als &lt;span> Element mit Template Syntax und Backticks auf die Lufttemperatur im Attribut `geoJsonPoint.properties.LT`

```javascript
icon: L.divIcon({
    className: "aws-div-icon",
    html: `<span>${geoJsonPoint.properties.LT}</span>`
})
```

[🔗 COMMIT](https://github.com/webmapping/aws-tirol/commit/a734962082814af1b515972dda0f5cf69c4dd679)

## 3. Den Text Marker in main.css stylen

Über die Klasse `.aws-div-icon` können wir die Texte des &lt;span> Elements im Stylesheet `main.css` stylen:

```css
aws-div-icon span {
    font-size: 1.25em;
    font-weight: bold;
    padding: 0.3em;
    border: 1px solid silver;
    text-shadow:
        -1px -1px 0 white,
        -1px 1px 0 white,
        1px -1px 0 white,
        1px 1px 0 white
} 
```

[🔗 COMMIT](https://github.com/webmapping/aws-tirol/commit/814d396738c78d3df5430152c9d5b0f1291f28d7)

Die einzelnen CSS Regeln sind selbsterklärend, lediglich die `text-shadow` Anweisung ist für uns in dieser Form neu. Sie sorgt dafür, dass auf allen Seiten des Textes ein weißer Schatten entsteht, der den Text auch auf farbigem Hintergrund (wie wir ihn später implementieren werden) gut lesbar macht

Zwei Verbesserungen müssen wir in `main.js` noch implementieren. Vorallem die Stationen mit `undefined` bereiten uns Probleme, wir müssen sie daher beim Zeichnen ignorieren. Leaflet stellt uns dafür die GeoJSON Option [filter](https://leafletjs.com/reference.html#geojson-filter) zur Verfügung

### GeoJSON Objekte beim Zeichnen filtern

Genau wie `pointToLayer` ist [filter](https://leafletjs.com/reference.html#geojson-filter) eine Funktion, die für jeden Marker ausgeführt wird. Liefert sie `true` zurück, wird der Marker gezeichnet. In der Funktion können wir auf die Attribute unseres Markers zugreifen und so entscheiden, ob wir `true` zurückgeben möchten. Wir schreiben die Option oberhalb von `pointToLayer` und liefern `true` zurück, wenn die Temperatur zwischen -50° und +50° liegt:

```javascript
filter: function(geoJsonPoint) {
    if (geoJsonPoint.properties.LT > -50 && geoJsonPoint.properties.LT < 50) {
        return true;
    }
}
```

Neu bei dieser if-Abfrage ist die Verknüpfung zweier Bedingungen mit dem [Logical AND (&&)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Logical_AND) Operator

[🔗 COMMIT](https://github.com/webmapping/aws-tirol/commit/3e64c321f3af02d078383889b9f385e4b0261ce1)

Damit verschwinden Stationen ohne Temperatur und wir können die zweite Verbesserung angehen - die Zahl der Nachkommastellen mit der Javascript Methode [.toFixed](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toFixed) auf eine Nachkommastelle festlegen:

```javascript
html: `<span>${geoJsonPoint.properties.LT.toFixed(1)}</span>`
```

[🔗 COMMIT](https://github.com/webmapping/aws-tirol/commit/67c31ec41e90c641e8c7ff294db569e981b77cb2)

Dieser Schritt hätte ohne das Ausschließen von Stationen ohne Temperatur unser Skript gestoppt, denn der Versuch den Wert `undefined` auf eine Nachkommastelle zu formatieren wäre natürlich gescheitert.

## 4. Temperaturwerte in Farben umsetzen

### a) Farb-Objekt COLORS mit Schwellen und Farben

Zur Umsetzung der Temperaturwerte in Farben der Rechtecke, definieren wir zunächst in einer neuen Javascript-Datei `colors.js` ein `COLORS`-Objekt  mit Farbwerten und dazugehörigen min/max Schwellen. Visual Studio Code hilft uns beim Erstellen im &lt;head> Bereich von `index.html` mit dem Baustein `script:src` und `STRG-Klick` auf den generierten Link. Den Kommentar dort erweiteren wir entsprechend.

```html
<!-- eigene Stile, Farben und Hauptskript -->
<link rel="stylesheet" href="main.css">
<script src="colors.js"></script>
<script defer src="main.js"></script>
```

Die Farben mit Schwellen "leihen" wir uns von der [Temperaturkarte von Lawinen.report](https://lawinen.report/weather/map/temp). Mit *Rechtsklick / Untersuchen* bei den farbigen Legendenkästchen können wir die CSS Farbwerte der einzelnen Kästchen ablesen. Wir notieren sie als `color` mit `min`/`max` Schwellen in unserem `COLORS`-Objekt das a) eine Konstante ist, b) aus Objekten je nach Layern und c) darin aus einem Array von Objekten für die Definition besteht - so sieht es aus:

```javascript
const COLORS = {
    temperature: [{
        min: -50,
        max: -25,
        color: "#9f80ff"
    }, {
        min: -25,
        max: -20,
        color: "#784cff"
    }, {
        // und so weiter
    }

    ]
};
```

[🔗 COMMIT](https://github.com/webmapping/aws-tirol/commit/79368812d87b431810952fc57af3e0c7b0e3517e)

Das vorläufige Resultat ist in [colors.js](https://webmapping.github.io/aws-tirol/colors.js) sichtbar. Später werden wir auch noch Farbpaletten für die anderen Layer hinzufügen ...

### b) Funktion getColor(value, ramp) definieren

Nachdem wir den Task **eine Farbe für einen Wert nach Schwellen ermitteln** noch öfters brauchen werden, definieren wir eine Funktion `getColor`, die das für uns übernehmen wird. Sie erwartet beim Aufruf den Wert und die Farbpalette mit Schwellen, die in der Funktion dann als `value` und `ramp` verfügbar sind. In einer [for of](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...of) Schleife werden alle Einträge in `ramp` mit dem `value` verglichen und sobald der Wert in die Schwellen passt, die entsprechende Farbe zurückgegeben. Wir schreiben die Funktion  noch vor der Funktion für das Zeichnen der Stationen und testen sie mit einem Aufruf, dem wir den Wert -40 und die Farbpalette COLORS.temperature übergeben.

```javascript
// Farben nach Schwellen ermitteln
let getColor = function(value, ramp) {
    //console.log(value,ramp);
    for (let rule of ramp) {
        //console.log(rule)
        if (value >= rule.min && value < rule.max) {
            return rule.color;
        }
    }
};
console.log(getColor(-40, COLORS.temperature));
```

[🔗 COMMIT](https://github.com/webmapping/aws-tirol/commit/21cb1f76da9e062a256bc12210d5ceb1914ef197)

Wie erwartet, bekommen wir den Farbwert `#9f80ff` angezeigt. Er steht für Temperaturen zwischen -50°  und -25°.

### c) Die ermittelte Farbe als style-Attribut beim &lt;span> Element setzen

Jetzt müssen wir nur noch in `pointToLayer`, direkt nach `let popup`, die richtige Farbe für das `L.divIcon` ermitteln, in `let color` speichern.

```javascript
let color = getColor(
    geoJsonPoint.properties.LT,
    COLORS.temperature
);
```
[🔗 COMMIT](https://github.com/webmapping/aws-tirol/commit/9ab7176de1d81d52301fa72a30e60bbf0533ad86)

Danach können wir es als `style-Attribut` beim &lt;span> Element über die CSS Regel `background-color:${color}` einsetzen.

```javascript
icon: L.divIcon({
    className: "aws-div-icon",
    html: `<span style="background-color:${color}">${geoJsonPoint.properties.LT.toFixed(1)}</span>`
})
```

[🔗 COMMIT](https://github.com/webmapping/aws-tirol/commit/36d0c52bbe828da23dc337ac69875b904dd024d9)

### d) Leider ist die Position des Icons noch nicht ganz richtig :-(

... und wird es auch nicht hunderprozentig werden, denn die Positionierung von DIV-Icons ist nicht gerade einfach. Fügen wir vor dem `return` des DIV-Icons mit `L.marker(latlng).addTo(map)` einen zweiten Marker an der selben Position ein, erkennen wir, dass die Koordinate "ungefähr" links, oben beim Text liegt. Über einen Workaround im CSS von `main.css` verschieben wir deshalb die Icons nach links oben:

```css
.aws-div-icon span {
    /* bestehende CSS Regeln */
    display: inline-block;
    transform: translate(-30%, -50%);
}
```

[🔗 COMMIT](https://github.com/webmapping/aws-tirol/commit/f20d0fea0475c546d0008db47357b858d32e9ce8)

Das Verschieben der Marker bewirkt die CSS-Eigenschaft [transform](https://developer.mozilla.org/en-US/docs/Web/CSS/transform), deren `translate` Anweisung zwei Offsets in `x` und `y` Richtung erwartet. Warum wir beim Verschieben `-30%` für die x-Richtung verwenden müssen bleibt allerdings ein Rätsel. Immerhin liegt der Textmarker jetzt mit seinem Zentrum an der annähernd richtigen Position.

**Hinweis**: mit [transform](https://developer.mozilla.org/en-US/docs/Web/CSS/transform) und der `rotate` Anweisung könn(t)en wir die Marker auch drehen ...

## 5. Weitere Layer implementieren

### a) Schneehöhen

* Funktion `drawSnowheight()`

* Overlay `snowheight`

* Attribut **HS**

* Farben <https://lawinen.report/weather/map/snow-height>


[🔗 COMMIT Farbpalette](https://github.com/webmapping/aws-tirol/commit/e39090774dfbaa0088012d029ef50fac4ec9e014)
[🔗 COMMIT Farbpalette Korrektur](https://github.com/webmapping/aws-tirol/commit/bedbeff37c1b3f90378ea67b22dfb70414da27de)
[🔗 COMMIT Implementierung](https://github.com/webmapping/aws-tirol/commit/a9338c514889e0a6dffda7f9e0e611902d2382b3)

### b) Windstärke

* Funktion `drawWind()`

* Overlay `wind`

* Attribut: **WG**

* Farben für Windstärke <https://lawinen.report/weather/map/wind>

    [🔗 COMMIT Farbpalette](https://github.com/webmapping/aws-tirol/commit/cadfb223059f3383c30b11e032a40192e1c120e1)
    [🔗 COMMIT Implementierung](https://github.com/webmapping/aws-tirol/commit/1202ec45e84706da03023703518de82288095d72)

* Ergänzung Windrichtung als gedrehtes Font Awesome Icon

    * Attribut: **WR**

    [🔗 COMMIT Implementierung](https://github.com/webmapping/aws-tirol/commit/48f777059cbec2a732969ca041d2a37e33eed4b9)
