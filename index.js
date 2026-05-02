import {stadiums} from "./js/data/locations.js"
import {MapManager} from "./js/map/MapManager.js"

/**
 * Initialises the Google Map and connects city buttons to stadium markers.
 */
export function initialiseMapPage() {
    const cityButtons = document.querySelectorAll(".ns_cityButton")
    const mapManager = new MapManager(stadiums)

    mapManager.init()

    cityButtons.forEach(button => {
        button.addEventListener("click", () => {
            const cityIndex = Number(button.value)

            cityButtons.forEach(cityButton => {
                cityButton.classList.remove("ns_active")
            })

            button.classList.add("ns_active")
            mapManager.focusOnCity(cityIndex)
        })
    })
}
