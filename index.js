import {loadStadiums} from "./js/data/locations.js"
import {MapManager} from "./js/map/MapManager.js"
import {DayPlanner} from "./js/planner/DayPlanner.js"
import {WeatherService} from "./js/services/WeatherService.js"

/**
 * Starts the page after the Google Maps script has loaded.
 */
export async function initialiseMapPage() {
    // Load stadium data from the JSON file before the map is created.
    const stadiums = await loadStadiums()

    // Store the main page controls.
    const headerIcon = document.querySelector(".ns_headerIcon")
    const menuButton = document.querySelector(".ns_menuButton")
    const cityControls = document.querySelector(".ns_cityControls")
    const searchForm = document.querySelector(".ns_searchForm")
    const searchInput = document.querySelector(".ns_searchInput")
    const searchButton = document.querySelector(".ns_searchButton")
    const searchError = document.querySelector(".ns_searchError")
    const cityButtons = document.querySelectorAll(".ns_cityButton")
    const categoryButtons = document.querySelectorAll(".ns_categoryButton")
    const ratingButtons = document.querySelectorAll(".ns_ratingButton")
    const weatherText = document.querySelector(".ns_weatherText")
    const travelButtons = document.querySelectorAll(".ns_travelButton")
    const routeBuilder = document.querySelector(".ns_routeBuilder")
    const routeSlots = document.querySelectorAll(".ns_routeSlot")
    const routeAddButton = document.querySelector(".ns_routeAddButton")

    const setActiveCityButton = cityIndex => {
        cityButtons.forEach(cityButton => {
            cityButton.classList.toggle("ns_active", Number(cityButton.value) === cityIndex)
        })
    }

    const resetCategoryButtons = () => {
        categoryButtons.forEach(categoryButton => {
            categoryButton.classList.remove("ns_active")
            categoryButton.disabled = false
        })
    }

    const resetRatingButtons = () => {
        ratingButtons.forEach(ratingButton => {
            ratingButton.classList.add("ns_active")
            ratingButton.disabled = false
        })
    }

    const getSelectedRatings = () => {
        return Array.from(ratingButtons)
            .filter(ratingButton => ratingButton.classList.contains("ns_active"))
            .map(ratingButton => Number(ratingButton.value))
    }

    const showSearchError = message => {
        searchError.textContent = message
        searchError.hidden = false
        searchInput.classList.add("ns_inputError")
        searchButton.classList.add("ns_inputError")
    }

    const clearSearchError = () => {
        searchError.textContent = ""
        searchError.hidden = true
        searchInput.classList.remove("ns_inputError")
        searchButton.classList.remove("ns_inputError")
    }

    const weatherService = new WeatherService()
    let mapManager = null
    const dayPlanner = new DayPlanner(routeBuilder, routeSlots, routeAddButton, places => {
        if (mapManager) mapManager.showRoute(places)
    })

    const showWeatherForCity = async cityIndex => {
        const stadium = stadiums[cityIndex]

        weatherText.textContent = "Loading weather near the selected stadium..."

        const weather = await weatherService.loadWeather(stadium.latitude, stadium.longitude)

        weatherText.textContent = weather
            ? `${stadium.city}: ${weather.temperature}°C, ${weather.description}, wind ${weather.windSpeed} km/h`
            : "Weather is currently unavailable for this stadium."
    }

    // Create the map controller.
    mapManager = new MapManager(stadiums, cityIndex => {
        setActiveCityButton(cityIndex)
        resetCategoryButtons()
        resetRatingButtons()
        showWeatherForCity(cityIndex)
    }, place => {
        return dayPlanner.addPlace(place)
    })

    // Build the Google Map and show all host cities first.
    mapManager.init()
    dayPlanner.init()

    // --- Listeners ---
    searchForm.addEventListener("submit", event => {
        event.preventDefault()
        clearSearchError()

        if (!searchInput.value.trim()) {
            showSearchError("Enter a place name before searching.")
            return
        }

        mapManager.searchPlace(searchInput.value, showSearchError)
    })

    headerIcon.addEventListener("click", () => {
        // Reset city buttons.
        cityButtons.forEach(cityButton => {
            cityButton.classList.remove("ns_active")
        })

        // Disable category buttons.
        categoryButtons.forEach(categoryButton => {
            categoryButton.classList.remove("ns_active")
            categoryButton.disabled = true
        })

        // Disable rating buttons
        ratingButtons.forEach(ratingButton => {
            ratingButton.classList.add("ns_active")
            ratingButton.disabled = true
        })

        mapManager.showAllCities()
        cityControls.classList.remove("ns_open")
        weatherText.textContent = "Choose a city to see the current weather near its stadium."
    })

    menuButton.addEventListener("click", () => {
        // Open and close the mobile city menu.
        cityControls.classList.toggle("ns_open")
    })

    cityButtons.forEach(button => {
        button.addEventListener("click", () => {
            const cityIndex = Number(button.value)
            mapManager.focusOnCity(cityIndex)
            cityControls.classList.remove("ns_open")
        })
    })

    categoryButtons.forEach(button => {
        button.addEventListener("click", () => {
            categoryButtons.forEach(categoryButton => {
                categoryButton.classList.remove("ns_active")
            })
            button.classList.add("ns_active")
            mapManager.showNearbyCategory(button.value)
        })
    })

    ratingButtons.forEach(button => {
        button.addEventListener("click", () => {
            button.classList.toggle("ns_active")
            mapManager.setActiveRatings(getSelectedRatings())
        })
    })

    travelButtons.forEach(button => {
        button.addEventListener("click", () => {
            travelButtons.forEach(b => b.classList.remove("ns_active"))
            button.classList.add("ns_active")
            mapManager.setTravelMode(button.value)
            // Rebuild the current route with the newly selected travel mode.
            dayPlanner.updateMapRoute()
        })
    })
}
