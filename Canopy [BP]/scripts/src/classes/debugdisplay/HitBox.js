import { DebugDisplayShapeElement } from "./DebugDisplayShapeElement";
import { Vector } from "../../../lib/Vector";
import { DebugBox } from "@minecraft/debug-utilities";

const DENY_ENTITIES = ["minecraft:shulker"];
const BIG_PROJECTILES = ["minecraft:wither_skull", "minecraft:wither_skull_dangerous", "minecraft:wind_charge_projectile", "minecraft:breeze_wind_charge_projectile", "minecraft:fireball", "minecraft:llama_spit"];

export class HitBox extends DebugDisplayShapeElement {
    createShapes() {
        const hitboxData = this.getHitBox();
        const dimensionLocation = { ...hitboxData.location, dimension: this.entity.dimension };
        const hitbox = new DebugBox(dimensionLocation);
        hitbox.bound = hitboxData.size;
        hitbox.color = { red: 0, green: 1, blue: 0 };
        this.drawShape(hitbox);
    }

    update() {
        const hitboxData = this.getHitBox();
        this.shapes[0].bound = hitboxData.size;
    }

    getHitBox() {
        const AABB = this.entity.getAABB();
        const marginFromCollisionBox = this.getMargin();
        return {
            location: new Vector(-AABB.extent.x, 0, -AABB.extent.z).subtract(marginFromCollisionBox),
            size: Vector.from(AABB.extent).add(marginFromCollisionBox).multiply(2)
        };
    }

    getMargin() {
        if (DENY_ENTITIES.includes(this.entity.typeId))
            return new Vector(0, 0, 0);
        if (BIG_PROJECTILES.includes(this.entity.typeId))
            return new Vector(1, 1, 1);
        return new Vector(0.1, 0.1, 0.1);
    }

    getClientSideLocation() {
        return this.getHitBox().location;
    }
}