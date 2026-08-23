import { BooleanRule, GlobalRule } from '../../lib/canopy/Canopy';
import { peekProxyManager } from '../classes/peek/PeekProxyManager';

class AllowPeekInventory extends BooleanRule {
    constructor() {
        super(GlobalRule.morphOptions({
            identifier: 'allowPeekInventory',
            wikiDescription: 'Enables all peek inventory functionality. Also allows opening a mirrored container by interacting with a spyglass while in creative mode.',
            onEnableCallback: () => peekProxyManager.start(),
            onDisableCallback: () => peekProxyManager.stop()
        }));
    }
}

export const allowPeekInventory = new AllowPeekInventory();
