import { BooleanRule } from "../../../lib/canopy/Canopy";

class SimplayerSaving extends BooleanRule {
    constructor() {
        super({
            identifier: 'simplayerSaving',
            description: { translate: 'rules.simplayerSaving' },
            defaultValue: true
        });
    }
}

export const simplayerSaving = new SimplayerSaving();
