function parseArgs(text) {
	let regex = /(@[aepsr]\[|@"[^"]*"|"[^"]*"|\[[^\]]*\]|\S+)/g;
	
	let args = [];
	let raw = text.match(regex);
	
	const argParser = (m, i) => {
		let data;
		const booleans = ['true','false'];
		const stringRE = /^"|"$/g;
		const arrayRE = /^\[|\]$/g;
		const entityRE = /@[aepsr]\[/g;
			
		const isBoolean = booleans.includes(m);
		const isNumber = !isNaN(Number(m));
		const isString = stringRE.test(m);
		const isArray = i < raw.length - 1 && arrayRE.test(raw[i+1]);
		const isEntity = entityRE.test(m);
			
		let arg;
		if (isBoolean) data = m == 'true';
		else if (isNumber) data = Number(m);
		else if (isString) data = m.replace(stringRE, '');
		else if (isEntity && isArray) {
			data = raw[i] += raw[i + 1];
			raw[i + 1] = '$nll_';
		}
		else if (m.match(arrayRE)) data = JSON.parse(m);
		else data = m.trim();
		
		return data;
	}
	
	raw.forEach((arg, index) => {
		let argData = argParser(arg, index);
		args[index] = argData;
	});
	
	return args.filter(_ => _ != '$nll_');
}



export default parseArgs;