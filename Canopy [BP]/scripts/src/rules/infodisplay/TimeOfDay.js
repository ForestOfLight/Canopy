import InfoDisplayElement from './InfoDisplayElement.js';
import { world } from '@minecraft/server';

class TimeOfDay extends InfoDisplayElement {
    constructor() {
        super('timeOfDay', { translate: 'rules.infoDisplay.timeOfDay' }, 5, true);
    }

    getFormattedDataOwnLine() {
        return { translate: 'rules.infoDisplay.timeOfDay.display', with: [this.ticksToTime(world.getTimeOfDay())] };
    }

    getFormattedDataSharedLine() {
        return { test: `§7${this.ticksToTime(world.getTimeOfDay())}§r` };
    }

    ticksToTime(ticks) {
		const ticksPerDay = 24000;
		const ticksPerHour = ticksPerDay / 24;
		ticks = (ticks + 6 * ticksPerHour) % ticksPerDay; // 0 ticks is 6:00 AM in game
		
		let hours = Math.floor(ticks / ticksPerHour);
		const minutes = Math.floor((ticks % ticksPerHour) * 60 / ticksPerHour);
		
		let period = 'AM';
		if (hours >= 12) period = 'PM';
		if (hours >= 13) hours -= 12;
		else if (hours === 0) hours = 12;
	
		const formattedHours = hours.toString().padStart(2, '0');
		const formattedMinutes = minutes.toString().padStart(2, '0');
	
		return `${formattedHours}:${formattedMinutes} ${period}`;
	}
}

export default TimeOfDay;