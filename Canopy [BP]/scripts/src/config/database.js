import Dynamic, { module } from 'stickycore/dynamic'

const infoDisplay = newDB([
    'showDisplay',
    'coords',
    'facing',
    'tps',
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
    'allowSpawnMocking',
    'camera',
    'dupeTnt',
    'flippinArrows',
    'hardcodedTntPrimeMomentum',
    'hopperCounters',
    'hotbarSwitching',
    'hotberSwitchingInSurvival',
    'jump',
    'jumpInSurvival',
    'noExplosionBlockDamage',
    'noTileDrops',
    'noTntPrimeMomentum',
    'pickupOnMine',
    'pistonBedrockBreaking',
    'summontnt',
    'universalChunkLoading',
    'warp',
    'warpInSurvival',
]);

module({
    infoDisplay, features
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