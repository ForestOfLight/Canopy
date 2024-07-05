import * as mc from '@minecraft/server';

class Dynamic {
	#types = {
		string: '',
		number: 0,
		boolean: false,
		vector3: { x: 0, y: 0, z: 0 }
	}
	#_types = Object.keys(this.#types);
	
	constructor(type, identifier) {
		if (!this.#_types.includes(type)) throw new Error('Invalid type: ' + type);
		else if (Dynamic.getData(identifier)) return;
		
		const typeVal = this.#types[type];
		Dynamic.setData(identifier, typeVal);
	}
	
	static getData(identifier) {
		return mc.world.getDynamicProperty(identifier);
	}
	
	static setData(identifier, value) {
		mc.world.setDynamicProperty(identifier, value);
	}
};

const module = data => {
	if (typeof data != 'object') return;
	// Upload to module
	for (const key in data) {
		if (Object.hasOwnProperty.call(data, key))
		module.exports[key] = data[key];
	}
}

module.exports = {};

export default Dynamic;
export { module } 