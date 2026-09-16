import { BooleanRule, GlobalRule } from "../../lib/canopy/Canopy";
import { GameMode } from "@minecraft/server";
import ItemPickup from "../classes/ItemPickup";

export class AutoItemPickup extends BooleanRule {
    itemPickup;

    constructor() {
        super(GlobalRule.morphOptions({
            identifier: 'autoItemPickup',
            wikiDescription: 'Enables the automatic pickup of items that drop when you break a block.',
            onEnableCallback: () => this.itemPickup.subscribeToEvents(),
            onDisableCallback: () => this.itemPickup.unsubscribeFromEvents(),
            independentRules: ['carefulBreak']
        }))
        this.itemPickup = new ItemPickup(AutoItemPickup.isSurvivalPlayer);
    }

    static isSurvivalPlayer(player) {
        return player?.getGameMode() === GameMode.Survival;
    }
}

export const autoItemPickup = new AutoItemPickup();
