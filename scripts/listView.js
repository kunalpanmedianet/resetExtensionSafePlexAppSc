const listViewController = (function () {
	const donutChartConfig = {
		series: [],
		chart: {
			width: '150px',
			height: '150px',
			type: 'donut'
		},
		dataLabels: {
			enabled: false
		},
		labels: ['Track Sites Data', 'Risky Sites Data'],
		legend: {
			position: 'left',
			horizontalAlign: 'top',
			offsetY: 0,
			height: 230,
			show: false
		},
		states: {
			active: {
				filter: {
					type: 'none',
					value: 0
				}
			}
		},
		plotOptions: {
			pie: {
				donut: {
					labels: {
						show: true,
						total: {
							showAlways: true,
							show: true
						},
						name: {
							show: false
						}
					}
				}
			}
		}
	};

	function getListViewDataFromStorage() {
		return {
			riskySitesData: Utils.getStorageItem(STORAGE_KEYS.riskySitesData),
			trackSitesData: Utils.getStorageItem(STORAGE_KEYS.trackSitesData)
		};
	}

	function renderChartByData() {
		const riskySitesData = getListViewDataFromStorage().riskySitesData;
		const trackSitesData = getListViewDataFromStorage().trackSitesData;

		const chartConfig = Object.assign({}, donutChartConfig);

		if (!riskySitesData && !trackSitesData) {
			chartConfig.toolTip = {
				enabled: false
			};
			// chartConfig.data[0].dataPoints.push({
			// 	text: 'No Data',
			// 	y: 100,
			// 	color: '#e6eaf0'
			// });
		} else {
			chartConfig.series.push(!!trackSitesData ? trackSitesData.length : 0);
			chartConfig.series.push(!!riskySitesData ? riskySitesData.length : 0);
		}
		const chart = new ApexCharts(
			document.querySelector('#listViewChart'),
			chartConfig
		);
		chart.render();
	}

	function greaterThan100(item) {
		if (item.length > 100) {
			return `100+`;
		} else {
			return item;
		}
	}

	function getListsArray(arr) {
		return arr.reduce(function (acc, item) {
			acc[item.url] = !!acc[item.url] ? acc[item.url] + 1 : 1;
			return acc;
		}, {});
	}

	function renderListOnView(data, id) {
		const list = Object.entries(data);
		if (list.length > 0) {
			list.forEach(function (item) {
				htmlUtil(id).append('<li>' + item[0] + '</li>');
			});
		} else {
			htmlUtil(id).append('<li>No data found</li>');
		}
	}

	function renderDataToView() {
		const tempRiskyData = getListViewDataFromStorage().riskySitesData;
		const tempTrackSitesData = getListViewDataFromStorage().trackSitesData;
		const riskySitesData = tempRiskyData ? tempRiskyData : [];
		const trackSitesData = tempTrackSitesData ? tempTrackSitesData : [];

		const riskySitesList = getListsArray(riskySitesData);
		const trackSitesList = getListsArray(trackSitesData);

		renderListOnView(riskySitesList, '#riskySitesList');
		renderListOnView(trackSitesList, '#trackSitesList');

		htmlUtil('#riskySitesData').text(
			greaterThan100(riskySitesData.length) || 0
		);
		htmlUtil('#trackSitesData').text(
			greaterThan100(trackSitesData.length) || 0
		);
	}

	function handleEvents() {
		htmlUtil('.acc-toggler').on('click', function () {
			htmlUtil(this).parent().find('.acc-body').slideToggle();
			htmlUtil(this).parent().toggleClass('active');
		});
	}

	function load() {
		handleEvents();
		renderChartByData();
		renderDataToView();
	}

	return {
		load
	};
})();

htmlUtil(document).ready(function () {
	listViewController.load();
});
