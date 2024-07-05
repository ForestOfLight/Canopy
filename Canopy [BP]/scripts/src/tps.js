import * as mc from '@minecraft/server'

// Track TPS
const DataTPS = {
	tps: 0,
	avgMspt: 0,
	mspt: 0,
	lastTick: Date.now(),
	timeArray: [],
	msptArray: []
}

mc.system.runInterval(() => {
	if (DataTPS.timeArray.length >= 20) DataTPS.timeArray.shift();
	if (DataTPS.msptArray.length >= 20) DataTPS.msptArray.shift();
	DataTPS.mspt = Date.now() - DataTPS.lastTick;
	DataTPS.timeArray.push(Math.round(1000 / DataTPS.mspt * 100) / 100);
	DataTPS.tps = DataTPS.timeArray.reduce((a,b) => a + b) / DataTPS.timeArray.length;
	DataTPS.msptArray.push(DataTPS.mspt);
	DataTPS.avgMspt = DataTPS.msptArray.reduce((a,b) => a + b) / DataTPS.msptArray.length;
	DataTPS.lastTick = Date.now();
});

export { DataTPS } 