import { system } from '@minecraft/server'

const DataTPS = {
	tps: 0,
	avgMspt: 0,
	mspt: 0,
	lastTick: Date.now(),
	tpsArray: [],
	msptArray: [],

	tpsToMspt(tps) {
		return 1000 / tps;
	},

	msptToTps(mspt) {
		return 1000 / mspt;
	}
}

system.runInterval(() => {
	if (DataTPS.tpsArray.length >= 20) DataTPS.tpsArray.shift();
	if (DataTPS.msptArray.length >= 20) DataTPS.msptArray.shift();
	DataTPS.mspt = Date.now() - DataTPS.lastTick;
	DataTPS.tpsArray.push(DataTPS.msptToTps(DataTPS.mspt));
	DataTPS.tps = DataTPS.tpsArray.reduce((a,b) => a + b) / DataTPS.tpsArray.length;
	DataTPS.lastTick = Date.now();
});

export { DataTPS } 