import { DebugDisplayShapeElement } from "./DebugDisplayShapeElement";
import { Vector } from "../../../lib/Vector";
import { DebugBox } from "@minecraft/debug-utilities";

const ENTITY_DENY_LIST = ["minecraft:shulker"];

export class HitBox extends DebugDisplayShapeElement {
    createShapes() {
        if (ENTITY_DENY_LIST.includes(this.entity.typeId))
            return;
        const hitboxData = this.getHitBox();
        this.hitbox = new DebugBox(hitboxData.location);
        this.hitbox.bound = hitboxData.size
        this.hitbox.color = { red: 0, green: 1, blue: 0 };
        this.shapes.push(this.hitbox);
    }

    update() {
        if (ENTITY_DENY_LIST.includes(this.entity.typeId))
            return;
        const hitboxData = this.getHitBox();
        this.hitbox.location = hitboxData.location;
        this.hitbox.bound = hitboxData.size;
    }

    getHitBox() {
        const AABB = this.entity.getAABB();
        const marginFromCollisionBox = new Vector(0.1, 0.1, 0.1);
        return {
            location: Vector.from(AABB.center).subtract(AABB.extent).subtract(marginFromCollisionBox),
            size: Vector.from(AABB.extent).add(marginFromCollisionBox).multiply(2)
        };
    }
}