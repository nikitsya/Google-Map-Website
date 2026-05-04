import {loadStadiums} from "./js/data/locations.js"
import {MapManager} from "./js/map/MapManager.js"
import {DayPlanner} from "./js/planner/DayPlanner.js"

/**
 * Starts the page after the Google Maps script has loaded.
 */
export async function initialiseMapPage() {
    // Load stadium data from the JSON file before the map is created.
    const stadiums = await loadStadiums()

    // Store the main page controls.
    const headerIcon = document.querySelector(".ns_headerIcon")
    const searchForm = document.querySelector(".ns_searchForm")
    const searchInput = document.querySelector(".ns_searchInput")
    const searchButton = document.querySelector(".ns_searchButton")
    const searchError = document.querySelector(".ns_searchError")
    const cityButtons = document.querySelectorAll(".ns_cityButton")
    const categoryButtons = document.querySelectorAll(".ns_categoryButton")
    const ratingButtons = document.querySelectorAll(".ns_ratingButton")
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

    const dayPlanner = new DayPlanner(routeBuilder, routeSlots, routeAddButton)

    // Create the map controller.
    const mapManager = new MapManager(stadiums, cityIndex => {
        setActiveCityButton(cityIndex)
        resetCategoryButtons()
        resetRatingButtons()
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
    })

    cityButtons.forEach(button => {
        button.addEventListener("click", () => {
            const cityIndex = Number(button.value)
            mapManager.focusOnCity(cityIndex)
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
}
