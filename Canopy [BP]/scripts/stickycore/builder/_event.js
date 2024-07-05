import Dimension from './_dimension'
import Entity from './_entity'
import Block from './_block'

class _Data {
	#properties;
	#builder;
	
	constructor(properties, builder) {
		this.#properties = properties;
		this.#builder = builder;
	}
	
	check = (prop) => this.#properties.includes(prop);
	
	parse = (data) => new this.#builder(data);
}

class _Event {
	#data;
	#entities = new _Data([
		'entity',
		'source',
		'sender',
		'player',
		'damagingEntity',
		'hitEntity'
	], Entity);
	
	#blocks = new _Data([
		'block',
		'hitBlock'
	], Block);
	
	#dimensions = new _Data([
		'dimension'
	], Dimension);
	
	constructor(data) {
		this.#data = {}
		for (let _ in data) {
			if(this.#entities.check(_)) {
				const _d = this.#entities.parse(data[_]);
				this.#data[_] = _d
			} else if(this.#blocks.check(_)) {
				const _d = this.#blocks.parse(data[_]);
				this.#data[_] = _d
			} else if(this.#dimensions.check(_)) {
				const _d = this.#dimensions.parse(data[_]);
				this.#data[_] = _d
			} else {
				this.#data[_] = data[_];
			}
		}
		
		return this.#data;
	}
}



export default _Event;