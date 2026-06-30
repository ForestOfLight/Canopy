import { InfoDisplayTextElement } from './InfoDisplayTextElement.js';

export class Ping extends InfoDisplayTextElement {
    static getRuleIdentifier() {
        return 'ping';
    }

    player;

    constructor(player, displayLine) {
        const ruleData = { description: { translate: 'rules.infoDisplay.ping' }, wikiDescription: 'Shows your current network latency to the server.' };
        super(ruleData, displayLine);
        this.player = player;
        player.setDynamicProperty('joinDate', Date.now());
    }

    getFormattedDataOwnLine() {
        const ping = this.getPing();
        return { translate: 'rules.infoDisplay.ping.display', with: [this.getPingColor(ping) + ping] };
    }

    getFormattedDataSharedLine() {
        return this.getFormattedDataOwnLine();
    }

    getPing() {
        return this.player.getPing();
    }

    getPingColor(ping) {
        if (ping < 100) return '§a';
        else if (ping < 300) return '§e';
        else if (ping < 1000) return '§c';
        return '§5';
    }
}
