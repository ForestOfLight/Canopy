import { InfoDisplayElement } from './InfoDisplayElement.js';
import { world } from '@minecraft/server';

class TimeOfDay extends InfoDisplayElement {
    constructor(displayLine) {
		const ruleData = { identifier: 'timeOfDay', description: { translate: 'rules.infoDisplay.timeOfDay' } };
        super(ruleData, displayLine, true);
    }

    getFormattedDataOwnLine() {
        return { text: `§a${this.ticksToTime(world.getTimeOfDay(), 1)}§r` };
    }

    getFormattedDataSharedLine() {
        return { text: `§a${this.ticksToTime(world.getTimeOfDay(), 2)}§r` };
    }

    ticksToTime(ticks, hourPadding) {
		const ticksPerDay = 24000;
		const hoursPerDay = 24;
		const ticksPerHour = ticksPerDay / hoursPerDay;
		const hoursOffset = 6; // 0 ticks is 6:00 AM ingame
		ticks = (ticks + hoursOffset * ticksPerHour) % ticksPerDay;
		
		const ticksPerMinute = 60;
		let hours = Math.floor(ticks / ticksPerHour);
		const minutes = Math.floor((ticks % ticksPerHour) * ticksPerMinute / ticksPerHour);
		
		const noon = 12;
		const halfADay = 12;
		let period = 'AM';
		if (hours >= noon)
			period = 'PM';
		if (hours > noon)
			hours -= halfADay;
		else if (hours === 0)
			hours = noon;
	
		const formattedHours = hours.toString().padStart(hourPadding, '0');
		const formattedMinutes = minutes.toString().padStart(2, '0');
	
		return `${formattedHours}:${formattedMinutes} ${period}`;
	}
}

export default TimeOfDay;