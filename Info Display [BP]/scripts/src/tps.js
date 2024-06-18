import * as mc from '@minecraft/server'

// Track TPS
const DataTPS = {
	tps: 0,
	lastTick: Date.now(),
	timeArray: []
}

mc.system.runInterval(() => {
	if (DataTPS.timeArray.length == 20) DataTPS.timeArray.shift();
	DataTPS.timeArray.push(Math.round(1000 / (Date.now() - DataTPS.lastTick) * 100) / 100);
	DataTPS.tps = DataTPS.timeArray.reduce((a,b) => a + b) / DataTPS.timeArray.length;
	DataTPS.lastTick = Date.now();
});

export { DataTPS } 