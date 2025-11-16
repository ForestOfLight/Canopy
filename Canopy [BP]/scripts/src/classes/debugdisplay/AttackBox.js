import { DebugDisplayShapeElement } from "./DebugDisplayShapeElement";
import { Vector } from "../../../lib/Vector";
import { DebugBox } from "@minecraft/debug-utilities";
import { EntityComponentTypes, system } from "@minecraft/server";
import { meleeMobs } from "../../../include/data";

export class AttackBox extends DebugDisplayShapeElement {
    createShapes() {
        if (!this.canAttack())
            return;
        const attackBoxData = this.getAttackBox();
        this.attackBox = new DebugBox(attackBoxData.location);
        this.attackBox.bound = attackBoxData.size
        this.attackBox.color = { red: 1, green: 0, blue: 0 };
        this.shapes.push(this.attackBox);
    }

    update() {
        if (!this.canAttack())
            return;
        const attackBoxData = this.getAttackBox();
        this.attackBox.location = attackBoxData.location;
        this.attackBox.bound = attackBoxData.size;
    }

    getAttackBox() {
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
        return new Vector(0.8, 0, 0.8);
    }

    getProjectileMargin() {
        const spawnTick = this.entity.getDynamicProperty('spawnTick') || 0;
        const ageTicks = system.currentTick - spawnTick;
        const waitTicksCount = 2;
        const margin = Math.min(Math.max(0, ageTicks - waitTicksCount + 1) * 0.05, 0.3);
        return new Vector(margin, margin, margin);
    }

    canAttack() {
        if (this.entity.getComponent(EntityComponentTypes.Projectile))
            return true;
        return meleeMobs.includes(this.entity.typeId.replace("minecraft:", ""));
    }
}