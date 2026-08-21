import { BooleanRule, GlobalRule } from '../../lib/canopy/Canopy';
import { peekProxyManager } from '../classes/peek/PeekProxyManager';

class AllowPeekInventory extends BooleanRule {
    constructor() {
        super(GlobalRule.morphOptions({
            identifier: 'allowPeekInventory',
            wikiDescription: 'Enables all peek inventory functionality. This rule must be enabled to use `peekInventory` in your InfoDisplay. It also enables the `/peek` command and the ability to peek inside containers by holding a spyglass. Opening a peeked container mirrors it into a proxy you can edit, so it is limited to operators in creative mode.',
            onEnableCallback: () => peekProxyManager.start(),
            onDisableCallback: () => peekProxyManager.stop()
        }));
    }
}

export const allowPeekInventory = new AllowPeekInventory();
