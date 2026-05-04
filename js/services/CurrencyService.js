const CURRENCY_API_URL = "https://api.frankfurter.dev/v2/rates?base=MXN&quotes=EUR,USD"

/**
 * Loads MXN exchange rates and converts estimated place budgets.
 */
export class CurrencyService {

    constructor() {
        this.rates = null
    }

    async convertBudget(minMexicanPesos, maxMexicanPesos) {
        const rates = await this.loadRates()

        if (!rates) return null

        return {
            eur: this.convertRange(minMexicanPesos, maxMexicanPesos, rates.EUR),
            usd: this.convertRange(minMexicanPesos, maxMexicanPesos, rates.USD)
        }
    }

    async loadRates() {
        // Load exchange rates once, then reuse them for every map popup.
        if (this.rates) return this.rates

        try {
            const response = await fetch(CURRENCY_API_URL)

            if (!response.ok) return null

            const data = await response.json()
            this.rates = this.formatRates(data)

            return this.rates
        } catch {
            return null
        }
    }

    convertRange(minMexicanPesos, maxMexicanPesos, rate) {
        return {
            min: Math.round(minMexicanPesos * rate),
            max: Math.round(maxMexicanPesos * rate)
        }
    }

    formatRates(data) {
        const rates = {}

        data.forEach(currency => {
            rates[currency.quote] = currency.rate
        })

        return rates
    }
}
