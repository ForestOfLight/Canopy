import { BooleanRule, GlobalRule } from "../../lib/canopy/Canopy";
import { collisionBoxes } from "./collisionBoxes";

export class ServerSideCollisionBoxes extends BooleanRule {
    runners = {};

    constructor() {
        super(GlobalRule.morphOptions({
            identifier: 'serverSideCollisionBoxes',
            onEnableCallback: () => {
                collisionBoxes.refresh();
            },
            onDisableCallback: () => {
                collisionBoxes.refresh();
            }
        }));
    }
}

export const serverSideCollisionBoxes = new ServerSideCollisionBoxes();