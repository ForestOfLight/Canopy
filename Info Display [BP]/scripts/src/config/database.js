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

const features = newDB([
    'placeCamera',
    'jump',
    'jumpInSurvival',
    'warp',
    'warpInSurvival',
    'tickingPearls',
    'noTntExplode',
    'summonTnt',
]);

const peek = newDB([
    'peek'
]);

const jump = newDB([
    'jump'
]);

const warp = newDB([
    'warp',
    'warps'
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

const distance = newDB([
    'distance'
]);

const tickPearl = newDB([
    'tickPearl',
    'numTickingPearls'
])

const tntLog = newDB([
    'tntLog'
]);

module({
    infoDisplay, features, peek, jump, warp, gamemode, camera, distance, tickPearl, tntLog,
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