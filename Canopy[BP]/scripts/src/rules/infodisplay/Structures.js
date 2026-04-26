import { InfoDisplayTextElement } from "./InfoDisplayTextElement";

export class Structures extends InfoDisplayTextElement {
    player;

    constructor(player, displayLine) {
        const ruleData = {
            identifier: 'structures',
            description: { translate: 'rules.infoDisplay.structures' },
            wikiDescription: 'Shows naturally generated structures present at your current location.'
        }
        super(ruleData, displayLine);
        this.player = player;
    }

    getFormattedDataOwnLine() {
        const structures = this.getFormattedStructures();
        if (structures === '')
            return { rawtext: [{ translate: 'rules.infodisplay.structures.display' }, { translate: 'rules.infodisplay.structures.display.none' }] };
        return { rawtext: [{ translate: 'rules.infodisplay.structures.display' }, { text: '§d' + structures }] };
    }

    getFormattedDataSharedLine() {
        return this.getFormattedDataOwnLine();
    }

    getFormattedStructures() {
        let structures = [];
        try {
            structures = this.player.dimension.getGeneratedStructures(this.player.location);
        } catch (error) {
            if (!['LocationInUnloadedChunkError', 'LocationOutOfWorldBoundariesError'].includes(error.name))
                throw error;
        }
        return structures.join(', ');
    }
}