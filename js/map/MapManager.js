const MARKER_SIZE = 42
const SEARCH_RADIUS = 6000
const VISIBLE_ZOOM = 13

const STADIUM_MARKER_ICON = "images/markers/stadium.png"
const HOTEL_MARKER_ICON = "images/markers/hotel.png"
const CAFE_MARKER_ICON = "images/markers/caffe.png"
const RESTAURANT_MARKER_ICON = "images/markers/restaurant.png"

/**
 * Manages the Google Map, stadium markers, and nearby place markers.
 */
export class MapManager {

    constructor(stadiums) {
        // Store all stadium data used by the map.
        this.stadiums = stadiums

        // Keep the selected stadium index, or null before a city is chosen.
        this.activeStadiumIndex = null

        // These Google Maps objects are created when the map is initialised.
        this.map = null
        this.placesService = null
        this.infoWindow = null
        this.bounds = null

        // Keep every marker so it can be shown, hidden, or reused later.
        this.stadiumMarkers = []
        this.hotelMarkers = []
        this.cafeMarkers = []
        this.restaurantMarkers = []

        // Remember Google Places IDs to stop duplicate hotel, cafe, and restaurant markers.
        this.hotelPlaceIds = new Set()
        this.cafePlaceIds = new Set()
        this.restaurantPlaceIds = new Set()

        // Remember which stadiums already loaded nearby places.
        this.loadedHotelStadiumIndexes = new Set()
        this.loadedCafeStadiumIndexes = new Set()
        this.loadedRestaurantStadiumIndexes = new Set()
    }

    init() {
        // Do nothing until the Google Maps script has loaded.
        if (!window.google || !window.google.maps) return

        // Build the map and prepare Google Places for nearby searches.
        this.map = new google.maps.Map(document.getElementById("ns_map"), {
            center: new google.maps.LatLng(this.stadiums[0].latitude, this.stadiums[0].longitude),
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            mapTypeControl: false
        })
        this.placesService = new google.maps.places.PlacesService(this.map)
        this.infoWindow = new google.maps.InfoWindow()
        this.bounds = new google.maps.LatLngBounds()

        this.renderStadiumMarkers()
        this.showAllCities()

        this.map.addListener("zoom_changed", () => {
            this.updateNearbyMarkers()
        })
    }

