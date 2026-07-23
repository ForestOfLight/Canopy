const DEGREES_TO_RADIANS = Math.PI / 180;

function multiply3x3(left, right) {
    const product = new Array(9);
    for (let row = 0; row < 3; row++) {
        for (let column = 0; column < 3; column++) {
            product[row * 3 + column] =
                left[row * 3] * right[column]
                + left[row * 3 + 1] * right[3 + column]
                + left[row * 3 + 2] * right[6 + column];
        }
    }
    return product;
}

function rotateVectorFromYAxis(normalX, normalY, normalZ, vectorX, vectorY, vectorZ) {
    let axisX = normalZ;
    let axisY = 0;
    let axisZ = -normalX;
    const axisLength = Math.hypot(axisX, axisY, axisZ);
    if (axisLength < 1e-12) {
        if (normalY >= 0)
            return [vectorX, vectorY, vectorZ];
        return [vectorX, -vectorY, -vectorZ];
    }
    axisX /= axisLength;
    axisY /= axisLength;
    axisZ /= axisLength;
    const cosAngle = Math.max(-1, Math.min(1, normalY));
    const sinAngle = axisLength;
    const axisDotVector = axisX * vectorX + axisY * vectorY + axisZ * vectorZ;
    const crossX = axisY * vectorZ - axisZ * vectorY;
    const crossY = axisZ * vectorX - axisX * vectorZ;
    const crossZ = axisX * vectorY - axisY * vectorX;
    return [
        vectorX * cosAngle + crossX * sinAngle + axisX * axisDotVector * (1 - cosAngle),
        vectorY * cosAngle + crossY * sinAngle + axisY * axisDotVector * (1 - cosAngle),
        vectorZ * cosAngle + crossZ * sinAngle + axisZ * axisDotVector * (1 - cosAngle),
    ];
}

export class OrientationFrame {
    constructor(axes) {
        this.axes = axes;
    }

    static fromEuler(pitchDegrees, yawDegrees, rollDegrees) {
        const pitch = pitchDegrees * DEGREES_TO_RADIANS;
        const yaw = yawDegrees * DEGREES_TO_RADIANS;
        const roll = rollDegrees * DEGREES_TO_RADIANS;
        const cosPitch = Math.cos(pitch);
        const sinPitch = Math.sin(pitch);
        const cosYaw = Math.cos(yaw);
        const sinYaw = Math.sin(yaw);
        const cosRoll = Math.cos(roll);
        const sinRoll = Math.sin(roll);
        const rotationPitch = [1, 0, 0, 0, cosPitch, -sinPitch, 0, sinPitch, cosPitch];
        const rotationYaw = [cosYaw, 0, sinYaw, 0, 1, 0, -sinYaw, 0, cosYaw];
        const rotationRoll = [cosRoll, -sinRoll, 0, sinRoll, cosRoll, 0, 0, 0, 1];
        const rotation = multiply3x3(multiply3x3(rotationYaw, rotationPitch), rotationRoll);
        return new OrientationFrame([
            rotation[0], rotation[3], rotation[6],
            rotation[2], rotation[5], rotation[8],
            rotation[1], rotation[4], rotation[7],
        ]);
    }

    static fromNormal(normalX, normalY, normalZ) {
        const length = Math.hypot(normalX, normalY, normalZ) || 1;
        const unitX = normalX / length;
        const unitY = normalY / length;
        const unitZ = normalZ / length;
        const uAxis = rotateVectorFromYAxis(unitX, unitY, unitZ, 1, 0, 0);
        const vAxis = rotateVectorFromYAxis(unitX, unitY, unitZ, 0, 0, 1);
        return new OrientationFrame([
            uAxis[0], uAxis[1], uAxis[2],
            vAxis[0], vAxis[1], vAxis[2],
            unitX, unitY, unitZ,
        ]);
    }

    isAxisAligned(epsilon = 1e-9) {
        const axes = this.axes;
        for (let index = 0; index < 9; index++) {
            const magnitude = Math.abs(axes[index]);
            if (magnitude > epsilon && Math.abs(magnitude - 1) > epsilon)
                return false;
        }
        return true;
    }

    planeAxes() {
        if (!this.isAxisAligned())
            return null;
        const axes = this.axes;
        const dominantWorldAxis = (frameOffset) => {
            for (let component = 0; component < 3; component++) {
                if (Math.abs(axes[frameOffset + component]) > 0.5)
                    return { axis: component, sign: Math.sign(axes[frameOffset + component]) };
            }
            return { axis: 0, sign: 1 };
        };
        const u = dominantWorldAxis(0);
        const v = dominantWorldAxis(3);
        const normal = dominantWorldAxis(6);
        return { uAxis: u.axis, uSign: u.sign, vAxis: v.axis, vSign: v.sign, normalAxis: normal.axis };
    }

    mapLocal(centerX, centerY, centerZ, localU, localV, localNormal, out, offset) {
        const axes = this.axes;
        out[offset] = centerX + localU * axes[0] + localV * axes[3] + localNormal * axes[6];
        out[offset + 1] = centerY + localU * axes[1] + localV * axes[4] + localNormal * axes[7];
        out[offset + 2] = centerZ + localU * axes[2] + localV * axes[5] + localNormal * axes[8];
    }
}
