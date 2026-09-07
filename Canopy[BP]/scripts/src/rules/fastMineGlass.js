import { BooleanRule, GlobalRule } from '../../lib/canopy/Canopy';
import { FastMine } from '../classes/FastMine';

export class FastMineGlass extends BooleanRule {
    fastMine;

    constructor() {
        super(GlobalRule.morphOptions({
            identifier: 'fastMineGlass',
            wikiDescription: 'Makes glass and its variants break quickly when using an efficiency 5 netherite pickaxe.',
            onEnableCallback: () => this.fastMine.subscribeToEvents(),
            onDisableCallback: () => this.fastMine.unsubscribeFromEvents()
        }))
        this.fastMine = new FastMine(FastMineGlass.isGlass);
    }

    static isGlass(blockId) {
        return blockId.includes("glass");
    }
}

export const instaminableEndstone = new FastMineGlass();
