/**
 * Part of ItemStack Database by @gameza_src
 * Unknown author
 */
const isVec3Symbol = Symbol("isVec3");
export function Vector(x = 0, y = 0, z = 0) {
    if (new.target) {
        this.x = Number(x);
        this.y = Number(y);
        this.z = Number(z);
    } else {return { x: Number(x), y: Number(y), z: Number(z), __proto__: Vector.prototype };}
}
Vector.magnitude = function magnitude(vec) { return Math.sqrt(vec.x * vec.x + vec.y * vec.y + vec.z * vec.z); }
Vector.normalize = function normalize(vec) { const l = Vector.magnitude(vec); return { x: vec.x / l, y: vec.y / l, z: vec.z / l, __proto__: Vector.prototype }; }
Vector.cross = function crossProduct(a, b) { return { x: a.y * b.z - a.z * b.y, y: a.x * b.z - a.z * b.x, z: a.x * b.y - a.y * b.x, __proto__: Vector.prototype }; }
Vector.dot = function dot(a, b) { return a.x * b.x + a.y * b.y + a.z * b.z; }
Vector.angleBetween = function angleBetween(a, b) { return Math.acos(Vector.dot(a, b) / (Vector.magnitude(a) * Vector.magnitude(b))); }
Vector.subtract = function subtract(a, b) { return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z, __proto__: Vector.prototype } };
Vector.add = function add(a, b) { return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z, __proto__: Vector.prototype } };
Vector.multiply = function multiply(vec, num) {
    if (typeof num == "number") return { x: vec.x * num, y: vec.y * num, z: vec.z * num, __proto__: Vector.prototype };
    return { x: vec.x * num.x, y: vec.y * num.y, z: vec.z * num.z, __proto__: Vector.prototype };
}
Vector.divide = function divide(vec, num) {
    if (typeof num == "number") return { x: vec.x / num, y: vec.y / num, z: vec.z / num, __proto__: Vector.prototype };
    return { x: vec.x / num.x, y: vec.y / num.y, z: vec.z / num.z, __proto__: Vector.prototype };
}
Vector.isVec3 = function isVec3(vec) { return vec[isVec3Symbol] === true; }
Vector.floor = function floor(vec) { return { x: Math.floor(vec.x), y: Math.floor(vec.y), z: Math.floor(vec.z), __proto__: Vector.prototype }; }
Vector.projection = function projection(a, b) { return Vector.multiply(b, Vector.dot(a, b) / ((b.x * b.x + b.y * b.y + b.z * b.z) ** 2)); }
Vector.rejection = function rejection(a, b) { return Vector.subtract(a, Vector.projection(a, b)); }
Vector.reflect = function reflect(v, n) { return Vector.subtract(v, Vector.multiply(n, 2 * Vector.dot(v, n))); }
Vector.lerp = function lerp(a, b, t) { return Vector.multiply(a, 1 - t).add(Vector.multiply(b, t)); }
Vector.distance = function distance(a, b) { return Vector.magnitude(Vector.subtract(a, b)); }
Vector.from = function from(object) {
    if (Vector.isVec3(object)) return object;
    if (Array.isArray(object)) return new Vector(object[0], object[1], object[2]);
    const { x = 0, y = 0, z = 0 } = object ?? {};
    return { x: Number(x), y: Number(y), z: Number(z), __proto__: Vector.prototype };
}
Vector.sort = function sort(vec1, vec2) {
    const [x1, x2] = vec1.x < vec2.x ? [vec1.x, vec2.x] : [vec2.x, vec1.x];
    const [y1, y2] = vec1.y < vec2.y ? [vec1.y, vec2.y] : [vec2.y, vec1.y];
    const [z1, z2] = vec1.z < vec2.z ? [vec1.z, vec2.z] : [vec2.z, vec1.z];
    return [{ x: x1, y: y1, z: z1, __proto__: Vector.prototype }, { x: x2, y: y2, z: z2, __proto__: Vector.prototype }];
}
Vector.up = { x: 0, y: 1, z: 0, __proto__: Vector.prototype };
Vector.down = { x: 0, y: -1, z: 0, __proto__: Vector.prototype };
Vector.right = { x: 1, y: 0, z: 0, __proto__: Vector.prototype };
Vector.left = { x: -1, y: 0, z: 0, __proto__: Vector.prototype };
Vector.forward = { x: 0, y: 0, z: 1, __proto__: Vector.prototype };
Vector.backward = { x: 0, y: 0, z: -1, __proto__: Vector.prototype };
Vector.zero = { x: 0, y: 0, z: 0, __proto__: Vector.prototype };
Vector.prototype = {
    distance(vec) { return Vector.distance(this, vec); },
    lerp(vec, t) { return Vector.lerp(this, vec, t); },
    projection(vec) { return Vector.projection(this, vec); },
    reflect(vec) { return Vector.reflect(this, vec); },
    rejection(vec) { return Vector.rejection(this, vec); },
    cross(vec) { return Vector.cross(this, vec); },
    dot(vec) { return Vector.dot(this, vec); },
    floor() { return Vector.floor(this); },
    add(vec) { return Vector.add(this, vec); },
    subtract(vec) { return Vector.subtract(this, vec); },
    multiply(num) { return Vector.multiply(this, num); },
    divide(num) { return Vector.divide(this, num); },
    get length() { return Vector.magnitude(this); },
    get normalized() { return Vector.normalize(this); },
    x: 0,
    y: 0,
    z: 0,
    [isVec3Symbol]: true,
    toString(numDecimals = void 0) {
        if (typeof numDecimals === "number")
            return `<${this.x.toFixed(numDecimals)}, ${this.y.toFixed(numDecimals)}, ${this.z.toFixed(numDecimals)}>`;
        return `<${this.x}, ${this.y}, ${this.z}>`;
    }
}