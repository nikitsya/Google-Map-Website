const MARKER_SIZE = 42

const STADIUM_MARKER_ICON = "images/markers/stadium.png"
const HOTEL_MARKER_ICON = "images/markers/hotel.png"
const CAFE_MARKER_ICON = "images/markers/caffe.png"

export class MapManager {

    constructor(mapElementId, stadiums, hotelSearches, cafeSearches) {
        this.mapElementId = mapElementId
        this.stadiums = stadiums
        this.hotelSearches = hotelSearches
        this.cafeSearches = cafeSearches

        this.map = null
        this.placesService = null
        this.infoWindow = null
        this.bounds = null

        this.stadiumMarkers = []
        this.hotelMarkers = []
        this.cafeMarkers = []
        this.hotelPlaceIds = new Set()
        this.cafePlaceIds = new Set()
    }

    init() {
        if (!window.google || !window.google.maps) {
            return
        }

        this.map = new google.maps.Map(document.getElementById(this.mapElementId), {
            center: new google.maps.LatLng(this.stadiums[0].latitude, this.stadiums[0].longitude),
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            mapTypeControl: false
        })

        this.placesService = new google.maps.places.PlacesService(this.map)
        this.infoWindow = new google.maps.InfoWindow()
        this.bounds = new google.maps.LatLngBounds()

        this.renderStadiumMarkers()
        this.renderHotelMarkers()
        this.renderCafeMarkers()
        this.showAllCities()
    }

    renderStadiumMarkers() {
        this.stadiums.forEach(stadium => {
            const position = new google.maps.LatLng(stadium.latitude, stadium.longitude)
            const marker = new google.maps.Marker({
                icon: {
                    url: STADIUM_MARKER_ICON,
                    scaledSize: new google.maps.Size(MARKER_SIZE, MARKER_SIZE)
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

    renderHotelMarkers() {
        this.hotelSearches.forEach(search => {
            const location = new google.maps.LatLng(search.latitude, search.longitude)

            this.placesService.nearbySearch({
                location: location,
                radius: search.radius,
                type: "lodging"
            }, (hotels, status, pagination) => {
                if (status !== google.maps.places.PlacesServiceStatus.OK || !hotels) {
                    return
                }

                hotels.forEach(hotel => {
                    this.renderHotelMarker(hotel)
                })

                if (pagination && pagination.hasNextPage) {
                    setTimeout(() => pagination.nextPage(), 1000)
                }
            })
        })
    }

    renderHotelMarker(hotel) {
        if (!hotel.geometry || !hotel.geometry.location || this.hotelPlaceIds.has(hotel.place_id)) {
            return
        }

        const marker = new google.maps.Marker({
            icon: {
                url: HOTEL_MARKER_ICON,
                scaledSize: new google.maps.Size(MARKER_SIZE, MARKER_SIZE)
            },
            map: this.map,
            position: hotel.geometry.location,
            title: hotel.name
        })

        this.hotelPlaceIds.add(hotel.place_id)
        this.hotelMarkers.push(marker)
        this.bounds.extend(hotel.geometry.location)

        marker.addListener("click", () => {
            this.infoWindow.setContent(`
                <strong>${hotel.name}</strong><br>
                ${hotel.vicinity || "Hotel near the stadium"}
            `)
            this.infoWindow.open({
                anchor: marker,
                map: this.map
            })
        })
    }

    renderCafeMarkers() {
        this.cafeSearches.forEach(search => {
            const location = new google.maps.LatLng(search.latitude, search.longitude)

            this.placesService.nearbySearch({
                location: location,
                radius: search.radius,
                type: "cafe"
            }, (cafes, status, pagination) => {
                if (status !== google.maps.places.PlacesServiceStatus.OK || !cafes) {
                    return
                }

                cafes.forEach(cafe => {
                    this.renderCafeMarker(cafe)
                })

                if (pagination && pagination.hasNextPage) {
                    setTimeout(() => pagination.nextPage(), 1000)
                }
            })
        })
    }

    renderCafeMarker(cafe) {
        if (!cafe.geometry || !cafe.geometry.location || this.cafePlaceIds.has(cafe.place_id)) {
            return
        }

        if (!cafe.types || !cafe.types.includes("cafe")) {
            return
        }

        const marker = new google.maps.Marker({
            icon: {
                url: CAFE_MARKER_ICON,
                scaledSize: new google.maps.Size(MARKER_SIZE, MARKER_SIZE)
            },
            map: this.map,
            position: cafe.geometry.location,
            title: cafe.name
        })

        this.cafePlaceIds.add(cafe.place_id)
        this.cafeMarkers.push(marker)
        this.bounds.extend(cafe.geometry.location)

        marker.addListener("click", () => {
            this.infoWindow.setContent(`
                <strong>${cafe.name}</strong><br>
                ${cafe.vicinity || "Cafe near the stadium"}
            `)
            this.infoWindow.open({
                anchor: marker,
                map: this.map
            })
        })
    }

    showAllCities() {
        this.map.fitBounds(this.bounds)
    }

    focusOnCity(index) {
        const selectedStadium = this.stadiums[index]
        const selectedMarker = this.stadiumMarkers[index]

        if (!selectedStadium || !selectedMarker) {
            return
        }

        this.map.setCenter(new google.maps.LatLng(
            selectedStadium.latitude,
            selectedStadium.longitude
        ))
        this.map.setZoom(11)
        this.infoWindow.setContent(selectedStadium.content)
        this.infoWindow.open({
            anchor: selectedMarker,
            map: this.map
        })
    }
}
