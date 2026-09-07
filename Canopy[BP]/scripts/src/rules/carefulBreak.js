import { BooleanRule, GlobalRule } from "../../lib/canopy/Canopy";
import { GameMode } from "@minecraft/server";
import ItemPickup from "../classes/ItemPickup";

export class CarefulBreak extends BooleanRule {    
    itemPickup;

    constructor() {
        super(GlobalRule.morphOptions({
            identifier: 'carefulBreak',
            onEnableCallback: () => this.itemPickup.subscribeToEvents(),
            onDisableCallback: () => this.itemPickup.unsubscribeFromEvents(),
            independentRules: ['autoItemPickup']
        }))
        this.itemPickup = new ItemPickup(CarefulBreak.isSneakingSurvivalPlayer);
    }

    static isSneakingSurvivalPlayer(player) {
        return player?.isSneaking && player?.getGameMode() === GameMode.Survival;
    }
}

export const carefulBreak = new CarefulBreak();
