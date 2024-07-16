import * as mc from '@minecraft/server'
import Data from 'stickycore/data'
import Utils from 'stickycore/utils'
import { DataTPS } from 'src/tps'
import { Entities } from 'src/entities'
import { LightLevel } from 'src/light'
import { getInfoDisplayOutput } from 'src/commands/counter'

mc.system.runInterval(() => {
	const Players = mc.world.getAllPlayers();
	for (const player of Players) {
		if (player.getDynamicProperty('showDisplay')) InfoDisplay(player);
	}
});

function InfoDisplay(player) {
	let InfoText = '';

	InfoText += parseCoordsAndFacing(player);
	InfoText += parseTPS(player);
	InfoText += parseLightAndEntities(player)
	InfoText += parseDayAndTime(player);
	InfoText += parseMoonPhaseAndSlimeChunk(player)
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

function parseTPS(player) {
	const showTPS = player.getDynamicProperty('tps');
	let tpsData;
	let tps;
	let output = '';

	if (!showTPS) return output;

	tpsData = DataTPS.tps.toFixed(1);
	tps = tpsData >= 20 ? `§a20.0` : `§c${tpsData}`;
	output += `§rTPS: ${tps}§r\n`;
	return output;
}

function parseLightAndEntities(player) {
	const showLight = player.getDynamicProperty('light');
	const showEntities = player.getDynamicProperty('entities');
	let lightLevel;
	let fovEntities;
	let output = '';

	if (showLight) lightLevel = LightLevel.getLightLevel(player);
	if (showEntities) fovEntities = Entities.getEntitiesOnScreenCount(player);
	if (showLight && showEntities) output += `§rLight: §e${lightLevel} §rEntities: §7${fovEntities}§r\n`;
	else if (showLight) output += `§rLight: §e${lightLevel}§r\n`;
	else if (showEntities) output += `§rEntities: §7${fovEntities}§r\n`;

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

function parseMoonPhaseAndSlimeChunk(player) {
	const showMoonPhase = player.getDynamicProperty('moonPhase');
	const showSlimeChunk = player.getDynamicProperty('slimeChunk');
	let moonPhase;
	let slimeChunk;
	let output = '';

	if (showMoonPhase) moonPhase = Data.getMoonPhase();
	if (showSlimeChunk) slimeChunk = player.dimension.id == "minecraft:overworld" && Data.isSlime(player.location.x, player.location.z) ? '§7(§aSlime Chunk§7)§r' : '';
	if (showMoonPhase && showSlimeChunk) output += `§rMoon: §7${moonPhase}§r ${slimeChunk}\n`;
	else if (showMoonPhase) output += `§rMoon: §7${moonPhase}§r\n`;
	else if (showSlimeChunk) output += `§rChunk: ${slimeChunk}\n`;

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
