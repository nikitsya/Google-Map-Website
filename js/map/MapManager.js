const CONTENT = 0;
const LATITUDE = 1;
const LONGITUDE = 2;

export class MapManager {

    constructor(mapElementId, locations) {
        this.mapElementId = mapElementId;
        this.locations = locations;
        this.map = null;
        this.infoWindow = null;
        this.bounds = null;
        this.markers = [];
    }

    init() {
        if (!window.google || !window.google.maps) {
            return;
        }

        this.map = new google.maps.Map(document.getElementById(this.mapElementId), {
            center: new google.maps.LatLng(this.locations[0][LATITUDE], this.locations[0][LONGITUDE]),
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            mapTypeControl: false
        });

        this.infoWindow = new google.maps.InfoWindow();
        this.bounds = new google.maps.LatLngBounds();

        this.renderMarkers();
        this.showAllCities();
    }

    renderMarkers() {
        this.locations.forEach(location => {
            const position = new google.maps.LatLng(location[LATITUDE], location[LONGITUDE]);
            const marker = new google.maps.Marker({
                position: position,
                map: this.map
            });

            this.markers.push(marker);
            this.bounds.extend(position);

            marker.addListener("click", () => {
                this.infoWindow.setContent(location[CONTENT]);
                this.infoWindow.open({
                    anchor: marker,
                    map: this.map
                });
            });
        });
    }

    showAllCities() {
        this.map.fitBounds(this.bounds);
    }

    focusOnCity(index) {
        const selectedLocation = this.locations[index];
        const selectedMarker = this.markers[index];

        if (!selectedLocation || !selectedMarker) {
            return;
        }

        this.map.setCenter(new google.maps.LatLng(
            selectedLocation[LATITUDE],
            selectedLocation[LONGITUDE]
        ));
        this.map.setZoom(11);
        this.infoWindow.setContent(selectedLocation[CONTENT]);
        this.infoWindow.open({
            anchor: selectedMarker,
            map: this.map
        });
    }
}
