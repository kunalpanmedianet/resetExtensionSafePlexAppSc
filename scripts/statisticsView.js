const statisticsViewController = (function () {
	const statisticsChartConfig = {
		series: [],
		tooltip: {
			x: {
				show: false
			}
		},
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
		colors: ['#0086f0', '#00b350'],
		xaxis: {
			type: 'category',
			labels: {
				style: {
					fontSize: '9px'
				}
			}
		},
		yaxis: {
			labels: {
				formatter: function (val) {
					return val.toFixed(0);
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
		if (typeof statViewChart != 'undefined') {
			statViewChart.destroy();
		}

		statViewChart = new ApexCharts(
			document.querySelector('#statisticsViewChart'),
			chartConfig
		);
		statViewChart.render();
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

		window._totalRiskCounts = totalCount;

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
					newStatConfig.colors = ['#00b350'];
					htmlUtil('.siteBlockDesc').show().css('border-width', '0px');
					htmlUtil('.trackerBlockDesc').hide();
					break;

				case 'track':
					newStatConfig.series = [{ name: 'Trackers', data: trackerData }];
					newStatConfig.colors = ['#0086f0'];
					htmlUtil('.siteBlockDesc').hide();
					htmlUtil('.trackerBlockDesc').show();
					break;

				default:
					break;
			}
		}

		/*  0 - 1 =>  1
			2 => 2
			3 => 3
			4 => 4
		*/

		if (_totalRiskCounts <= 1) {
			newStatConfig.yaxis.tickAmount = 1;
		} else if (_totalRiskCounts > 1 && _totalRiskCounts < 5) {
			newStatConfig.yaxis.tickAmount = _totalRiskCounts;
		} else {
			newStatConfig.yaxis.tickAmount = 4;
		}

		renderChartByData(newStatConfig);
	}

	function setDataPointsValue(dataPointArr) {
		const acc = [
			{ x: 'S', y: '' },
			{ x: 'M', y: '' },
			{ x: 'T', y: '' },
			{ x: 'W', y: '' },
			{ x: 'T', y: '' },
			{ x: 'F', y: '' },
			{ x: 'S', y: '' }
		];

		return dataPointArr.reduce(function (acc, dataPoint, index) {
			acc[index].y = dataPoint || 0;
			return acc;
		}, acc);
	}

	function load() {
		handleEvents();
		sendEventForStat();
	}

	function storageListener() {
		htmlUtil(window).on('storage', function (e) {
			sendEventForStat();
		});
	}

	return {
		load,
		storageListener
	};
})();

htmlUtil(document).ready(function () {
	statisticsViewController.load();
	statisticsViewController.storageListener();
});
