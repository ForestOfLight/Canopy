import { DebugDisplayShapeElement } from "./DebugDisplayShapeElement";
import { Vector } from "../../../lib/Vector";
import { DebugBox } from "@minecraft/debug-utilities";
import { EntityComponentTypes, system } from "@minecraft/server";

export class HitBox extends DebugDisplayShapeElement {
    createShapes() {
        const hitboxData = this.getHitBox();
        this.hitbox = new DebugBox(hitboxData.location);
        this.hitbox.bound = hitboxData.size
        this.hitbox.color = { red: 1, green: 0, blue: 0 };
        this.shapes.push(this.hitbox);
    }

    update() {
        const hitboxData = this.getHitBox();
        this.hitbox.location = hitboxData.location;
        this.hitbox.bound = hitboxData.size;
    }

    getHitBox() {
        const isProjectile = this.entity.getComponent(EntityComponentTypes.Projectile) !== void 0;
        const AABB = this.entity.getAABB();
        const differenceFromCollisionBox = isProjectile ? this.getProjectileMargin() : new Vector(0.1, 0.1, 0.1);
        return {
            location: Vector.from(AABB.center).subtract(AABB.extent).subtract(differenceFromCollisionBox),
            size: Vector.from(AABB.extent).add(differenceFromCollisionBox).multiply(2)
        };
    }

    getProjectileMargin() {
        const spawnTick = this.entity.getDynamicProperty('spawnTick') || 0;
        const ageTicks = system.currentTick - spawnTick;
        const waitTicksCount = 2;
        const margin = Math.min(Math.max(0, ageTicks - waitTicksCount + 1) * 0.05, 0.3);
        return new Vector(margin, margin, margin);
    }
}