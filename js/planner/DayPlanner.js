/**
 * Handles the seven-day trip planner controls.
 */
export class DayPlanner {

    constructor(dayButtons) {
        // Store the day controls used by the planner panel.
        this.dayButtons = dayButtons
        this.activeDay = 1
    }

    init() {
        // Connect each day button to the planner state.
        this.dayButtons.forEach(button => {
            button.addEventListener("click", () => {
                this.setActiveDay(Number(button.value))
            })
        })

        this.setActiveDay(this.activeDay)
    }

    setActiveDay(dayNumber) {
        // Highlight only the selected day button.
        this.activeDay = dayNumber
        this.dayButtons.forEach(dayButton => {
            dayButton.classList.toggle("ns_active", Number(dayButton.value) === this.activeDay)
        })
    }
}
