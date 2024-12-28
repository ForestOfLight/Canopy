import { InfoDisplayRule } from 'lib/canopy/Canopy';
import { ClientSystemInfo, system, SystemInfo, world } from '@minecraft/server';
import Data from 'stickycore/data';
import Utils from 'stickycore/utils';
import { DataTPS } from 'src/tps';
import { Entities } from 'src/entities';
import ProbeManager from 'src/classes/ProbeManager';
import { getInfoDisplayOutput } from 'src/commands/counter';
import { getAllTrackerInfoString } from 'src/commands/trackevent';

new InfoDisplayRule({
	identifier: 'showDisplay',
	description: { translate: 'rules.infoDisplay.showDisplay' }
});

new InfoDisplayRule({
	identifier: 'coords',
	description: { translate: 'rules.infoDisplay.coords' }
});

new InfoDisplayRule({
	identifier: 'facing',
	description: { translate: 'rules.infoDisplay.facing' }
})

new InfoDisplayRule({
	identifier: 'cardinalFacing',
	description: { translate: 'rules.infoDisplay.cardinalFacing' }
});

new InfoDisplayRule({
	identifier: 'tps',
	description: { translate: 'rules.infoDisplay.tps' }
});

new InfoDisplayRule({
	identifier: 'entities',
	description: { translate: 'rules.infoDisplay.entities' }
});

new InfoDisplayRule({
	identifier: 'light',
	description: { translate: 'rules.infoDisplay.light' }
});

new InfoDisplayRule({
	identifier: 'biome',
	description: { translate: 'rules.infoDisplay.biome' }
});

new InfoDisplayRule({
	identifier: 'worldDay',
	description: { translate: 'rules.infoDisplay.worldDay' }
});

new InfoDisplayRule({
	identifier: 'timeOfDay',
	description: { translate: 'rules.infoDisplay.timeOfDay' }
});

new InfoDisplayRule({
	identifier: 'sessionTime',
	description: { translate: 'rules.infoDisplay.sessionTime' }
});

new InfoDisplayRule({
	identifier: 'moonPhase',
	description: { translate: 'rules.infoDisplay.moonPhase' }
});

new InfoDisplayRule({
	identifier: 'slimeChunk',
	description: { translate: 'rules.infoDisplay.slimeChunk' }
});

new InfoDisplayRule({
	identifier: 'eventTrackers',
	description: { translate: 'rules.infoDisplay.eventTrackers' }
});

new InfoDisplayRule({
	identifier: 'hopperCounterCounts',
	description: { translate: 'rules.infoDisplay.hopperCounterCounts' }
});

new InfoDisplayRule({
	identifier: 'lookingAt',
	description: { translate: 'rules.infoDisplay.lookingAt' }
});

new InfoDisplayRule({
	identifier: 'signalStrength',
	description: { translate: 'rules.infoDisplay.signalStrength' },
	contingentRules: ['lookingAt']
});

new InfoDisplayRule({
	identifier: 'peekInventory',
	description: { translate: 'rules.infoDisplay.peekInventory' },
	contingentRules: ['lookingAt']
});

system.runInterval(() => {
	const players = world.getAllPlayers();
	for (const player of players) {
		if (!player) continue;
		if (InfoDisplayRule.getValue(player, 'showDisplay')) InfoDisplay(player);
	}
});

function InfoDisplay(player) {
	const infoMessage = { rawtext: [] };
	infoMessage.rawtext.push(parseCoordsAndCardinalFacing(player));
	infoMessage.rawtext.push(parseFacing(player));
	infoMessage.rawtext.push(parseTPSAndEntities(player));
	infoMessage.rawtext.push(parseLightAndBiome(player));
	infoMessage.rawtext.push(parseDayAndTime(player));
	infoMessage.rawtext.push(parseSessionTime(player));
	infoMessage.rawtext.push(parseMoonPhaseAndSlimeChunk(player));
	infoMessage.rawtext.push(parseEventTrackerInfo(player));
	infoMessage.rawtext.push(parseHopperCounters(player));
	infoMessage.rawtext.push(parseLookingAtAndSignalStrength(player));
	infoMessage.rawtext.push(parsePeek(player));

	if (infoMessage.rawtext[infoMessage.rawtext.length - 1].text === '\n')
		infoMessage.rawtext[infoMessage.rawtext.length - 1].text = '';
	
	player.onScreenDisplay.setTitle(infoMessage);
}

