import Dynamic, { module } from 'stickycore/dynamic'

const infoDisplay = newDB([
    'showDisplay',
    'coords',
    'facing',
    'tps',
    'entities',
    'biome',
    'light',
    'worldDay',
    'timeOfDay',
    'moonPhase',
    'slimeChunk',
    'eventTrackers',
    'hopperCounters',
    'lookingAt',
    'peekInventory',
]);

const features = newDB([
    'allowSpawnMocking',
    'armorStandRespawning',
    'camera',
    'claimprojectiles',
    'dupeTnt',
    'flippinArrows',
    'hardcodedTntPrimeMomentum',
    'hopperCounters',
    'hotbarSwitching',
    'hotbarSwitchingInSurvival',
    'jump',
    'jumpInSurvival',
    'noExplosionBlockDamage',
    'noTileDrops',
    'noTntPrimeMomentum',
    'pickupOnMine',
    'pistonBedrockBreaking',
    'renewableSponge',
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