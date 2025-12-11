import { DebugDisplayShapeElement } from "./DebugDisplayShapeElement";
import { Vector } from "../../../lib/Vector";
import { DebugBox } from "@minecraft/debug-utilities";

export class CollisionBox extends DebugDisplayShapeElement {
    createShapes() {
        const collisionBoxData = this.getCollisionBox();
        const dimensionLocation = { ...collisionBoxData.location, dimension: this.entity.dimension };
        this.collisionBox = new DebugBox(dimensionLocation);
        this.collisionBox.bound = collisionBoxData.size;
        this.collisionBox.color = { red: 1, green: 1, blue: 1 };
        this.shapes.push(this.collisionBox);
    }

    update() {
        const collisionBoxData = this.getCollisionBox();
        const dimensionLocation = { ...collisionBoxData.location, dimension: this.entity.dimension };
        this.collisionBox.setLocation(dimensionLocation);
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