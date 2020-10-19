const statisticsViewController = (function () {
    const statisticsChartConfig = {
            height: 180,
            width: 308,
            animationEnabled: false,
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
                // maximum: 16,
                // interval: 4
            },
            data: [
                {
                    toolTipContent: 'Risky Sites: {y}',
                    type: 'stackedColumn',
                    showInLegend: true,
                    color: '#00B474',
                    name: 'Risky Sites',
                    dataPoints: []
                },
                {
                    toolTipContent: 'Trackers: {y}',
                    type: 'stackedColumn',
                    showInLegend: true,
                    color: '#0086F0',
                    name: 'Trackers',
                    dataPoints: []
                }
            ]
        },
        statSelectedValues = Object.assign(
            {},
            {
                type: 'all',
                duration: 7
            }
        );

    function renderChartByData(chartConfig) {
        const chart = new CanvasJS.Chart('statisticsViewChart', chartConfig);
        chart.render();
    }

    function handleEvents() {
        htmlUtil(document).on('statisticsData', function (e) {
            var tepData = e.detail.statisticsData;
            if (
                tepData &&
                (tepData.hasOwnProperty('risky') ||
                    tepData.hasOwnProperty('track'))
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
            var statDur = e.currentTarget.value;
            if (!!statDur) {
                statSelectedValues.duration = statDur;
                sendEventForStat();
            }
        });
    }

    function sendEventForStat() {
        var type = statSelectedValues.type,
            duration = statSelectedValues.duration;
        document.dispatchEvent(
            new CustomEvent('getStatisticsData', {
                detail: {
                    type: type, // all, risky, track
                    duration: duration // 7, 28
                }
            })
        );
    }

    function renderStatChart(statisticsData) {
        var trackers = statisticsData.track,
            risky = statisticsData.risky;
        var riskydata = risky ? setDataPointsValue(risky) : [],
            trackerData = trackers ? setDataPointsValue(trackers) : [];

        var newStatConfig = Object.assign({}, statisticsChartConfig);

        if (statSelectedValues) {
            switch (statSelectedValues.type) {
                case 'all':
                    newStatConfig.data[0].dataPoints = riskydata.filter(
                        function (temp) {
                            return temp;
                        }
                    );
                    newStatConfig.data[1].dataPoints = trackerData.filter(
                        function (temp) {
                            return temp;
                        }
                    );
                    break;

                case 'risky':
                    newStatConfig.data = [
                        {
                            toolTipContent: 'Risky Sites: {y}',
                            type: 'column',
                            showInLegend: true,
                            color: '#00B474',
                            name: 'Risky Sites',
                            dataPoints: riskydata
                        }
                    ];
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
                    break;

                default:
                    break;
            }
        }

        renderChartByData(newStatConfig);
    }

    function setDataPointsValue(dataPointArr) {
        var dataSetObj = [
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
