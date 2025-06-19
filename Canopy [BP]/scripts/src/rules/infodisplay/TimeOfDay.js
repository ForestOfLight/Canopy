import { InfoDisplayElement } from './InfoDisplayElement.js';
import { world } from '@minecraft/server';

class TimeOfDay extends InfoDisplayElement {
    constructor(displayLine) {
		const ruleData = { identifier: 'timeOfDay', description: { translate: 'rules.infoDisplay.timeOfDay' } };
        super(ruleData, displayLine, true);
    }

    getFormattedDataOwnLine() {
        return { translate: 'rules.infoDisplay.timeOfDay.display', with: [this.ticksToTime(world.getTimeOfDay())] };
    }

    getFormattedDataSharedLine() {
        return { text: `§7${this.ticksToTime(world.getTimeOfDay())}§r` };
    }

    ticksToTime(ticks) {
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
	
		const padding = 2;
		const formattedHours = hours.toString().padStart(padding, '0');
		const formattedMinutes = minutes.toString().padStart(padding, '0');
	
		return `${formattedHours}:${formattedMinutes} ${period}`;
	}
}

export default TimeOfDay;