const MARKER_SIZE = 42
const SEARCH_RADIUS = 6000
const VISIBLE_ZOOM = 13
const PLACE_RATINGS = [5, 4, 3, 2, 1]

// Custom marker images used instead of the default Google Maps pins.
const STADIUM_MARKER_ICON = "images/markers/stadium.png"
const HOTEL_MARKER_ICON = "images/markers/hotel.png"
const CAFE_MARKER_ICON = "images/markers/caffe.png"
const RESTAURANT_MARKER_ICON = "images/markers/restaurant.png"

/**
 * Manages the Google Map, stadium markers, and nearby place markers.
 */
export class MapManager {

    constructor(stadiums, onStadiumSelected = () => {}) {
        // Store all stadium data used by the map.
        this.stadiums = stadiums
        this.onStadiumSelected = onStadiumSelected

        // Track what the user has selected in the page controls.
        this.activeStadiumIndex = null
        this.activePlaceCategory = null
        this.activeRatings = new Set(PLACE_RATINGS)

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

        // Build the map and prepare the Places service for hotel, cafe, and restaurant searches.
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

        // Recheck nearby marker visibility whenever the user zooms in or out.
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

            // Clicking a stadium marker focuses the map on that stadium.
            marker.addListener("click", () => {
                this.focusOnCity(index)
            })
        })
    }

    updateNearbyMarkers() {
        // Nearby places only appear after a stadium has been selected.
        if (this.activeStadiumIndex === null) return

        const zoom = this.map.getZoom()

        // Load only the selected nearby category when the user is close enough to the stadium.
        if (zoom >= VISIBLE_ZOOM && this.activePlaceCategory) {
            if (this.activePlaceCategory === "hotel") {
                this.loadHotelMarkers(this.activeStadiumIndex)
            }

            if (this.activePlaceCategory === "cafe") {
                this.loadCafeMarkers(this.activeStadiumIndex)
            }

            if (this.activePlaceCategory === "restaurant") {
                this.loadRestaurantMarkers(this.activeStadiumIndex)
            }
        }

        // Hide nearby markers again when the user zooms back out.
        this.hotelMarkers.forEach(({marker, stadiumIndex, rating}) => {
            const shouldShowMarker = this.shouldShowNearbyMarker("hotel", stadiumIndex, rating, zoom)
            marker.setMap(shouldShowMarker ? this.map : null)
        })
        this.cafeMarkers.forEach(({marker, stadiumIndex, rating}) => {
            const shouldShowMarker = this.shouldShowNearbyMarker("cafe", stadiumIndex, rating, zoom)
            marker.setMap(shouldShowMarker ? this.map : null)
        })
        this.restaurantMarkers.forEach(({marker, stadiumIndex, rating}) => {
            const shouldShowMarker = this.shouldShowNearbyMarker("restaurant", stadiumIndex, rating, zoom)
            marker.setMap(shouldShowMarker ? this.map : null)
        })
    }

    shouldShowNearbyMarker(category, stadiumIndex, rating, zoom) {
        // A nearby marker is visible only when it matches the current category, city, zoom, and rating filters.
        return this.activePlaceCategory === category &&
            this.activeStadiumIndex === stadiumIndex &&
            zoom >= VISIBLE_ZOOM &&
            this.matchesRatingFilter(rating)
    }

    matchesRatingFilter(rating) {
        // Places without a rating stay visible only when the user has not narrowed the rating filter.
        if (!rating) return this.activeRatings.size === PLACE_RATINGS.length
        return this.activeRatings.has(rating)
    }

    hideNearbyMarkers() {
        // Remove all nearby hotel, cafe, and restaurant markers from the map.
        this.hotelMarkers.forEach(({marker}) => {
            marker.setMap(null)
        })
        this.cafeMarkers.forEach(({marker}) => {
            marker.setMap(null)
        })
        this.restaurantMarkers.forEach(({marker}) => {
            marker.setMap(null)
        })
    }

    // --- Hotels ---

    loadHotelMarkers(stadiumIndex) {
        // Avoid requesting hotels for the same stadium more than once.
        if (this.loadedHotelStadiumIndexes.has(stadiumIndex)) return
        this.loadedHotelStadiumIndexes.add(stadiumIndex)

        const stadium = this.stadiums[stadiumIndex]
        const location = new google.maps.LatLng(stadium.latitude, stadium.longitude)

        this.placesService.nearbySearch({
            location: location,
            radius: SEARCH_RADIUS,
            type: "lodging"
        }, (hotels, status, pagination) => {
            if (!hotels) return

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
            position: hotel.geometry.location,
            title: hotel.name
        })

        this.hotelPlaceIds.add(hotel.place_id)
        this.hotelMarkers.push({
            marker: marker,
            rating: this.getPlaceRating(hotel),
            stadiumIndex: stadiumIndex
        })

        marker.addListener("click", () => {
            // Reuse one info window instead of opening many at the same time.
            this.infoWindow.setContent(this.buildPlaceContent(hotel, "Hotel near the stadium"))
            this.infoWindow.open({
                anchor: marker,
                map: this.map
            })
        })
        this.updateNearbyMarkers()
    }

    // --- Cafes ---

    loadCafeMarkers(stadiumIndex) {
        // Avoid requesting cafés for the same stadium more than once.
        if (this.loadedCafeStadiumIndexes.has(stadiumIndex)) return
        this.loadedCafeStadiumIndexes.add(stadiumIndex)

        const stadium = this.stadiums[stadiumIndex]
        const location = new google.maps.LatLng(stadium.latitude, stadium.longitude)

        this.placesService.nearbySearch({
            location: location,
            radius: SEARCH_RADIUS,
            type: "cafe"
        }, (cafes, status, pagination) => {
            if (!cafes) return

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

        // Keep cafés separate from restaurants so the cafe filter stays focused on light food and drinks.
        if (cafe.types.includes("restaurant") || cafe.types.includes("dining")) return

        const marker = new google.maps.Marker({
            icon: {
                url: CAFE_MARKER_ICON,
                scaledSize: new google.maps.Size(MARKER_SIZE, MARKER_SIZE)
            },
            position: cafe.geometry.location,
            title: cafe.name
        })

        this.cafePlaceIds.add(cafe.place_id)
        this.cafeMarkers.push({
            marker: marker,
            rating: this.getPlaceRating(cafe),
            stadiumIndex: stadiumIndex
        })

        marker.addListener("click", () => {
            // Reuse one info window instead of opening many at the same time.
            this.infoWindow.setContent(this.buildPlaceContent(cafe, "Cafe near the stadium"))
            this.infoWindow.open({
                anchor: marker,
                map: this.map
            })
        })
        this.updateNearbyMarkers()
    }

    // --- Restaurants ---

    loadRestaurantMarkers(stadiumIndex) {
        // Avoid requesting restaurants for the same stadium more than once.
        if (this.loadedRestaurantStadiumIndexes.has(stadiumIndex)) return
        this.loadedRestaurantStadiumIndexes.add(stadiumIndex)

        const stadium = this.stadiums[stadiumIndex]
        const location = new google.maps.LatLng(stadium.latitude, stadium.longitude)

        this.placesService.nearbySearch({
            keyword: "restaurant dining",
            location: location,
            radius: SEARCH_RADIUS,
            type: "restaurant"
        }, (restaurants, status, pagination) => {
            if (!restaurants) return

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
            position: restaurant.geometry.location,
            title: restaurant.name
        })

        this.restaurantPlaceIds.add(restaurant.place_id)
        this.restaurantMarkers.push({
            marker: marker,
            rating: this.getPlaceRating(restaurant),
            stadiumIndex: stadiumIndex
        })

        marker.addListener("click", () => {
            // Reuse one info window instead of opening many at the same time.
            this.infoWindow.setContent(this.buildPlaceContent(restaurant, "Restaurant near the stadium"))
            this.infoWindow.open({
                anchor: marker,
                map: this.map
            })
        })
        this.updateNearbyMarkers()
    }

    // --- Place information ---

    buildPlaceContent(place, fallbackText) {
        // Add the first Google Places photo when one is available.
        const photoUrl = place.photos && place.photos.length > 0
            ? place.photos[0].getUrl({maxWidth: 260, maxHeight: 160})
            : null
        const ratingText = place.rating
            ? `<div class="ns_placeRating">Rating: ${place.rating} / 5</div>`
            : null

        // Build the small popup shown when a hotel, cafe, or restaurant marker is clicked.
        return `
            <div class="ns_placeInfo">
                ${photoUrl ? `<img alt="${place.name}" class="ns_placePhoto" src="${photoUrl}">` : ""}
                <strong>${place.name}</strong>
                ${ratingText}
                <div>${place.vicinity || fallbackText}</div>
            </div>
        `
    }

    getPlaceRating(place) {
        if (!place.rating) return null
        // The closest whole number.
        return Math.round(place.rating)
    }

    showAllCities() {
        // This is the starting map state: no selected city and no nearby markers.
        if (!this.map || !this.bounds) return

        this.activeStadiumIndex = null
        this.activePlaceCategory = null
        this.activeRatings = new Set(PLACE_RATINGS)
        this.hideNearbyMarkers()
        if (this.infoWindow) this.infoWindow.close()
        this.map.fitBounds(this.bounds)
    }

    showNearbyCategory(category) {
        // Store the selected nearby category and refresh marker visibility.
        if (this.activeStadiumIndex === null) return

        this.activePlaceCategory = category
        this.updateNearbyMarkers()
    }

    setActiveRatings(ratings) {
        this.activeRatings = new Set(ratings)
        this.updateNearbyMarkers()
    }

    focusOnCity(index) {
        // Centre the map on the selected stadium and use it as the active search area.
        const selectedStadium = this.stadiums[index]
        const selectedMarker = this.stadiumMarkers[index]

        // Stop if the index does not match a real stadium or marker.
        if (!selectedStadium || !selectedMarker) return

        this.map.setCenter(new google.maps.LatLng(
            selectedStadium.latitude,
            selectedStadium.longitude
        ))
        this.activeStadiumIndex = index
        this.activePlaceCategory = null
        this.activeRatings = new Set(PLACE_RATINGS)
        this.map.setZoom(VISIBLE_ZOOM)
        this.infoWindow.setContent(selectedStadium.content)
        this.infoWindow.open({
            anchor: selectedMarker,
            map: this.map
        })
        this.onStadiumSelected(index)
        this.updateNearbyMarkers()
    }
}
