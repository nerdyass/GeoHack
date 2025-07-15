// ==UserScript==
// @name         <whatever you want>
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  <made by nerdyass, add whatever you want here>
// @author       <ur name ig cus ur a skid>
// @match        https://www.geoguessr.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=geoguessr.com
// @grant        GM_webRequest
// ==/UserScript==

let gC = {
    lat: 0,
    lng: 0,
    address: ''
};

let GPID = undefined;
let isVisible = true; 

function createOrUpdateCoordsBox(lat, lng, address) {
    //just styling from here using basic HTML:CSS (Appending to document cus its cleaner)
    let coordsBox = document.getElementById('coordsBox');
    if (!coordsBox) {
        coordsBox = document.createElement('div');
        coordsBox.id = 'coordsBox';
        coordsBox.style.position = 'fixed';
        coordsBox.style.top = '100px';  
        coordsBox.style.left = '100px';  
        coordsBox.style.padding = '20px';
        coordsBox.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        coordsBox.style.color = 'white';
        coordsBox.style.fontWeight = 'bold';
        coordsBox.style.zIndex = '10000';
        coordsBox.style.cursor = 'move'; 
        coordsBox.style.textAlign = 'left';
        coordsBox.style.fontFamily = 'Arial, sans-serif';
        coordsBox.style.boxSizing = 'border-box'; 
        coordsBox.style.border = '2px solid #39ff14';
        coordsBox.style.borderRadius = '5px';
        coordsBox.style.boxSizing = 'border-box';

        let logo = document.createElement('div');
        logo.id = 'logo';
        logo.innerText = 'Myau Client'; //add whatever the fuck you want here, just changes logo
        logo.style.fontSize = '24px';
        logo.style.fontWeight = 'bold';
        logo.style.color = '#39ff14';
        logo.style.textShadow = '0 0 10px #39ff14, 0 0 20px #39ff14, 0 0 30px #39ff14, 0 0 40px #39ff14, 0 0 70px #39ff14';
        coordsBox.appendChild(logo);

        let addressDisplay = document.createElement('div');
        addressDisplay.id = 'addressDisplay';
        addressDisplay.style.marginTop = '10px';
        addressDisplay.style.fontSize = '18px';
        addressDisplay.style.color = '#ffffff';
        addressDisplay.style.textShadow = '0 0 10px #39ff14';
        coordsBox.appendChild(addressDisplay);

        let coordsDisplay = document.createElement('div');
        coordsDisplay.style.textShadow = '0 0 10px #39ff14';
        coordsDisplay.id = 'coordsDisplay';
        coordsBox.appendChild(coordsDisplay);

        let mapDisplay = document.createElement('div');
        mapDisplay.id = 'mapDisplay';
        mapDisplay.style.marginTop = '10px';
        mapDisplay.style.width = '100%';
        mapDisplay.style.height = '600px';
        mapDisplay.style.border = '2px solid #39ff14';
        mapDisplay.style.borderRadius = '5px';
        mapDisplay.style.boxSizing = 'border-box';
        coordsBox.appendChild(mapDisplay);

        let footer = document.createElement('div');
        footer.id = 'footer';
        footer.style.fontWeight = 'bold';
        footer.innerText = 'nerdyass industries, 2024. v.1.3';
        footer.style.marginTop = '10px';
        footer.style.fontSize = '12px';
        footer.style.color = '#888';
        footer.style.textAlign = 'left';
        coordsBox.appendChild(footer);

        coordsBox.onmousedown = dragMouseDown;

        document.body.appendChild(coordsBox);
    }

    //just basic update refresh (used by most scripts for geoguesser)
    let addressDisplay = document.getElementById('addressDisplay');
    addressDisplay.innerHTML = `Address: ${address}`;

    let coordsDisplay = document.getElementById('coordsDisplay');
    coordsDisplay.innerHTML = `Full Set: ${lat.toFixed(6)} , ${lng.toFixed(6)}<br>Latitude: ${lat.toFixed(6)}<br>Longitude: ${lng.toFixed(6)}`;

    //grab the map embed
    let mapDisplay = document.getElementById('mapDisplay');
    let zoomLevel = 2;
    let mapUrl = `https://maps.google.com/maps?q=${lat},${lng}&z=${zoomLevel}&output=embed`;
    mapDisplay.innerHTML = `<iframe width="100%" height="100%" frameborder="0" style="border:0" src="${mapUrl}" allowfullscreen></iframe>`;
}

let offsetX = 0, offsetY = 0, mouseX = 0, mouseY = 0;

function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();

    mouseX = e.clientX;
    mouseY = e.clientY;

    let coordsBox = document.getElementById('coordsBox');
    offsetX = mouseX - coordsBox.offsetLeft;
    offsetY = mouseY - coordsBox.offsetTop;

    document.onmousemove = elementDrag;
    document.onmouseup = closeDragElement;
}

function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();

    mouseX = e.clientX;
    mouseY = e.clientY;

    let coordsBox = document.getElementById('coordsBox');
    coordsBox.style.left = (mouseX - offsetX) + "px";
    coordsBox.style.top = (mouseY - offsetY) + "px";
}

function closeDragElement() {
    document.onmouseup = null;
    document.onmousemove = null;
}

// change vis key (must enter for both fields)
document.addEventListener('keydown', function(e) {
    if (e.key === 't' || e.key === 'T') {
        let coordsBox = document.getElementById('coordsBox');
        if (coordsBox) {
            isVisible = !isVisible;
            coordsBox.style.display = isVisible ? 'block' : 'none';
        }
    }
});

/* thanks to this older cheat: https://greasyfork.org/en/scripts/450253-geoguessr-location-resolver-works-in-all-modes for providing the XML clientside intercept function.
If you'd like to learn more about it, his github has a whole writeup about cheating in geoguesser & was a large resource in producing this! */

var originalOpen = XMLHttpRequest.prototype.open;

XMLHttpRequest.prototype.open = function(method, url) {
    if (method.toUpperCase() === 'POST' &&
    (url.startsWith('https://maps.googleapis.com/$rpc/google.internal.maps.mapsjs.v1.MapsJsInternalService/GetMetadata') ||
    url.startsWith('https://maps.googleapis.com/$rpc/google.internal.maps.mapsjs.v1.MapsJsInternalService/SingleImageSearch'))) {

        this.addEventListener('load', function() {
            let iR = this.responseText;

            //regex extractor (COORDS)
            const coordPattern = /-?\d+\.\d+,-?\d+\.\d+/g;
            let match = iR.match(coordPattern)[0];
            let split = match.split(",");

            let lat = Number.parseFloat(split[0]);
            let lng = Number.parseFloat(split[1]);

            gC.lat = lat;
            gC.lng = lng;

            //regex extractor (ADDY) - note: wont always work, as you aren't always at an addy
            const addressPattern = /\[\["([^"]+)",\s*"en"\],\s*\["([^"]+)",\s*"en"\]\]/;
            let addressMatch = iR.match(addressPattern);
            let address = addressMatch ? `${addressMatch[1]}, ${addressMatch[2]}` : 'Address not found';

            gC.address = address;

            //update (BUMP!)
            createOrUpdateCoordsBox(lat, lng, address);

        });
    }
    return originalOpen.apply(this, arguments);
};
