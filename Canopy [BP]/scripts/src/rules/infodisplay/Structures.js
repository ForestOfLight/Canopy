import { InfoDisplayElement } from "./InfoDisplayElement";

export class Structures extends InfoDisplayElement {
    player;

    constructor(player, displayLine) {
        const ruleData = {
            identifier: 'structures',
            description: { translate: 'rules.infoDisplay.structures' }
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