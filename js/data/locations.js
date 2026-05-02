const LOCATIONS_FILE = "./js/data/locations.json"

export async function loadStadiums() {
    const response = await fetch(LOCATIONS_FILE)
    const locations = await response.json()
    return locations.stadiums
}
