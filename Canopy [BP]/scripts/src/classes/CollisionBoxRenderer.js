import { system } from "@minecraft/server";
import { CollisionBox } from "./debugdisplay/CollisionBox";
import { EyeLevel } from "./debugdisplay/EyeLevel";
import { ViewDirectionVector } from "./debugdisplay/ViewDirectionVector";

export class CollisionBoxRenderer {
    entity;
    collisionBox;
    eyeLevel;
    viewDirectionVector;
    runner = void 0;

    constructor(entity) {
        this.entity = entity;
        this.startRender();
    }

    destroy() {
        this.stopRender();
        this.entity = void 0;
    }

    startRender() {
        this.collisionBox = new CollisionBox(this.entity);
        this.eyeLevel = new EyeLevel(this.entity);
        this.viewDirectionVector = new ViewDirectionVector(this.entity);
        this.runner = system.runInterval(this.onTick.bind(this));
    }

    stopRender() {
        if (this.runner !== void 0) {
            system.clearRun(this.runner);
            this.runner = void 0;
        }
        this.collisionBox.destroy();
        this.eyeLevel.destroy();
        this.viewDirectionVector.destroy();
    }

    onTick() {
        if (!this.entity?.isValid) {
            this.stopRender();
            return;
        }
        this.collisionBox.update();
        this.eyeLevel.update();
        this.viewDirectionVector.update();
    }
}