function parseCoordsAndCardinalFacing(player) {
	const showCoords = InfoDisplayRule.getValue(player, 'coords');
	const showCardinal = InfoDisplayRule.getValue(player, 'cardinalFacing');
	if (!showCoords && !showCardinal) return { text: '' };
	let coords = player.location;
	let facing;
	const message = { rawtext: [] };

	if (showCoords)
		[coords.x, coords.y, coords.z] = [coords.x.toFixed(2), coords.y.toFixed(2), coords.z.toFixed(2)];
	if (showCardinal)
		facing = Data.getPlayerDirection(player);
	if (showCoords && showCardinal)
		message.rawtext.push({ text: `§r${coords.x} ${coords.y} ${coords.z}§r §7${facing}§r\n` });
	else if (showCoords)
		message.rawtext.push({ text: `§r${coords.x} ${coords.y} ${coords.z}§r\n` });
	else if (showCardinal)
		message.rawtext.push({ rawtext: [{translate: 'rules.infoDisplay.cardinalFacing.display', with: [facing] },{ text: `\n` }]});

	return message;
}

function parseFacing(player) {
	const showFacing = InfoDisplayRule.getValue(player, 'facing');
	if (!showFacing) return { text: '' };
	let rotation = player.getRotation();

	[ rotation.x, rotation.y ] = [ rotation.x.toFixed(2), rotation.y.toFixed(2) ];
	return { rawtext: [{ translate: 'rules.infoDisplay.facing.display', with: [rotation.x, rotation.y] },{ text: '\n' }] };
}

function parseTPSAndEntities(player) {
	const showTPS = InfoDisplayRule.getValue(player, 'tps');
	const showEntities = InfoDisplayRule.getValue(player, 'entities');
	if (!showTPS && !showEntities) return { text: '' };
	let tpsData;
	let tps;
	let fovEntities;
	const message = { rawtext: [] };

	if (showEntities) fovEntities = Entities.getEntitiesOnScreenCount(player);
	if (showTPS) {
		tpsData = DataTPS.tps.toFixed(1);
		tps = tpsData >= 20 ? `§a20.0` : `§c${tpsData}`;	
	}
	if (showTPS && showEntities)
		message.rawtext.push({ rawtext: [{ translate: 'rules.infoDisplay.tpsAndEntities.display', with: [tps, String(fovEntities)] },{ text: '\n' }] });
	else if (showTPS)
		message.rawtext.push({ rawtext: [{ translate: 'rules.infoDisplay.tps.display', with: [tps] },{ text: '\n' }] });
	else if (showEntities)
		message.rawtext.push({ rawtext: [{ translate: 'rules.infoDisplay.entities.display', with: [String(fovEntities)] },{ text: '\n' }] });

	return message;
}

function parseLightAndBiome(player) {
	const showLight = InfoDisplayRule.getValue(player, 'light');
	const showBiome = InfoDisplayRule.getValue(player, 'biome');
	if (!showLight && !showBiome) return { text: '' };
	let lightLevel;
	let biome;
	const message = { rawtext: [] };

	if (showLight)
		lightLevel = ProbeManager.getLightLevel(player);
	if (showBiome)
		biome = ProbeManager.getBiome(player);
	if (showLight && showBiome)
		message.rawtext.push({ rawtext: [{ translate: 'rules.infoDisplay.lightAndBiome.display', with: [String(lightLevel), biome] },{ text: '\n' }] });
	else if (showLight)
		message.rawtext.push({ rawtext: [{ translate: 'rules.infoDisplay.light.display', with: [String(lightLevel)] },{ text: '\n' }] });
	else if (showBiome)
		message.rawtext.push({ rawtext: [{ translate: 'rules.infoDisplay.biome.display', with: [biome] },{ text: '\n' }] });

	return message;
}

function parseDayAndTime(player) {
	const showDay = InfoDisplayRule.getValue(player, 'worldDay');
	const showTimeOfDay = InfoDisplayRule.getValue(player, 'timeOfDay');
	if (!showDay && !showTimeOfDay) return { text: '' };
	let day;
	let dayTime;
	const message = { rawtext: [] };

	if (showDay)
		day = Data.getDay();
	if (showTimeOfDay)
		dayTime = Utils.ticksToTime(Data.getTimeOfDay());
	if (showDay && showTimeOfDay)
		message.rawtext.push({ rawtext: [{ translate: 'rules.infoDisplay.worldDayAndTimeOfDay.display', with: [String(day), dayTime] },{ text: '\n' }] });
	else if (showDay)
		message.rawtext.push({ rawtext: [{ translate: 'rules.infoDisplay.worldDay.display', with: [String(day)] },{ text: '\n' }] });
	else if (showTimeOfDay)
		message.rawtext.push({ rawtext: [{ translate: 'rules.infoDisplay.timeOfDay.display', with: [dayTime] },{ text: '\n' }] });

	return message;
}

