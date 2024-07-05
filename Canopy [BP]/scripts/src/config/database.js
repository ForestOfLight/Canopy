import Dynamic, { module } from 'stickycore/dynamic'

const infoDisplay = newDB([
    'showDisplay',
    'coords',
    'facing',
    'tps',
    'mspt',
    'light',
    'entities',
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
    'noTileDrops',
    'pickupOnMine',
    'placeCamera',
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
    'camera',
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

const data = newDB([
    'data'
]);

module({
    infoDisplay, features, camera, data, distance, entitydensity, gamemode, hopperCounters, jump, peek, summontnt, tntlog, health, warp, resetall
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