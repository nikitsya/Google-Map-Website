const CONTENT = 0;
const LATITUDE = 1;
const LONGITUDE = 2;

const locations = [
    ["Mexico City", 19.4326, -99.1332],
    ["Guadalajara", 20.6597, -103.3496],
    ["Monterrey", 25.6866, -100.3161]
];

function loadMap() {
    if (!window.google || !window.google.maps) {
        return;
    }

    const map = new google.maps.Map(document.getElementById("map"), {
        center: new google.maps.LatLng(locations[0][LATITUDE], locations[0][LONGITUDE]),
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        mapTypeControl: false
    });

    const infoWindow = new google.maps.InfoWindow();
    const bounds = new google.maps.LatLngBounds();
    const cityButtons = document.querySelectorAll("[data-city-button]");
    const cityMarkers = [];

    locations.forEach(location => {
        const position = new google.maps.LatLng(location[LATITUDE], location[LONGITUDE]);
        const marker = new google.maps.Marker({
            position: position,
            map: map
        });

        cityMarkers.push(marker);
        bounds.extend(position);

        marker.addListener("click", () => {
            infoWindow.setContent(location[CONTENT]);
            infoWindow.open({
                anchor: marker,
                map
            });
        });
    });

    map.fitBounds(bounds);

    cityButtons.forEach(button => {
        button.addEventListener("click", () => {
            const cityIndex = Number(button.getAttribute("data-city-button"));
            const selectedLocation = locations[cityIndex];
            const selectedMarker = cityMarkers[cityIndex];

            if (!selectedLocation || !selectedMarker) {
                return;
            }

            cityButtons.forEach(cityButton => {
                cityButton.removeAttribute("data-active");
            });

            button.setAttribute("data-active", "true");
            map.setCenter(new google.maps.LatLng(selectedLocation[LATITUDE], selectedLocation[LONGITUDE]));
            map.setZoom(11);
            infoWindow.setContent(selectedLocation[CONTENT]);
            infoWindow.open({
                anchor: selectedMarker,
                map
            });
        });
    });
}

window.loadMap = loadMap;
