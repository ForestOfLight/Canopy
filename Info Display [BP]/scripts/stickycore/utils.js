class Utils {
    static calcDistance(locationOne, locationTwo) {
		const x = locationOne.x - locationTwo.x;
		const y = locationOne.y - locationTwo.y;
		const z = locationOne.z - locationTwo.z;
		return Math.sqrt(x*x + y*y + z*z);
	}

    static isNumeric(str) {
        return !isNaN(Number(str)) && isFinite(str);
    }
}

export default Utils;