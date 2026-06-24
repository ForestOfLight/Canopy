import { BooleanRule } from "../../../lib/canopy/Canopy";

class NoSimplayerSaving extends BooleanRule {
    constructor() {
        super({
            identifier: 'noSimplayerSaving',
            description: { translate: 'rules.noSimplayerSaving' },
            defaultValue: false
        });
    }
}

export const noSimplayerSaving = new NoSimplayerSaving();
