import { system, world } from '@minecraft/server'
import Data from 'stickycore/data'
import Utils from 'stickycore/utils'
import { DataTPS } from 'src/tps'
import { Entities } from 'src/entities'
import ProbeManager from 'src/classes/ProbeManager'
import { getInfoDisplayOutput } from 'src/commands/counter'
import { getAllTrackerInfoString } from 'src/commands/trackevent';

system.runInterval(() => {
	const Players = world.getAllPlayers();
	for (const player of Players) {
		if (player.getDynamicProperty('showDisplay')) InfoDisplay(player);
	}
});

function InfoDisplay(player) {
	let InfoText = '';

	InfoText += parseCoordsAndFacing(player);
	InfoText += parseTPSAndEntities(player);
	InfoText += parseLightAndBiome(player);
	InfoText += parseDayAndTime(player);
	InfoText += parseSessionTime(player);
	InfoText += parseMoonPhaseAndSlimeChunk(player);
	InfoText += parseEventTrackerInfo(player);
	InfoText += parseHopperCounters(player);
	InfoText += parseLookingAtAndPeek(player);
	
	player.onScreenDisplay.setTitle(InfoText.trim());
}

function parseCoordsAndFacing(player) {
	const showCoords = player.getDynamicProperty('coords');
	const showFacing = player.getDynamicProperty('facing');
	let coords = player.location;
	let facing;
	let output = '';

	if (showCoords) [ coords.x, coords.y, coords.z ] = [ coords.x.toFixed(2), coords.y.toFixed(2), coords.z.toFixed(2) ];
	if (showFacing) facing = Data.getPlayerDirection(player);
	if (showCoords && showFacing) output += `§r${coords.x} ${coords.y} ${coords.z}§r §7${facing}§r\n`;
	else if (showCoords) output += `§r${coords.x} ${coords.y} ${coords.z}§r\n`;
	else if (showFacing) output += `§rFacing: §7${facing}§r\n`;

	return output;
}

function parseTPSAndEntities(player) {
	const showTPS = player.getDynamicProperty('tps');
	const showEntities = player.getDynamicProperty('entities');
	let tpsData;
	let tps;
	let fovEntities;
	let output = '';

	if (showEntities) fovEntities = Entities.getEntitiesOnScreenCount(player);
	if (showTPS) {
		tpsData = DataTPS.tps.toFixed(1);
		tps = tpsData >= 20 ? `§a20.0` : `§c${tpsData}`;	
	}
	if (showTPS && showEntities) output += `§rTPS: ${tps}§r Entities: §7${fovEntities}§r\n`;
	else if (showTPS) output += `§rTPS: ${tps}§r\n`;
	else if (showEntities) output += `§rEntities: §7${fovEntities}§r\n`;

	return output;
}

function parseLightAndBiome(player) {
	const showLight = player.getDynamicProperty('light');
	const showBiome = player.getDynamicProperty('biome');
	let lightLevel;
	let biome;
	let output = '';

	if (showLight) lightLevel = ProbeManager.getLightLevel(player);
	if (showBiome) biome = ProbeManager.getBiome(player);
	if (showLight && showBiome) output += `§rLight: §e${lightLevel} §rBiome: §a${biome}§r\n`;
	else if (showLight) output += `§rLight: §e${lightLevel}§r\n`;
	else if (showBiome) output += `§rBiome: §a${biome}§r\n`;

	return output;
}

function parseDayAndTime(player) {
	const showDay = player.getDynamicProperty('worldDay');
	const showTimeOfDay = player.getDynamicProperty('timeOfDay');
	let day;
	let dayTime;
	let output = '';

	if (showDay) day = Data.getDay();
	if (showTimeOfDay) dayTime = Utils.ticksToTime(Data.getTimeOfDay());
	if (showDay && showTimeOfDay) output += `Day: §7${day}§r §7${dayTime}§r\n`;
	else if (showDay) output += `§rDay: §7${day}§r\n`;
	else if (showTimeOfDay) output += `§rTime: §7${dayTime}§r\n`;

	return output;
}

function parseSessionTime(player) {
	const showSessionTime = player.getDynamicProperty('sessionTime');
	let sessionTime;
	let output = '';

	if (showSessionTime) {
		sessionTime = Data.getSessionTime(player);
		output += `§rSession: §7${sessionTime}§r\n`;
	}

	return output;
}

function parseMoonPhaseAndSlimeChunk(player) {
	const showMoonPhase = player.getDynamicProperty('moonPhase');
	const showSlimeChunk = player.getDynamicProperty('slimeChunk');
	const isSlime = player.dimension.id === "minecraft:overworld" && Data.isSlime(player.location.x, player.location.z);
	let moonPhase;
	let slimeChunk;
	let output = '';

	if (showMoonPhase) moonPhase = Data.getMoonPhase();
	if (showSlimeChunk) slimeChunk = isSlime ? '§7(§aSlime Chunk§7)§r' : '';
	if (showMoonPhase && showSlimeChunk) output += `§rMoon: §7${moonPhase}§r ${slimeChunk}\n`;
	else if (showMoonPhase) output += `§rMoon: §7${moonPhase}§r\n`;
	else if (showSlimeChunk && isSlime) output += `§r${slimeChunk}\n`;

	return output;
}

function parseEventTrackerInfo(player) {
	if (!player.getDynamicProperty('eventTrackers')) return '';
	let output = getAllTrackerInfoString().join('\n');
	if (output !== '') output += '\n';
	return output;
}

function parseHopperCounters(player) {
	if (!player.getDynamicProperty('hopperCounters')) return '';
	return getInfoDisplayOutput();
}

function parseLookingAtAndPeek(player) {
	const showLookingAt = player.getDynamicProperty('lookingAt');
	const showPeekInventory = player.getDynamicProperty('peekInventory');
	let blockRayResult;
	let entityRayResult;
	let lookingAtName;
	let peekInventory;
	let output = '';

	if (!showLookingAt && !showPeekInventory) return '';
	({ blockRayResult, entityRayResult } = Data.getRaycastResults(player, 7));
	if (showLookingAt) {
		lookingAtName = Utils.parseLookingAtEntity(entityRayResult).LookingAtName || Utils.parseLookingAtBlock(blockRayResult).LookingAtName;
		output += `${lookingAtName}`;
	}
	if (showPeekInventory) {
		peekInventory = Data.peekInventory(player, blockRayResult, entityRayResult);
		output += `${peekInventory}`;
	}

	return output;
}