function parseSessionTime(player) {
	const showSessionTime = InfoDisplayRule.getValue(player, 'sessionTime');
	const message = { rawtext: [] };

	if (showSessionTime) {
		const sessionTime = Data.getSessionTime(player);
		message.rawtext.push({ rawtext: [{ translate: 'rules.infoDisplay.sessionTime.display', with: [sessionTime] },{ text: '\n' }] });
	}

	return message;
}

function parseMoonPhaseAndSlimeChunk(player) {
	const showMoonPhase = InfoDisplayRule.getValue(player, 'moonPhase');
	const showSlimeChunk = InfoDisplayRule.getValue(player, 'slimeChunk');
	if (!showMoonPhase && !showSlimeChunk) return { text: '' };
	let isSlime = false;
	let moonPhase;
	let slimeChunk;
	const message = { rawtext: [] };

	if (showMoonPhase)
		moonPhase = Data.getMoonPhase();
	if (showSlimeChunk) {
		isSlime = player.dimension.id === "minecraft:overworld" && Data.isSlime(player.location.x, player.location.z);
		slimeChunk = isSlime ? { translate: 'rules.infoDisplay.slimeChunk.display' } : { text: '' };
	} 
	if (showMoonPhase && showSlimeChunk)
		message.rawtext.push({ rawtext: [{ translate: 'rules.infoDisplay.moonPhase.display', with: [moonPhase] },{ text: ' ' },slimeChunk,{ text: '\n' }] });
	else if (showMoonPhase)
		message.rawtext.push({ rawtext: [{ translate: 'rules.infoDisplay.moonPhase.display', with: [moonPhase] },{ text: '\n' }] });
	else if (showSlimeChunk && isSlime)
		message.rawtext.push({ rawtext: [slimeChunk,{ text: '\n' }] });

	return message;
}

function parseEventTrackerInfo(player) {
	if (!InfoDisplayRule.getValue(player, 'eventTrackers')) return { text: '' };
	let output = getAllTrackerInfoString().join('\n');
	const message = { rawtext: [{ text: output }] };
	if (output !== '') message.rawtext.push({ text: '\n' });
	return message;
}

function parseHopperCounters(player) {
	if (!InfoDisplayRule.getValue(player, 'hopperCounterCounts')) return { text: '' };
	return { text: getInfoDisplayOutput() };
}

function parseLookingAtAndSignalStrength(player) {
	const showLookingAt = InfoDisplayRule.getValue(player, 'lookingAt');
	const showSignalStrength = InfoDisplayRule.getValue(player, 'signalStrength');
	let blockRayResult;
	let entityRayResult;
	let lookingAtName;
	let signalStrength;
	const message = { rawtext: [] };

	if (!showLookingAt && !showSignalStrength) return { text: '' };
	({ blockRayResult, entityRayResult } = Data.getRaycastResults(player, 7));
	if (showLookingAt) {
		lookingAtName = Utils.parseLookingAtEntity(entityRayResult).LookingAtName || Utils.parseLookingAtBlock(blockRayResult).LookingAtName;
		message.rawtext.push({ text: String(lookingAtName) });
	}
	if (showSignalStrength) {
		if (blockRayResult?.block)
			signalStrength = blockRayResult.block.getRedstonePower();
		if (signalStrength)
			message.rawtext.push({ text: `§7: §c${signalStrength}§r` });
	}

	return message;
}

function parsePeek(player) {
	const showPeekInventory = InfoDisplayRule.getValue(player, 'peekInventory');
	let peekInventory;
	let blockRayResult;
	let entityRayResult;
	
	if (!showPeekInventory) return { text: '' };
	({ blockRayResult, entityRayResult } = Data.getRaycastResults(player, 7));
	peekInventory = Data.peekInventory(player, blockRayResult, entityRayResult);
	return { text: `${peekInventory}` };
}
