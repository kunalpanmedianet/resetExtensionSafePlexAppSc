const statisticsViewController = (function () {
    const statisticsChartConfig = {
        height: 150,
        width: 308,
        animationEnabled: false,
        theme: 'light1',
        legend: {
            verticalAlign: 'top',
            horizontalAlign: 'left',
            fontColor: '#3F4653',
            fontSize: 10
        },
        dataPointWidth: 16,
        axisX: {
            labelFontColor: '#A9ADb7'
        },
        axisY: {
            labelFontColor: '#A9ADb7'
        },
        data: [
            {
                toolTipContent: 'Risky Sites: {y}',
                type: 'stackedColumn',
                showInLegend: true,
                color: '#00B474',
                name: 'Risky Sites',
                dataPoints: [
                    { y: 10, label: 'S' },
                    { y: 20, label: 'M' },
                    { y: 30, label: 'T' },
                    { y: 10, label: 'W' },
                    { y: 35, label: 'T' },
                    { y: 15, label: 'F' },
                    { y: 25, label: 'S' }
                ]
            },
            {
                toolTipContent: 'Trackers: {y}',
                type: 'stackedColumn',
                showInLegend: true,
                color: '#0086F0',
                name: 'Trackers',
                dataPoints: [
                    { y: 34, label: 'S' },
                    { y: 22, label: 'M' },
                    { y: 23, label: 'T' },
                    { y: 12, label: 'W' },
                    { y: 10, label: 'T' },
                    { y: 25, label: 'F' },
                    { y: 17, label: 'S' }
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
        Object.entries(data).forEach(function (item) {
            htmlUtil(id).append('<li>' + item[0] + '</li>');
        });
    }

    // function renderDataToView() {
    //     const tempRiskyData = getListViewDataFromStorage().riskySitesData,
    //         tempTrackSitesData = getListViewDataFromStorage().trackSitesData;
    //     const riskySitesData = tempRiskyData ? tempRiskyData : [];
    //     const trackSitesData = tempTrackSitesData ? tempTrackSitesData : [];

    //     const riskySitesList = getListsArray(riskySitesData);
    //     const trackSitesList = getListsArray(trackSitesData);

    //     if (Object.keys(riskySitesList).length > 0) {
    //         renderListOnView(riskySitesList, '#riskySitesList');
    //     }

    //     if (Object.keys(trackSitesList).length > 0) {
    //         renderListOnView(trackSitesList, '#trackSitesList');
    //     }

    //     htmlUtil('#riskySitesData').text(
    //         greaterThan100(riskySitesData.length) || 0
    //     );
    //     htmlUtil('#trackSitesData').text(
    //         greaterThan100(trackSitesData.length) || 0
    //     );
    // }

    // function handleEvents() {
    //     htmlUtil('.acc-toggler').on('click', function () {
    //         htmlUtil(this).parent().find('.acc-body').slideToggle();
    //     });
    // }

    function load() {
        // handleEvents();
        renderChartByData();
        // renderDataToView();
    }

    return {
        load
    };
})();

htmlUtil(document).ready(function () {
    statisticsViewController.load();
});
