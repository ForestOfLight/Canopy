import { BooleanRule, GlobalRule } from '../../lib/canopy/Canopy';
import { Instaminable } from '../classes/Instaminable';

export class InstaminableDeepslate extends BooleanRule {
    instaminable;

    constructor() {
        super(GlobalRule.morphOptions({
            identifier: 'instaminableDeepslate',
            wikiDescription: 'Makes deepslate and its variants instaminable when using an efficiency 5 netherite pickaxe with haste 2.',
            onEnableCallback: () => this.instaminable.subscribeToEvents(),
            onDisableCallback: () => this.instaminable.unsubscribeFromEvents()
        }))
        this.instaminable = new Instaminable(InstaminableDeepslate.isDeepslate);
    }

    static isDeepslate(blockId) {
        return blockId.includes('deepslate');
    }
}

export const instaminableDeepslate = new InstaminableDeepslate();
