import { BooleanRule, GlobalRule } from "../../lib/canopy/Canopy";
import { DebugDisplay } from "../classes/debugdisplay/DebugDisplay";
import { collisionBoxes } from "./collisionBoxes";

export class ServerSideCollisionBoxes extends BooleanRule {
    runners = {};

    constructor() {
        super(GlobalRule.morphOptions({
            identifier: 'serverSideCollisionBoxes',
            onEnableCallback: () => {
                collisionBoxes.refresh();
                DebugDisplay.refreshAllElements();
            },
            onDisableCallback: () => {
                collisionBoxes.refresh();
                DebugDisplay.refreshAllElements();
            }
        }));
    }
}

export const serverSideCollisionBoxes = new ServerSideCollisionBoxes();