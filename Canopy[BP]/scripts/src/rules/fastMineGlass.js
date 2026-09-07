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
        this.fastMine = new FastMine(FastMineGlass.isGlass, FastMineGlass.playBreakSound);
    }

    static isGlass(blockId) {
        return blockId.includes("glass");
    }

    static playBreakSound(dimension, location) {
        dimension.playSound("random.glass", location, { volume: 1.0 });
    }
}

export const instaminableEndstone = new FastMineGlass();
