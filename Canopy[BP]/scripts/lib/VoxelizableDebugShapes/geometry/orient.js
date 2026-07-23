const DEG = Math.PI / 180;

/** Multiply two row-major 3x3 matrices (flat, length 9). */
function mul(a, b) {
    const r = new Array(9);
    for (let i = 0; i < 3; i++)
        {for (let j = 0; j < 3; j++)
            r[i * 3 + j] = a[i * 3] * b[j] + a[i * 3 + 1] * b[3 + j] + a[i * 3 + 2] * b[6 + j];}
    return r;
}

/**
 * Basis from Euler degrees, R = Ry(yaw)·Rx(pitch)·Rz(roll), applied to the default
 * axes u0=+X, v0=+Z, n0=+Y. Returns [ux,uy,uz, vx,vy,vz, nx,ny,nz].
 */
export function eulerToBasis(pitchDeg, yawDeg, rollDeg) {
    const a = pitchDeg * DEG; const b = yawDeg * DEG; const c = rollDeg * DEG;
    const ca = Math.cos(a); const sa = Math.sin(a);
    const cb = Math.cos(b); const sb = Math.sin(b);
    const cc = Math.cos(c); const sc = Math.sin(c);
    const Rx = [1, 0, 0, 0, ca, -sa, 0, sa, ca];
    const Ry = [cb, 0, sb, 0, 1, 0, -sb, 0, cb];
    const Rz = [cc, -sc, 0, sc, cc, 0, 0, 0, 1];
    const R = mul(mul(Ry, Rx), Rz);
    // columns: u = R·(1,0,0)=col0, n = R·(0,1,0)=col1, v = R·(0,0,1)=col2
    return [
        R[0], R[3], R[6], // u (col 0)
        R[2], R[5], R[8], // v (col 2)
        R[1], R[4], R[7], // n (col 1)
    ];
}

/** Rotate vector (x,y,z) by the shortest-arc rotation from +Y to unit normal (kx,ky,kz). */
function rotateFromY(nx, ny, nz, x, y, z) {
    // axis = (+Y) × n ; angle from dot(+Y,n)=ny
    let ax = nz; let ay = 0; let az = -nx; // cross([0,1,0],[nx,ny,nz]) = (1*nz-0*ny, 0*nx-0*nz, 0*ny-1*nx)
    const axisLen = Math.hypot(ax, ay, az);
    if (axisLen < 1e-12) {
        if (ny >= 0) return [x, y, z];              // n ≈ +Y → identity
        return [x, -y, -z];                         // n ≈ -Y → 180° about +X
    }
    ax /= axisLen; ay /= axisLen; az /= axisLen;
    const cos = Math.max(-1, Math.min(1, ny));
    const sin = axisLen; // |+Y × n| = sin(angle) for unit vectors
    // Rodrigues: v cos + (k×v) sin + k (k·v)(1-cos)
    const kdotv = ax * x + ay * y + az * z;
    const cxx = ay * z - az * y; const cyy = az * x - ax * z; const czz = ax * y - ay * x;
    return [
        x * cos + cxx * sin + ax * kdotv * (1 - cos),
        y * cos + cyy * sin + ay * kdotv * (1 - cos),
        z * cos + czz * sin + az * kdotv * (1 - cos),
    ];
}

export function normalToBasis(nx, ny, nz) {
    const len = Math.hypot(nx, ny, nz) || 1;
    nx /= len; ny /= len; nz /= len;
    const u = rotateFromY(nx, ny, nz, 1, 0, 0);
    const v = rotateFromY(nx, ny, nz, 0, 0, 1);
    return [u[0], u[1], u[2], v[0], v[1], v[2], nx, ny, nz];
}

export function isAxisAligned(basis, eps = 1e-9) {
    for (let i = 0; i < 9; i++) {
        const a = Math.abs(basis[i]);
        if (a > eps && Math.abs(a - 1) > eps) return false;
    }
    return true;
}

export function mapLocal(basis, cx, cy, cz, lu, lv, lw, out, o) {
    out[o]     = cx + lu * basis[0] + lv * basis[3] + lw * basis[6];
    out[o + 1] = cy + lu * basis[1] + lv * basis[4] + lw * basis[7];
    out[o + 2] = cz + lu * basis[2] + lv * basis[5] + lw * basis[8];
}
