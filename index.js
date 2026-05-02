import {loadStadiums} from "./js/data/locations.js"
import {MapManager} from "./js/map/MapManager.js"

/**
 * Initialises the Google Map and connects city buttons to stadium markers.
 */
export async function initialiseMapPage() {
    const stadiums = await loadStadiums()
    const cityButtons = document.querySelectorAll(".ns_cityButton")
    const categoryButtons = document.querySelectorAll(".ns_categoryButton")
    const ratingButtons = document.querySelectorAll(".ns_ratingButton")

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

    const mapManager = new MapManager(stadiums, cityIndex => {
        setActiveCityButton(cityIndex)
        resetCategoryButtons()
        resetRatingButtons()
    })

    mapManager.init()

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
