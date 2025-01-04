import InfoDisplayElement from './InfoDisplayElement.js';
import { world } from '@minecraft/server';

class SessionTime extends InfoDisplayElement {
    player;

    constructor(player) {
        this.player = player;
        player.setDynamicProperty('joinDate', Date.now());
        super('sessionTime', { translate: 'rules.infoDisplay.sessionTime' }, 6);
    }

    getFormattedDataOwnLine() {
        return { translate: 'rules.infoDisplay.sessionTime.display', with: [this.getSessionTime()] };
    }

    getFormattedDataSharedLine() {
        return { test: `§7${this.ticksToTime(world.getTimeOfDay())}§r` };
    }

    getSessionTime() {
		const joinDate = this.player.getDynamicProperty('joinDate');
		if (!joinDate) return '?:?';
		const sessionTime = (Date.now() - joinDate) / 1000;
		const hours = Math.floor(sessionTime / 3600);
		const minutes = Math.floor((sessionTime % 3600) / 60);
		const seconds = Math.floor(sessionTime % 60);
		let output = '';
		if (hours > 0) output += `${hours}:`;
		output += `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
		return output;
	}
}

export default SessionTime;