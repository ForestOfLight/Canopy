import { system, TicksPerSecond} from '@minecraft/server'

const MS_PER_SECOND = 1000;

const DataTPS = {
	tps: 0,
	avgMspt: 0,
	mspt: 0,
	lastTick: Date.now(),
	tpsArray: [],
	msptArray: [],

	tpsToMspt(tps) {
		return MS_PER_SECOND / tps;
	},

	msptToTps(mspt) {
		return MS_PER_SECOND / mspt;
	}
}

system.runInterval(() => {
	if (DataTPS.tpsArray.length >= TicksPerSecond) DataTPS.tpsArray.shift();
	if (DataTPS.msptArray.length >= TicksPerSecond) DataTPS.msptArray.shift();
	DataTPS.mspt = Date.now() - DataTPS.lastTick;
	DataTPS.tpsArray.push(DataTPS.msptToTps(DataTPS.mspt));
	DataTPS.tps = DataTPS.tpsArray.reduce((a,b) => a + b) / DataTPS.tpsArray.length;
	DataTPS.lastTick = Date.now();
});

export { DataTPS } 