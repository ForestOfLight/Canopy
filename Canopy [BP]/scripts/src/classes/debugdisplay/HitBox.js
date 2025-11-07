import { DebugDisplayShapeElement } from "./DebugDisplayShapeElement";
import { Vector } from "../../../lib/Vector";
import { DebugBox } from "@minecraft/debug-utilities";
import { EntityComponentTypes, system } from "@minecraft/server";

export class HitBox extends DebugDisplayShapeElement {
    createShapes() {
        const hitboxData = this.getHitBox();
        this.hitbox = new DebugBox(hitboxData.location);
        this.hitbox.bound = hitboxData.size
        this.hitbox.color = { red: 0, green: 1, blue: 0 };
        this.shapes.push(this.hitbox);
    }

    update() {
        const hitboxData = this.getHitBox();
        this.hitbox.location = hitboxData.location;
        this.hitbox.bound = hitboxData.size;
    }

    getHitBox() {
        const AABB = this.entity.getAABB();
        const marginFromCollisionBox = this.getSpecialMargin();
        return {
            location: Vector.from(AABB.center).subtract(AABB.extent).subtract(marginFromCollisionBox),
            size: Vector.from(AABB.extent).add(marginFromCollisionBox).multiply(2)
        };
    }

    getSpecialMargin() {
        const isProjectile = this.entity.getComponent(EntityComponentTypes.Projectile) !== void 0;
        if (isProjectile)
            return this.getProjectileMargin();
        if (this.entity.typeId === "minecraft:shulker")
            return new Vector(0, 0, 0);
        return new Vector(0.1, 0.1, 0.1);
    }

    getProjectileMargin() {
        const spawnTick = this.entity.getDynamicProperty('spawnTick') || 0;
        const ageTicks = system.currentTick - spawnTick;
        const waitTicksCount = 2;
        const margin = Math.min(Math.max(0, ageTicks - waitTicksCount + 1) * 0.05, 0.3);
        return new Vector(margin, margin, margin);
    }
}