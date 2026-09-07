import { BooleanRule, GlobalRule } from '../../lib/canopy/Canopy';
import { Instaminable } from '../classes/Instaminable';

export class InstaminableEndstone extends BooleanRule {
    instaminable;

    constructor() {
        super(GlobalRule.morphOptions({
            identifier: 'instaminableEndstone',
            wikiDescription: 'Makes endstone and its variants instaminable when using an efficiency 5 netherite pickaxe with haste 2.',
            onEnableCallback: () => this.instaminable.subscribeToEvents(),
            onDisableCallback: () => this.instaminable.unsubscribeFromEvents()
        }))
        this.instaminable = new Instaminable(InstaminableEndstone.isEndStone);
    }

    static isEndStone(blockId) {
        return blockId.includes('end_stone');
    }
}

export const instaminableEndstone = new InstaminableEndstone();
