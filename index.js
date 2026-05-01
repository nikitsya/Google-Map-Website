import {locations} from "./js/data/locations.js";
import {MapManager} from "./js/map/MapManager.js";

export function initialiseMapPage() {
    const cityButtons = document.querySelectorAll("[data-city-button]");
    const mapManager = new MapManager("map", locations);

    mapManager.init();

    cityButtons.forEach(button => {
        button.addEventListener("click", () => {
            const cityIndex = Number(button.getAttribute("data-city-button"));

            cityButtons.forEach(cityButton => {
                cityButton.removeAttribute("data-active");
            });

            button.setAttribute("data-active", "true");
            mapManager.focusOnCity(cityIndex);
        });
    });
}
