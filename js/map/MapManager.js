const CONTENT = 0
const LATITUDE = 1
const LONGITUDE = 2

const STADIUM_MARKER_ICON = "images/markers/stadium.png"
const STADIUM_MARKER_SIZE = 42

export class MapManager {

    constructor(mapElementId, locations, stadiums) {
        this.mapElementId = mapElementId
        this.locations = locations
        this.stadiums = stadiums
        this.map = null
        this.infoWindow = null
        this.bounds = null
        this.markers = []
        this.stadiumMarkers = []
    }

    init() {
        if (!window.google || !window.google.maps) {
            return
        }

        this.map = new google.maps.Map(document.getElementById(this.mapElementId), {
            center: new google.maps.LatLng(this.locations[0][LATITUDE], this.locations[0][LONGITUDE]),
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            mapTypeControl: false
        })

        this.infoWindow = new google.maps.InfoWindow()
        this.bounds = new google.maps.LatLngBounds()

        this.renderMarkers()
        this.renderStadiumMarkers()
        this.showAllCities()
    }

    renderMarkers() {
        this.locations.forEach(location => {
            const position = new google.maps.LatLng(location[LATITUDE], location[LONGITUDE])
            const marker = new google.maps.Marker({
                position: position,
                map: this.map
            })

            this.markers.push(marker)
            this.bounds.extend(position)

            marker.addListener("click", () => {
                this.infoWindow.setContent(location[CONTENT])
                this.infoWindow.open({
                    anchor: marker,
                    map: this.map
                })
            })
        })
    }

    renderStadiumMarkers() {
        this.stadiums.forEach(stadium => {
            const position = new google.maps.LatLng(stadium.latitude, stadium.longitude)
            const marker = new google.maps.Marker({
                icon: {
                    url: STADIUM_MARKER_ICON,
                    scaledSize: new google.maps.Size(STADIUM_MARKER_SIZE, STADIUM_MARKER_SIZE)
                },
                map: this.map,
                position: position,
                title: stadium.name
            })

            this.stadiumMarkers.push(marker)
            this.bounds.extend(position)

            marker.addListener("click", () => {
                this.infoWindow.setContent(stadium.content)
                this.infoWindow.open({
                    anchor: marker,
                    map: this.map
                })
            })
        })
    }

    showAllCities() {
        this.map.fitBounds(this.bounds)
    }

    focusOnCity(index) {
        const selectedLocation = this.locations[index]
        const selectedMarker = this.markers[index]

        if (!selectedLocation || !selectedMarker) {
            return
        }

        this.map.setCenter(new google.maps.LatLng(
            selectedLocation[LATITUDE],
            selectedLocation[LONGITUDE]
        ))
        this.map.setZoom(11)
        this.infoWindow.setContent(selectedLocation[CONTENT])
        this.infoWindow.open({
            anchor: selectedMarker,
            map: this.map
        })
    }
}
