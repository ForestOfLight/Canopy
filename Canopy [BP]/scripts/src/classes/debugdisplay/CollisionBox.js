import { DebugDisplayShapeElement } from "./DebugDisplayShapeElement";
import { Vector } from "../../../lib/Vector";
import { DebugBox } from "@minecraft/debug-utilities";

export class CollisionBox extends DebugDisplayShapeElement {
    createShapes() {
        const AABB = this.entity.getAABB();
        const min = Vector.from(AABB.center).subtract(AABB.extent);
        const size = Vector.from(AABB.extent).multiply(2);
        this.collisionBox = new DebugBox(min);
        this.collisionBox.bound = size;
        this.collisionBox.color = { red: 1, green: 1, blue: 1 };
        this.shapes.push(this.collisionBox);
    }

    update() {
        this.collisionBox.location = this.getCollisionBoxLocation();
    }

    getCollisionBoxLocation() {
        const AABB = this.entity.getAABB();
        return Vector.from(AABB.center).subtract(AABB.extent);
    }
}