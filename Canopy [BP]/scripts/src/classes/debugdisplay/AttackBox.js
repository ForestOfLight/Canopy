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
        const dimensionLocation = { ...attackBoxData.location, dimension: this.entity.dimension };
        const attackBox = new DebugBox(dimensionLocation);
        attackBox.bound = attackBoxData.size;
        attackBox.color = { red: 1, green: 0, blue: 0 };
        this.drawShape(attackBox);
    }

    update() {
        if (!this.canAttack())
            return;
        const attackBoxData = this.getAttackBox();
        this.shapes[0].bound = attackBoxData.size;
    }

    getAttackBox() {
        const AABB = this.entity.getAABB();
        const isProjectile = this.entity.getComponent(EntityComponentTypes.Projectile) !== void 0;
        if (isProjectile) {
            const marginFromCenter = this.getProjectileMargin();
            return {
                location: new Vector(0, AABB.extent.y, 0),
                size: marginFromCenter.multiply(2)
            };
        }
        const marginFromCollisionBox = new Vector(0.8, 0, 0.8);
        return {
            location: new Vector(0, AABB.extent.y, 0),
            size: Vector.from(AABB.extent).add(marginFromCollisionBox).multiply(2)
        };
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
