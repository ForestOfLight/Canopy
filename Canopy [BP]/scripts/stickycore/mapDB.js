import * as mc from '@minecraft/server';

class MyDB {
	constructor (name) {
		this.name = name;
		// Create or get
		let db = mc.world.getDynamicProperty(this.name);
		if (!db) mc.world.setDynamicProperty(this.name, '{}');
	
		let s = Object.keys(db || {}).length;
		this.size = s;
	}
	
	get (key) {
		let db = mc.world.getDynamicProperty(this.name);
		let json = JSON.parse(db);
		
		return json[key];
	}
	
	set (key, value) {
		let db = mc.world.getDynamicProperty(this.name);
		let json = JSON.parse(db);
		
		if (!json[key]) this.size++;
		json[key] = value;
		console.warn(key.x, json[key].location.x);
		
		let str = JSON.stringify(json);
		console.warn(str);
		mc.world.setDynamicProperty(this.name, str);
	}
	
	has (key) {
		let db = mc.world.getDynamicProperty(this.name);
		let json = JSON.parse(db);
		
		if (json[key]) return true;
		else return false;
	}
	
	remove (key) {
		let db = mc.world.getDynamicProperty(this.name);
		let json = JSON.parse(db);
		
		if (json[key]) this.size--;
		delete json[key];
		
		let str = JSON.stringify(json);
		mc.world.setDynamicProperty(this.name, str);
	}
	
	async forEach (callback, forAwait = false) {
		let db = mc.world.getDynamicProperty(this.name);
		let json = JSON.parse(db);
		
		let data = Object.keys(json);
		if (forAwait) {
			for await (let key of data) callback(key, json[key]);
		} else {
			for (let key of data) callback(key, json[key]);
		}
	}
	
	parse () {
		let db = mc.world.getDynamicProperty(this.name);
		let json = JSON.parse(db);
		return json;
	}
	
	values () {
		let db = mc.world.getDynamicProperty(this.name);
		let json = JSON.parse(db);
		
		return Object.values(json);
	}
	
	keys () {
		let db = mc.world.getDynamicProperty(this.name);
		let json = JSON.parse(db);
		
		return Object.keys(json);
	}
}

export default MyDB