    renderStadiumMarkers() {
        // Create one main custom marker for each World Cup stadium.
        this.stadiums.forEach((stadium, index) => {
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
                this.focusOnCity(index)
            })
        })
    }

    updateNearbyMarkers() {
        // Nearby places only appear after a stadium has been selected.
        if (this.activeStadiumIndex === null) return

        const zoom = this.map.getZoom()

        // Load hotels, cafés, and restaurants only when the user is close enough to the stadium.
        if (zoom >= VISIBLE_ZOOM) {
            this.loadHotelMarkers(this.activeStadiumIndex)
            this.loadCafeMarkers(this.activeStadiumIndex)
            this.loadRestaurantMarkers(this.activeStadiumIndex)
        }

        // Hide nearby markers again when the user zooms back out.
        this.hotelMarkers.forEach(({marker, stadiumIndex}) => {
            const shouldShowMarker = this.activeStadiumIndex === stadiumIndex && zoom >= VISIBLE_ZOOM
            marker.setMap(shouldShowMarker ? this.map : null)
        })
        this.cafeMarkers.forEach(({marker, stadiumIndex}) => {
            const shouldShowMarker = this.activeStadiumIndex === stadiumIndex && zoom >= VISIBLE_ZOOM
            marker.setMap(shouldShowMarker ? this.map : null)
        })
        this.restaurantMarkers.forEach(({marker, stadiumIndex}) => {
            const shouldShowMarker = this.activeStadiumIndex === stadiumIndex && zoom >= VISIBLE_ZOOM
            marker.setMap(shouldShowMarker ? this.map : null)
        })
    }

    loadHotelMarkers(stadiumIndex) {
        // Avoid requesting hotels for the same stadium more than once.
        if (this.loadedHotelStadiumIndexes.has(stadiumIndex)) return

        const stadium = this.stadiums[stadiumIndex]
        const location = new google.maps.LatLng(stadium.latitude, stadium.longitude)

        this.loadedHotelStadiumIndexes.add(stadiumIndex)
        this.placesService.nearbySearch({
            location: location,
            radius: SEARCH_RADIUS,
            type: "lodging"
        }, (hotels, status, pagination) => {
            if (status !== google.maps.places.PlacesServiceStatus.OK || !hotels) return

            hotels.forEach(hotel => {
                this.renderHotelMarker(hotel, stadiumIndex)
            })

            // Google Places returns extra results in pages.
            if (pagination && pagination.hasNextPage) {
                setTimeout(() => pagination.nextPage(), 1000)
            }
        })
    }

    renderHotelMarker(hotel, stadiumIndex) {
        // Skip places without a position and avoid duplicated markers.
        if (!hotel.geometry || !hotel.geometry.location || this.hotelPlaceIds.has(hotel.place_id)) return

        const marker = new google.maps.Marker({
            icon: {
                url: HOTEL_MARKER_ICON,
                scaledSize: new google.maps.Size(MARKER_SIZE, MARKER_SIZE)
            },
            map: null,
            position: hotel.geometry.location,
            title: hotel.name
        })

        this.hotelPlaceIds.add(hotel.place_id)
        this.hotelMarkers.push({marker: marker, stadiumIndex: stadiumIndex})

        marker.addListener("click", () => {
            // Reuse one info window instead of opening many at the same time.
            this.infoWindow.setContent(`
                <strong>${hotel.name}</strong><br>
                ${hotel.vicinity || "Hotel near the stadium"}
            `)
            this.infoWindow.open({
                anchor: marker,
                map: this.map
            })
        })
        this.updateNearbyMarkers()
    }

    loadCafeMarkers(stadiumIndex) {
        // Avoid requesting cafés for the same stadium more than once.
        if (this.loadedCafeStadiumIndexes.has(stadiumIndex)) return

        const stadium = this.stadiums[stadiumIndex]
        const location = new google.maps.LatLng(stadium.latitude, stadium.longitude)

        this.loadedCafeStadiumIndexes.add(stadiumIndex)
        this.placesService.nearbySearch({
            location: location,
            radius: SEARCH_RADIUS,
            type: "cafe"
        }, (cafes, status, pagination) => {
            if (status !== google.maps.places.PlacesServiceStatus.OK || !cafes) return

            cafes.forEach(cafe => {
                this.renderCafeMarker(cafe, stadiumIndex)
            })

            // Google Places returns extra results in pages.
            if (pagination && pagination.hasNextPage) {
                setTimeout(() => pagination.nextPage(), 1000)
            }
        })
    }

    renderCafeMarker(cafe, stadiumIndex) {
        // Skip places without a position and avoid duplicated markers.
        if (!cafe.geometry || !cafe.geometry.location || this.cafePlaceIds.has(cafe.place_id)) return
        if (!cafe.types || !cafe.types.includes("cafe")) return
        if (
            cafe.types.includes("restaurant") ||
            cafe.types.includes("dining")
        ) return

        const marker = new google.maps.Marker({
            icon: {
                url: CAFE_MARKER_ICON,
                scaledSize: new google.maps.Size(MARKER_SIZE, MARKER_SIZE)
            },
            map: null,
            position: cafe.geometry.location,
            title: cafe.name
        })

        this.cafePlaceIds.add(cafe.place_id)
        this.cafeMarkers.push({marker: marker, stadiumIndex: stadiumIndex})

        marker.addListener("click", () => {
            // Reuse one info window instead of opening many at the same time.
            this.infoWindow.setContent(`
                <strong>${cafe.name}</strong><br>
                ${cafe.vicinity || "Cafe near the stadium"}
            `)
            this.infoWindow.open({
                anchor: marker,
                map: this.map
            })
        })
        this.updateNearbyMarkers()
    }

    loadRestaurantMarkers(stadiumIndex) {
        // Avoid requesting restaurants for the same stadium more than once.
        if (this.loadedRestaurantStadiumIndexes.has(stadiumIndex)) return

        const stadium = this.stadiums[stadiumIndex]
        const location = new google.maps.LatLng(stadium.latitude, stadium.longitude)

        this.loadedRestaurantStadiumIndexes.add(stadiumIndex)
        this.placesService.nearbySearch({
            keyword: "restaurant dining",
            location: location,
            radius: SEARCH_RADIUS,
            type: "restaurant"
        }, (restaurants, status, pagination) => {
            if (status !== google.maps.places.PlacesServiceStatus.OK || !restaurants) return

            restaurants.forEach(restaurant => {
                this.renderRestaurantMarker(restaurant, stadiumIndex)
            })

            // Google Places returns extra results in pages.
            if (pagination && pagination.hasNextPage) {
                setTimeout(() => pagination.nextPage(), 1000)
            }
        })
    }

    renderRestaurantMarker(restaurant, stadiumIndex) {
        // Skip places without a position, duplicate places, and casual cafe or takeaway results.
        if (!restaurant.geometry || !restaurant.geometry.location || this.restaurantPlaceIds.has(restaurant.place_id)) return
        if (!restaurant.types || !restaurant.types.includes("restaurant")) return
        if (
            restaurant.types.includes("cafe") ||
            restaurant.types.includes("bakery") ||
            restaurant.types.includes("meal_takeaway") ||
            restaurant.types.includes("meal_delivery") ||
            restaurant.types.includes("fast_food_restaurant")
        ) return

        const marker = new google.maps.Marker({
            icon: {
                url: RESTAURANT_MARKER_ICON,
                scaledSize: new google.maps.Size(MARKER_SIZE, MARKER_SIZE)
            },
            map: null,
            position: restaurant.geometry.location,
            title: restaurant.name
        })

        this.restaurantPlaceIds.add(restaurant.place_id)
        this.restaurantMarkers.push({marker: marker, stadiumIndex: stadiumIndex})

        marker.addListener("click", () => {
            // Reuse one info window instead of opening many at the same time.
            this.infoWindow.setContent(`
                <strong>${restaurant.name}</strong><br>
                ${restaurant.vicinity || "Restaurant near the stadium"}
            `)
            this.infoWindow.open({
                anchor: marker,
                map: this.map
            })
        })
        this.updateNearbyMarkers()
    }

    showAllCities() {
        // Fit the starting view around all stadium markers.
        this.map.fitBounds(this.bounds)
    }

    focusOnCity(index) {
        // Centre the map on the selected stadium and use it as the active area.
        const selectedStadium = this.stadiums[index]
        const selectedMarker = this.stadiumMarkers[index]

        if (!selectedStadium || !selectedMarker) {
            return
        }

        this.map.setCenter(new google.maps.LatLng(
            selectedStadium.latitude,
            selectedStadium.longitude
        ))
        this.activeStadiumIndex = index
        this.map.setZoom(VISIBLE_ZOOM)
        this.infoWindow.setContent(selectedStadium.content)
        this.infoWindow.open({
            anchor: selectedMarker,
            map: this.map
        })
        this.updateNearbyMarkers()
    }
}
