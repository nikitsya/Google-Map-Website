import {loadStadiums} from "./js/data/locations.js"
import {MapManager} from "./js/map/MapManager.js"

/**
 * Initialises the Google Map and connects city buttons to stadium markers.
 */
export async function initialiseMapPage() {
    const stadiums = await loadStadiums()
    const cityButtons = document.querySelectorAll(".ns_cityButton")
    const categoryButtons = document.querySelectorAll(".ns_categoryButton")

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

    const mapManager = new MapManager(stadiums, cityIndex => {
        setActiveCityButton(cityIndex)
        resetCategoryButtons()
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
}
