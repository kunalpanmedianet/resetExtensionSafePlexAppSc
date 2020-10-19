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
                dataPoints: [
                    { y: 3, label: 'S' },
                    { y: 2, label: 'M' },
                    { y: 6, label: 'T' },
                    { y: 4, label: 'W' },
                    { y: 5, label: 'T' },
                    { y: 8, label: 'F' },
                    { y: 1, label: 'S' }
                ]
            },
            {
                toolTipContent: 'Trackers: {y}',
                type: 'stackedColumn',
                showInLegend: true,
                color: '#0086F0',
                name: 'Trackers',
                dataPoints: [
                    { y: 4, label: 'S' },
                    { y: 2, label: 'M' },
                    { y: 3, label: 'T' },
                    { y: 2, label: 'W' },
                    { y: 0, label: 'T' },
                    { y: 5, label: 'F' },
                    { y: 7, label: 'S' }
                ]
            }
        ]
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

        const chartConfig = Object.assign({}, statisticsChartConfig);
        // chartConfig.data[0].dataPoints.push({
        //     text: 'Risky Sites Data',
        //     y: !!riskySitesData ? riskySitesData.length : 0,
        //     color: '#00b350'
        // });
        // chartConfig.data[0].dataPoints.push({
        //     text: 'Track Sites Data',
        //     y: !!trackSitesData ? trackSitesData.length : 0,
        //     color: '#0086f0'
        // });

        const chart = new CanvasJS.Chart('statisticsViewChart', chartConfig);
        chart.render();
    }

    function handleEvents() {
        htmlUtil('#statisticsType').on('change', function (e) {
            console.log(e.currentTarget.value);
        });
        htmlUtil('#statisticsDayWise').on('change', function (e) {
            console.log(e.currentTarget.value);
        });
    }

    // function setDataPointsValue(dataPointArr, dpType) {
    // if (dpType == 'rs') {
    //     var dataSetObj = [
    //             { y: 3, label: 'S' },
    //             { y: 2, label: 'M' },
    //             { y: 6, label: 'T' },
    //             { y: 4, label: 'W' },
    //             { y: 5, label: 'T' },
    //             { y: 8, label: 'F' },
    //             { y: 1, label: 'S' }
    //         ];
    //     statisticsChartConfig.data[0].dataPoints = dataPointArr.map(function (dataPoint) {
    //         dataSetObj;
    //     });
    // } else if (dpType == 't') {
    //     statisticsChartConfig.data[1];
    // }
    // }

    function load() {
        handleEvents();
        renderChartByData();
    }

    return {
        load
    };
})();

htmlUtil(document).ready(function () {
    statisticsViewController.load();
});
