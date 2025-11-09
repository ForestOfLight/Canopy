import { DebugDisplayShapeElement } from "./DebugDisplayShapeElement";
import { Vector } from "../../../lib/Vector";
import { DebugBox } from "@minecraft/debug-utilities";

export class CollisionBox extends DebugDisplayShapeElement {
    createShapes() {
        const collisionBoxData = this.getCollisionBox();
        this.collisionBox = new DebugBox(collisionBoxData.location);
        this.collisionBox.bound = collisionBoxData.size;
        this.collisionBox.color = { red: 1, green: 1, blue: 1 };
        this.shapes.push(this.collisionBox);
    }

    update() {
        const collisionBoxData = this.getCollisionBox();
        this.collisionBox.location = collisionBoxData.location;
        this.collisionBox.bound = collisionBoxData.size;
    }

    getCollisionBox() {
        const AABB = this.entity.getAABB();
        return {
            location: Vector.from(AABB.center).subtract(AABB.extent),
            size: Vector.from(AABB.extent).multiply(2)
        };
    }
}