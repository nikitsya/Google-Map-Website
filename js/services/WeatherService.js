const WEATHER_CODES = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Cloudy",
    45: "Fog",
    48: "Rime fog",
    51: "Light drizzle",
    53: "Drizzle",
    55: "Heavy drizzle",
    61: "Light rain",
    63: "Rain",
    65: "Heavy rain",
    80: "Light showers",
    81: "Showers",
    82: "Heavy showers",
    95: "Thunderstorm"
}

/**
 * Loads current weather for a selected stadium location.
 */
export class WeatherService {

    async loadWeather(latitude, longitude) {
        const url = this.buildWeatherUrl(latitude, longitude)

        try {
            const response = await fetch(url)

            if (!response.ok) return null

            const data = await response.json()
            return this.formatWeather(data.current)
        } catch {
            return null
        }
    }

    buildWeatherUrl(latitude, longitude) {
        return "https://api.open-meteo.com/v1/forecast" +
            `?latitude=${latitude}` +
            `&longitude=${longitude}` +
            "&current=temperature_2m,weather_code,wind_speed_10m&timezone=auto"
    }

    formatWeather(currentWeather) {
        if (!currentWeather) return null

        return {
            description: WEATHER_CODES[currentWeather.weather_code] || "Weather update",
            temperature: Math.round(currentWeather.temperature_2m),
            windSpeed: Math.round(currentWeather.wind_speed_10m)
        }
    }
}
