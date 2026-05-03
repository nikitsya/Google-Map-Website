const ROUTE_POSITIONS = [
    {column: 1, row: 1, x: 48, y: 38},
    {column: 2, row: 1, x: 172, y: 38},
    {column: 3, row: 1, x: 296, y: 38},
    {column: 4, row: 1, x: 420, y: 38},
    {column: 4, row: 2, x: 420, y: 144},
    {column: 3, row: 2, x: 296, y: 144},
    {column: 2, row: 2, x: 172, y: 144},
    {column: 1, row: 2, x: 48, y: 144},
    {column: 1, row: 3, x: 48, y: 250},
    {column: 2, row: 3, x: 172, y: 250},
    {column: 3, row: 3, x: 296, y: 250},
    {column: 4, row: 3, x: 420, y: 250},
    {column: 4, row: 4, x: 420, y: 356},
    {column: 3, row: 4, x: 296, y: 356},
    {column: 2, row: 4, x: 172, y: 356},
    {column: 1, row: 4, x: 48, y: 356}
]

/**
 * Handles the one-day trip planner controls.
 */
export class DayPlanner {

    constructor(routeBuilder, routeSlots, routeAddButton) {
        // Store the route controls used by the planner panel.
        this.routeBuilder = routeBuilder
        this.routeSlots = routeSlots
        this.routeAddButton = routeAddButton
        this.visibleSlots = 1
    }

    init() {
        // The plus button reveals the next prepared place slot.
        this.routeAddButton.addEventListener("click", () => {
            this.showNextSlot()
        })
        this.renderRoute()
    }

    showNextSlot() {
        // Stop when every prepared place slot is already visible.
        if (this.visibleSlots >= this.routeSlots.length) return
        this.visibleSlots += 1
        this.renderRoute()
    }

    renderRoute() {
        // Show only the route slots that the user has opened with the plus button.
        this.routeSlots.forEach((slot, index) => {
            const position = ROUTE_POSITIONS[index]
            const isVisible = index < this.visibleSlots

            slot.hidden = !isVisible
            slot.style.gridColumn = position.column
            slot.style.gridRow = position.row
        })

        this.updateAddButton()
        this.renderLines()
    }

    updateAddButton() {
        // Move the plus button to the next hidden slot position.
        if (this.visibleSlots >= this.routeSlots.length) {
            this.routeAddButton.hidden = true
            return
        }

        const position = ROUTE_POSITIONS[this.visibleSlots]

        this.routeAddButton.style.gridColumn = position.column
        this.routeAddButton.style.gridRow = position.row
    }

    renderLines() {
        // Remove old lines first so they do not duplicate after each plus click.
        this.routeBuilder.querySelectorAll(".ns_routeLine").forEach(line => {
            line.remove()
        })

        // Draw fresh lines between the route slots that are currently visible.
        let index = 0
        while (index < this.visibleSlots - 1) {
            this.routeBuilder.appendChild(this.createLine(index, index + 1))
            index += 1
        }
    }

    createLine(startIndex, endIndex) {
        // Create one straight line between two neighbouring route slots.
        const start = ROUTE_POSITIONS[startIndex]
        const end = ROUTE_POSITIONS[endIndex]
        const line = document.createElement("span")

        line.className = "ns_routeLine"

        if (start.y === end.y) {
            line.style.left = `${Math.min(start.x, end.x)}px`
            line.style.top = `${start.y}px`
            line.style.width = `${Math.abs(end.x - start.x)}px`
            line.style.height = "4px"
            return line
        }

        line.style.left = `${start.x}px`
        line.style.top = `${Math.min(start.y, end.y)}px`
        line.style.width = "4px"
        line.style.height = `${Math.abs(end.y - start.y)}px`
        return line
    }
}
