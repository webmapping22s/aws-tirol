# Wetterstationen Tirol HOWTO (Teil 3) - Layer Schneehöhen, Relative Luftfeuchtigkeit & Windstärke

### a) Schneehöhen

* Funktion `drawSnowheight()`

* Overlay `snowheight`

* Attribut **HS**

* Farben <https://lawinen.report/weather/map/snow-height>


[🔗 COMMIT Farbpalette](https://github.com/webmapping22s/aws-tirol/commit/e39090774dfbaa0088012d029ef50fac4ec9e014)
[🔗 COMMIT Farbpalette Korrektur](https://github.com/webmapping22s/aws-tirol/commit/bedbeff37c1b3f90378ea67b22dfb70414da27de)
[🔗 COMMIT Implementierung](https://github.com/webmapping22s/aws-tirol/commit/a9338c514889e0a6dffda7f9e0e611902d2382b3)

### b) Relative Luftfeuchtigkeit

* Umbenennen `precipitation` / Niederschlag in `humidity` / Relative Luftfeuchtigkeit

    [🔗 COMMIT](https://github.com/webmapping22s/aws-tirol/commit/138f04f37e08afda04a247aa08bcb69034666a63)

* Farbpalette `colors.js` ergänzen

    * vorher *F1 + beautify file*

        [🔗 COMMIT](https://github.com/webmapping22s/aws-tirol/commit/4dd3aea6c1742f7d34316715084c227a6f32492f)
    
    * dann die Farbpalette ergänzen. Passende Farben und Schwellen zur Erweiterung von <https://webmapping22s.github.io/aws-tirol/colors.js> um eine Farbpalette `COLORS.humidity` finden sich bei [wetteronline.de](https://www.wetteronline.de/?gid=10093&metparaid=RH&pcid=pc_aktuell_local&pid=p_aktuell_local&sid=ColorMap), genauer gesagt in der [SVG-Grafik der Legende](https://st.wetteronline.de/mdr/p_aktuell_local/1.0.159/images/symbology/www/ic_Humidity_390x76.svg), die man auf der Wetterkarte rechts oben eingebettet seht.

        [🔗 COMMIT](https://github.com/webmapping22s/aws-tirol/commit/77a13d2656b4b6d19e648b75299b268fbc41ee4c)

* Layer Relative Luftfeuchtigkeit implementieren

    * zuerst eine eins zu eins Kopie von `drawTemperature`

    * dann Funktionsname in `drawHumidity` ändern

    * Attribut **RH** verwenden und beim Labeltext auf 0 Nachkommastellen runden

    * aus `loadData` aufrufen

    [🔗 COMMIT](https://github.com/webmapping22s/aws-tirol/commit/c1ba1eee3c5080bf198da03defc70b40b80fbd87)


### c) Windstärke

* Funktion `drawWind()`

* Overlay `wind`

* Attribut: **WG**

* Farben für Windstärke <https://lawinen.report/weather/map/wind>

    [🔗 COMMIT Farbpalette](https://github.com/webmapping22s/aws-tirol/commit/cadfb223059f3383c30b11e032a40192e1c120e1)
    [🔗 COMMIT Implementierung](https://github.com/webmapping22s/aws-tirol/commit/1202ec45e84706da03023703518de82288095d72)

* Ergänzung Windrichtung als gedrehtes Font Awesome Icon

    * Attribut: **WR**

    [🔗 COMMIT Implementierung](https://github.com/webmapping22s/aws-tirol/commit/48f777059cbec2a732969ca041d2a37e33eed4b9)

**Leider** sieht der Layer mit den gedrehten Icons und dem Text nicht wirklich gut aus, wir verabschieden uns also von der Direktanzeige der Windgeschwindigkeit und stylen die Pfeile über ein eigenes CSS-Format `.aws-div-icon-wind span` neu.

* CSS-Format `.aws-div-icon-wind span` in `main.css` definieren und beim `L.divIcon` verwenden

    ```css
    .aws-div-icon-wind span {
        font-size: 3em;
        font-weight: bold;
        padding: 0.3em;
        text-shadow:
            -1px -1px 0 black,
            -1px 1px 0 black,
            1px -1px 0 black,
            1px 1px 0 black;
        display: inline-block;
        transform: translate(-30%, -50%);
    }
    ```

    * `font-size` auf `3em` vergrößern
    * Umrandung `border` löschen
    * `text-shadow` in Schwarz statt Weiß

    ```js
    icon: L.divIcon({
        className: "aws-div-icon-wind",
        // ....
    })
    ```

    [🔗 COMMIT](https://github.com/webmapping22s/aws-tirol/commit/666bf43459f9edbbd94116977257fbf5a62d144b)

* Beschriftung der Windstärke in das Popup verschieben und dabei *m/s* in *km/h* umwandeln

    Den Text mit der Windgeschwindigkeit im &lt;span> Element des `L.divIcon()` löschen wir und fügen ihn beim Popup hinzu

    ```js
    let popup = `
        ${geoJsonPoint.properties.name} (${geoJsonPoint.geometry.coordinates[2]}m)
        <hr>
        Windgeschwindigkeit: ${(geoJsonPoint.properties.WG * 3.6).toFixed(0)} km/h
    `;
    ```

    [🔗 COMMIT](https://github.com/webmapping22s/aws-tirol/commit/1c6fed894655e704e57b958d0d83bf01731796ea)

* Die Icon-Farbe über `color` statt `background-color` setzen

    ```js
    icon: L.divIcon({
        className: "aws-div-icon-wind",
        html: `<span style="color:${color};transform: rotate(${deg}deg)"><i class="fa-solid fa-circle-arrow-up"></i></span>`
    })
    ```

    [🔗 COMMIT](https://github.com/webmapping22s/aws-tirol/commit/649d8c20676a6309d42b7987b501f6e4a6b74b0c)

* Last but not least: **der Wind weht aus der falschen Richtung** - Windrichtung 0° ist Wind von Norden, deshalb muss unser Font Awesome Icon standard mäßig ein Pfeil nach unten sein

    ```js
    html: `<span style="color:${color};transform: rotate(${deg}deg)"><i class="fa-solid fa-circle-arrow-down"></i></span>`
    ```

    [🔗 COMMIT](https://github.com/webmapping22s/aws-tirol/commit/c5878b16c1ecc8acf01edeb97564e0cef1436e19)

    **Leider** ist die Position der Icon jetzt falsch, denn das `style`-Attribut `transform` zum Rotieren überschreibt die Verschiebung des Icons an die "ungefähr" richtige Position. Wir müssen also `translate(-30%, -50%);` beim `style`-Attribut ergänzen und können es im CSS löschen

    ```js
    html: `<span style="color:${color};transform: translate(-30%, -50%) rotate(${deg}deg)"><i class="fa-solid fa-circle-arrow-down"></i></span>`
     ```

    [🔗 COMMIT](https://github.com/webmapping22s/aws-tirol/commit/0d76c40de33ed474b69f1ec2da5d872e56223783)