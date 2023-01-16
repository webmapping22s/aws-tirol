# Wetterstationen Tirol HOWTO (Teil 4) - Leaflet.Rainviewer

Die Homepage des [Leaflet.Rainviewer Plugins](https://github.com/mwasil/Leaflet.Rainviewer) von Marcin Wasilewski finden wir bei der [Pluginseite von Leaflet](https://leafletjs.com/plugins.html) 

Dort angekommen sehen wir unter [Installation](https://github.com/mwasil/Leaflet.Rainviewer#installation), dass wir ein Stylesheet und ein Javascript in `index.html` einbinden müssen

```html
<!-- Leaflet Rainviewer -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/mwasil/Leaflet.Rainviewer/leaflet.rainviewer.css"/>
<script src="https://cdn.jsdelivr.net/gh/mwasil/Leaflet.Rainviewer/leaflet.rainviewer.js"></script>
```

[🔗 COMMIT](https://github.com/webmapping22s/aws-tirol/commit/e87015b00212802570c1b1005a3197f46b33d832)

Dann müssen wir nur noch in `main.js` das Plugin am Ende des Skripts aktivieren - wir kopieren einfach den Code bei [*Setup*](https://github.com/mwasil/Leaflet.Rainviewer#setup)

```javascript
L.control.rainviewer({ 
    position: 'bottomleft',
    nextButtonText: '>',
    playStopButtonText: 'Play/Stop',
    prevButtonText: '<',
    positionSliderLabelText: "Hour:",
    opacitySliderLabelText: "Opacity:",
    animationInterval: 500,
    opacity: 0.5
}).addTo(map);
```

[🔗 COMMIT](https://github.com/webmapping22s/aws-tirol/commit/e2ce3771746a64a9fe10e158a1428288d1f914c3)
