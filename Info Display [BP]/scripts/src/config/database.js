import Dynamic, { module } from 'stickycore/dynamic'

const infoDisplay = newDB([
    'showDisplay',
    'coords',
    'facing',
    'tps',
    'entities',
    'light',
    'slimeChunk',
    'worldDay',
    'timeOfDay',
    'moonPhase',
    'hopperCounters',
    'lookingAt',
    'peekInventory',
    'all',
]);

const features = newDB([
    'hopperCounters',
    'jump',
    'jumpInSurvival',
    'noExplosionBlockDamage',
    'pickupOnMine',
    'placecamera',
    'summontnt',
    'universalChunkLoading',
    'warp',
    'warpInSurvival',
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
    'placecamera',
    'viewcamera'
]);

const distance = newDB([
    'distance'
]);

const tntlog = newDB([
    'tntlog'
]);

const summontnt = newDB([
    'summontnt'
]);

const entitydensity = newDB([
    'entitydensity'
]);

const health = newDB([
    'health'
]);

const hopperCounters = newDB([
    'counter',
    'counters',
]);

const resetall = newDB([
    'resetall'
]);

module({
    infoDisplay, features, camera, distance, entitydensity, gamemode, hopperCounters, jump, peek, summontnt, tntlog, health, warp, resetall
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