const CONTENT = 0;
const LATITUDE = 1;
const LONGITUDE = 2;

const locations = [
    ["Busáras", 53.35012709, -6.25222818],
    ["Dundalk", 54.00428271, -6.40210535],
    ["Blackrock", 53.96251869, -6.36627104]
];

function loadMap() {
    if (!window.google || !window.google.maps) {
        return;
    }

    const firstLocation = locations[0];
    const map = new google.maps.Map(document.getElementById("map"), {
        zoom: 4,
        center: new google.maps.LatLng(firstLocation[LATITUDE], firstLocation[LONGITUDE]),
        mapTypeId: google.maps.MapTypeId.ROADMAP
    });

    const infoWindow = new google.maps.InfoWindow();

    locations.forEach(location => {
        const marker = new google.maps.Marker({
            position: new google.maps.LatLng(location[LATITUDE], location[LONGITUDE]),
            map: map
        });

        marker.addListener("click", () => {
            infoWindow.setContent(location[CONTENT]);
            infoWindow.open({
                anchor: marker,
                map
            });
        });
    });
}

window.loadMap = loadMap;
