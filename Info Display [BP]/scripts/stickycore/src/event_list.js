import { world } from '@minecraft/server'

const { beforeEvents, afterEvents } = world;

const Events = {}

for (let _before in beforeEvents) {
	let key = `before/${_before.toLowerCase()}`;
	Events[key] = `before/${_before}`
}

for (let _after in afterEvents) {
	let key = `after/${_after.toLowerCase()}`;
	Events[key] = `after/${_after}`
}

export default Events;