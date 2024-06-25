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
    'placecamera',
    'jump',
    'jumpInSurvival',
    'warp',
    'warpInSurvival',
    'noExplosionBlockDamage',
    'summontnt',
    'pickupOnMine',
    'universalChunkLoading',
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

const tickcart = newDB([
    'tickcart',
    'tickingcarts'
])

const tntlog = newDB([
    'tntlog'
]);

const entitydensity = newDB([
    'entitydensity'
]);

const tps = newDB([
    'tps'
]);

module({
    infoDisplay, features, peek, jump, warp, gamemode, camera, distance, tntlog, entitydensity, tps,
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