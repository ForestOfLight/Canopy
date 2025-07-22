import { DebugDisplayElement } from "./DebugDisplayElement";

export class VectorDebugDisplayElement extends DebugDisplayElement  {
    getFormattedVector(vector, { colorCode = '§7', precision = 4 } = {}) {
        return colorCode + `<${vector.x.toFixed(precision)}, ${vector.y.toFixed(precision)}, ${vector.z.toFixed(precision)}>`;
    }
}