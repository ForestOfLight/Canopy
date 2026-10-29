import { BooleanRule, GlobalRule } from "../../../lib/canopy/Canopy";

class SimplayerActionInfo extends BooleanRule {
    constructor() {
        super(GlobalRule.morphOptions({
            identifier: 'simplayerActionInfo',
            defaultValue: true
        }));
    }
}

export const simplayerActionInfo = new SimplayerActionInfo();