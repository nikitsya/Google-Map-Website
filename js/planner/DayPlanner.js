const ROUTE_POSITIONS = [
    {column: 1, row: 1}, {column: 2, row: 1}, {column: 3, row: 1}, {column: 4, row: 1},
    {column: 4, row: 2}, {column: 3, row: 2}, {column: 2, row: 2}, {column: 1, row: 2},
    {column: 1, row: 3}, {column: 2, row: 3}, {column: 3, row: 3}, {column: 4, row: 3},
    {column: 4, row: 4}, {column: 3, row: 4}, {column: 2, row: 4}, {column: 1, row: 4}
]

const ROUTE_LINE_SIZE = 4

/**
 * Handles the one-day trip planner controls.
 */
export class DayPlanner {

    constructor(routeBuilder, routeSlots, routeAddButton, onRouteChanged = () => {}) {
        this.routeBuilder = routeBuilder
        this.routeSlots = routeSlots
        this.routeAddButton = routeAddButton
        this.onRouteChanged = onRouteChanged
        this.visibleSlots = 1
        this.activeSlot = null
        this.routePlaces = Array.from(routeSlots).map(() => null)
    }

    init() {
        this.routeAddButton.addEventListener("click", () => {
            this.showNextSlot()
        })

        this.routeSlots.forEach((slot, index) => {
            const slotAction = slot.querySelector(".ns_routeSlotAction")
            const deleteButton = slot.querySelector(".ns_routeDeleteButton")

            slotAction.addEventListener("click", () => {
                this.selectSlot(slot)
            })

            if (deleteButton) {
                deleteButton.addEventListener("click", event => {
                    event.stopPropagation()
                    this.deleteSlot(index)
                })
            }
        })

        this.renderRoute()
    }

    selectSlot(slot) {
        // Click the same slot again to stop selecting a map place for it.
        this.activeSlot = this.activeSlot === slot ? null : slot
        this.routeSlots.forEach(routeSlot => {
            routeSlot.classList.toggle("ns_active", routeSlot === this.activeSlot)
        })
    }

    addPlace(place) {
        // Add a clicked map place only after the user has selected a route slot.
        if (!this.activeSlot) return false

        this.setSlotLabel(this.activeSlot, place.name)
        this.routePlaces[Array.from(this.routeSlots).indexOf(this.activeSlot)] = place
        this.activeSlot.classList.add("ns_filled")
        this.activeSlot.classList.remove("ns_active")
        this.activeSlot = null
        this.updateMapRoute()

        return true
    }

    deleteSlot(index) {
        if (index >= this.visibleSlots) return

        // If deleting the start slot when it's the only one, just clear its content.
        if (index === 0 && this.visibleSlots <= 1) {
            this.resetSlot(this.routeSlots[0], 0)
            this.renderRoute()
            this.updateMapRoute()
            return
        }

        let shiftIndex = index
        while (shiftIndex < this.visibleSlots - 1) {
            const targetSlot = this.routeSlots[shiftIndex]
            const sourceSlot = this.routeSlots[shiftIndex + 1]

            if (sourceSlot.classList.contains("ns_filled")) {
                this.setSlotLabel(targetSlot, sourceSlot.querySelector(".ns_routeSlotLabel").textContent)
                this.routePlaces[shiftIndex] = this.routePlaces[shiftIndex + 1]
                targetSlot.classList.add("ns_filled")
            } else {
                this.resetSlot(targetSlot, shiftIndex)
            }

            shiftIndex += 1
        }

        this.resetSlot(this.routeSlots[this.visibleSlots - 1], this.visibleSlots - 1)
        this.visibleSlots -= 1
        this.renderRoute()
        this.updateMapRoute()
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
        const start = this.getSlotCentre(this.routeSlots[startIndex])
        const end = this.getSlotCentre(this.routeSlots[endIndex])
        const line = document.createElement("span")

        line.className = "ns_routeLine"

        if (start.y === end.y) {
            line.style.left = `${Math.min(start.x, end.x)}px`
            line.style.top = `${start.y - ROUTE_LINE_SIZE / 2}px`
            line.style.width = `${Math.abs(end.x - start.x)}px`
            line.style.height = `${ROUTE_LINE_SIZE}px`
            return line
        }

        line.style.left = `${start.x - ROUTE_LINE_SIZE / 2}px`
        line.style.top = `${Math.min(start.y, end.y)}px`
        line.style.width = `${ROUTE_LINE_SIZE}px`
        line.style.height = `${Math.abs(end.y - start.y)}px`
        return line
    }

    getSlotCentre(slot) {
        return {
            x: slot.offsetLeft + slot.offsetWidth / 2,
            y: slot.offsetTop + slot.offsetHeight / 2
        }
    }

    setSlotLabel(slot, label) {
        slot.querySelector(".ns_routeSlotLabel").textContent = label
    }

    resetSlot(slot, index) {
        const slotLabel = index === 0 ? "Start" : `Place ${index}`
        this.setSlotLabel(slot, slotLabel)
        this.routePlaces[index] = null
        slot.classList.remove("ns_active", "ns_filled")
    }

    updateMapRoute() {
        this.onRouteChanged(this.routePlaces.filter(place => place))
    }
}
