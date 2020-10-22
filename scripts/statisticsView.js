const statisticsViewController = (function () {
	const statisticsChartConfig = {
			height: 180,
			width: 308,
			animationEnabled: true,
			theme: 'light1',
			legend: {
				verticalAlign: 'top',
				horizontalAlign: 'left',
				fontColor: '#3F4653',
				fontSize: 11
			},
			dataPointMaxWidth: 16,
			axisX: {
				tickColor: 'transparent',
				labelFontColor: '#A9ADb7',
				labelFontSize: 10,
				lineColor: '#f3f3f3'
			},
			axisY: {
				gridThickness: 1,
				tickColor: 'transparent',
				tickLength: 1,
				gridColor: '#f3f3f3',
				labelFontColor: '#A9ADb7',
				labelFontSize: 10,
				lineColor: '#f3f3f3'
			},
			data: [
				{
					toolTipContent:
						'<p style="text-align:center;word-wrap:break-word;">{y} <br />Risky Sites Blocked</p>',
					type: 'stackedColumn',
					showInLegend: true,
					color: '#00B474',
					name: 'Risky Sites',
					dataPoints: []
				},
				{
					toolTipContent:
						'<p style="text-align:center;word-wrap:break-word;">{y} <br />Trackers Blocked</p>',
					type: 'stackedColumn',
					showInLegend: true,
					color: '#0086F0',
					name: 'Trackers',
					dataPoints: []
				}
			]
		},
		statSelectedValues = {
			type: 'all',
			duration: 7
		};
	function renderChartByData(chartConfig) {
		const chart = new CanvasJS.Chart('statisticsViewChart', chartConfig);
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
		const riskyData = risky ? setDataPointsValue(risky) : null;
		const trackerData = trackers ? setDataPointsValue(trackers) : null;

		const newStatConfig = Object.assign({}, statisticsChartConfig);

		const totalCount = (function () {
			let total = 0;
			Array.isArray(risky) &&
				risky.forEach(function (riskVal) {
					total += riskVal;
				});
			trackers &&
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
					newStatConfig.data[0].dataPoints = riskyData;
					newStatConfig.data[1].dataPoints = trackerData;

					htmlUtil('.siteBlockDesc').show().css('border-width', '1px');
					htmlUtil('.trackerBlockDesc').show();
					break;

				case 'risky':
					newStatConfig.data = [
						{
							toolTipContent: 'Risky Sites: {y}',
							type: 'column',
							showInLegend: true,
							color: '#00B474',
							name: 'Risky Sites',
							dataPoints: riskyData
						}
					];
					htmlUtil('.siteBlockDesc').show().css('border-width', '0px');
					htmlUtil('.trackerBlockDesc').hide();
					break;

				case 'track':
					newStatConfig.data = [
						{
							toolTipContent: 'Trackers: {y}',
							type: 'column',
							showInLegend: true,
							color: '#0086F0',
							name: 'Trackers',
							dataPoints: trackerData
						}
					];
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
		const dataSetObj = [
			{ y: 0, label: 'S' },
			{ y: 0, label: 'M' },
			{ y: 0, label: 'T' },
			{ y: 0, label: 'W' },
			{ y: 0, label: 'T' },
			{ y: 0, label: 'F' },
			{ y: 0, label: 'S' }
		];
		dataPointArr.map(function (dataPoint, index) {
			dataSetObj[index] = Object.assign(dataSetObj[index], {
				y: dataPoint
			});
		});
		return dataSetObj;
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
