import { InfoDisplayTextElement } from './InfoDisplayTextElement.js';

class SessionTime extends InfoDisplayTextElement {
    player;

    constructor(player, displayLine) {
        const ruleData = { identifier: 'sessionTime', description: { translate: 'rules.infoDisplay.sessionTime' }, wikiDescription: 'Shows the elapsed time since you joined the world in this session.' };
        super(ruleData, displayLine);
        this.player = player;
        player.setDynamicProperty('joinDate', Date.now());
    }

    getFormattedDataOwnLine() {
        return { translate: 'rules.infoDisplay.sessionTime.display', with: ['§d' + this.getSessionTime()] };
    }

    getFormattedDataSharedLine() {
        return this.getFormattedDataOwnLine();
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