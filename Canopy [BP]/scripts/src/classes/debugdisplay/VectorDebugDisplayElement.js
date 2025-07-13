import { DebugDisplayElement } from "./DebugDisplayElement";
import { Vector } from "../../../lib/Vector";

export class VectorDebugDisplayElement extends DebugDisplayElement  {
    getFormattedVector(vector, colorCode = '§7') {
        return colorCode + Vector.from(vector).toString();
    }
}