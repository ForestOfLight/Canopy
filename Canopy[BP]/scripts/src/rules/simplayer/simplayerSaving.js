import { BooleanRule, GlobalRule } from "../../../lib/canopy/Canopy";

class SimplayerSaving extends BooleanRule {
    constructor() {
        super(GlobalRule.morphOptions({
            identifier: 'simplayerSaving',
            defaultValue: true
        }));
    }
}

export const simplayerSaving = new SimplayerSaving();
