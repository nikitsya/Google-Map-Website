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
        mapTypeId: google.maps.MapTypeId.ROADMAP
    });

    const infoWindow = new google.maps.InfoWindow();
    const bounds = new google.maps.LatLngBounds();

    locations.forEach(location => {
        const position = new google.maps.LatLng(location[LATITUDE], location[LONGITUDE]);
        const marker = new google.maps.Marker({
            position: position,
            map: map
        });

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
}

window.loadMap = loadMap;
