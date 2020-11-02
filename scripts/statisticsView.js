const statisticsViewController = (function () {
	// height: 180,
	// width: 308,
	const statisticsChartConfig = {
		series: [],
		chart: {
			width: '308px',
			height: '170px',
			type: 'bar',
			stacked: true
		},
		dataLabels: {
			enabled: false
		},
		legend: {
			position: 'left',
			floating: true,
			horizontalAlign: 'top',
			show: true,
			onItemClick: {
				toggleDataSeries: false
			}
		},
		color: ['#00b350', '#0086f0'],
		xaxis: {
			categories: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
			labels: {
				style: {
					fontSize: '9px'
				}
			}
		},
		plotOptions: {
			bar: {
				columnWidth: '40%'
			}
		}
	};
	const statSelectedValues = {
		type: 'all',
		duration: 7
	};

	function renderChartByData(chartConfig) {
		if (typeof chart != 'undefined') {
			chart.destroy();
		}

		chart = new ApexCharts(
			document.querySelector('#statisticsViewChart'),
			chartConfig
		);
		chart.render();
	}

	function handleEvents() {
		htmlUtil(document).on('statisticsData', function (e) {
			var tepData = e.detail.statisticsData;
			if (
				tepData &&
				(tepData.hasOwnProperty('risky') || tepData.hasOwnProperty('track'))
			) {
				renderStatChart(tepData);
			}
		});

		htmlUtil('#statisticsType').on('change', function (e) {
			var statType = e.currentTarget.value,
				finalType = 'all';
			if (statType == 'rs') {
				finalType = 'risky';
			} else if (statType == 't') {
				finalType = 'track';
			} else {
				finalType = 'all';
			}
			statSelectedValues.type = finalType;
			sendEventForStat();
		});

		htmlUtil('#statisticsDayWise').on('change', function (e) {
			const statDur = e.currentTarget.value;
			if (!!statDur) {
				statSelectedValues.duration = statDur;
				sendEventForStat();
			}
		});
	}

	function sendEventForStat() {
		const type = statSelectedValues.type; // all, risky, track
		const duration = statSelectedValues.duration; // 7, 28
		const options = {
			detail: {
				type,
				duration
			}
		};
		Utils.dispatchEvent('getStatisticsData', options);
	}

	function renderStatChart(statisticsData) {
		const trackers = statisticsData.track;
		const risky = statisticsData.risky;
		const riskyData = risky ? setDataPointsValue(risky) : [];
		const trackerData = trackers ? setDataPointsValue(trackers) : [];

		const newStatConfig = Object.assign({}, statisticsChartConfig);

		const totalCount = (function () {
			let total = 0;
			Array.isArray(risky) &&
				risky.forEach(function (riskVal) {
					total += riskVal;
				});
			Array.isArray(trackers) &&
				trackers.forEach(function (trackVal) {
					total += trackVal;
				});
			return total;
		})();

		const riskCount = (function () {
			let total = 0;
			Array.isArray(risky) &&
				risky.forEach(function (riskVal) {
					total += riskVal;
				});
			return total;
		})();

		const trackCount = (function () {
			let total = 0;
			Array.isArray(trackers) &&
				trackers.forEach(function (riskVal) {
					total += riskVal;
				});
			return total;
		})();

		htmlUtil('[stat-desc="total-count"]').text(totalCount);
		htmlUtil('[stat-desc="risky"]').text(riskCount);
		htmlUtil('[stat-desc="track"]').text(trackCount);

		if (statSelectedValues && statSelectedValues.hasOwnProperty('type')) {
			switch (statSelectedValues.type) {
				case 'all':
					newStatConfig.series = [
						{ name: 'Trackers', data: trackerData },
						{ name: 'Risky Sites', data: riskyData }
					];

					htmlUtil('.siteBlockDesc').show().css('border-width', '1px');
					htmlUtil('.trackerBlockDesc').show();
					break;

				case 'risky':
					newStatConfig.series = [{ name: 'Risky Sites', data: riskyData }];
					htmlUtil('.siteBlockDesc').show().css('border-width', '0px');
					htmlUtil('.trackerBlockDesc').hide();
					break;

				case 'track':
					newStatConfig.series = [{ name: 'Trackers', data: trackerData }];
					htmlUtil('.siteBlockDesc').hide();
					htmlUtil('.trackerBlockDesc').show();
					break;

				default:
					break;
			}
		}

		renderChartByData(newStatConfig);
	}

	function setDataPointsValue(dataPointArr) {
		return dataPointArr.reduce(function (acc, dataPoint) {
			acc.push(dataPoint);
			return acc;
		}, []);
	}

	function load() {
		handleEvents();
		sendEventForStat();
	}

	return {
		load
	};
})();

htmlUtil(document).ready(function () {
	statisticsViewController.load();
});
