import { InfoDisplayTextElement } from './InfoDisplayTextElement.js';

export class Ping extends InfoDisplayTextElement {
    player;

    constructor(player, displayLine) {
        const ruleData = { identifier: 'ping', description: { translate: 'rules.infoDisplay.ping' }, wikiDescription: 'Shows your current network latency to the server.' };
        super(ruleData, displayLine);
        this.player = player;
        player.setDynamicProperty('joinDate', Date.now());
    }

    getFormattedDataOwnLine() {
        return { translate: 'rules.infoDisplay.ping.display', with: ['§a' + this.getPing()] };
    }

    getFormattedDataSharedLine() {
        return this.getFormattedDataOwnLine();
    }

    getPing() {
        return this.player.getPing();
    }
}
