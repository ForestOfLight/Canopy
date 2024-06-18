import Dynamic, { module } from 'stickycore/dynamic'

const infoDisplay = newDB([
    'showDisplay',
    'coords',
    'facing',
    'tps',
    'entities',
    //'light',
    'slimeChunk',
    'worldDay',
    'timeOfDay',
    'moonPhase',
    'lookingAt',
    'peekInventory',
    'all',
]);

const peek = newDB([
    'peekOnce'
]);

const jump = newDB([
    'jump'
]);

const plot = newDB([
    'plot'
]);

const gamemode = newDB([
    's',
    'c',
    'spc'
]);

const camera = newDB([
    'placeCamera',
    'viewCamera'
]);

module({
    infoDisplay, peek, jump, plot, gamemode, camera
});

function newDB(arr, db = true) {
	let struct = {};
	arr.forEach(_ => {
		struct[_.toLowerCase()] = _;
		if (db) {
            new Dynamic('boolean', _);
        }
	});
	
	return struct;
}