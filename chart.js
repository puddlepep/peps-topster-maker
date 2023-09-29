const chartSelector = document.getElementById('chart-selector');
const renameButton = document.getElementById('rename-chart-button');
const renameInput = document.getElementById('rename-chart-input');
const chartAddButton = document.getElementById('charts-add');
const chartRemoveButton = document.getElementById('charts-remove');

let charts = []
let selectedChart = 0;

// gets the current chart
function getChart() {
    return charts[selectedChart];
}

function selectChart(idx, save=true) {
    if (idx >= charts.length) idx = charts.length - 1; 
    if (idx < 0) idx = 0;

    selectedChart = idx;
    chartSelector.selectedIndex = selectedChart;
    let chart = getChart();
    if (!chart) return;

    // update main settings
    for (let [key, setting] of Object.entries(settings)) {
        setting.setAll(chart.settings[setting.name]);
    }

    if (save) localStorage['selectedChart'] = selectedChart;
}

function reloadChartList() {
    chartSelector.innerHTML = '';
    
    for (let i = 0; i < charts.length; i++) {
        let option = document.createElement('option');
        option.text = charts[i].name;
        chartSelector.insertAdjacentElement('beforeend', option);
    }
}

function addChart(name = 'new chart!', cacheID = null, ignoreOrder = false) {

    let newChart = {
        name: name,
        covers: {},
        settings: getDefaultInputs(),
        cacheID: cacheID,
    }
    if (cacheID == null) {
        newChart.cacheID = getRandomCacheID();
        cacheChart(newChart);
    }
    charts.push(newChart);
    if (!ignoreOrder) cacheOrders();

    reloadChartList();
    resizeCanvas();
    return newChart;
}

// removes a chart
function removeChart(idx) {
    delete localStorage[charts[idx].cacheID];

    for (let [pos, cover] of Object.entries(charts[idx].covers)) {
        cover.img.remove();
    }
    charts.splice(idx, 1);
    cacheOrders();

    if (charts.length == 0) {
        addChart();
    }

    reloadChartList();
    resizeCanvas();
}

// rename the selected chart
function rename() {
    let name = renameInput.value;
    renameInput.value = '';
    charts[selectedChart].name = name;
    endRename();
    reloadChartList();
    selectChart(selectedChart);
}

// toggle rename mode
function beginRename() {
    renameButton.style.display = 'none';
    renameInput.style.display = 'inline';
    renameInput.focus();
}
function endRename() {
    renameButton.style.display = 'inline';
    renameInput.style.display = 'none';
    renameInput.value = '';
}

renameButton.addEventListener('click', beginRename);
renameInput.addEventListener('keydown', e => { if (e.key == 'Enter') { rename(); } });
renameInput.addEventListener('focusout', endRename);
chartSelector.addEventListener('input', () => { selectChart(chartSelector.selectedIndex); } );

chartAddButton.addEventListener('click', () => { 
    addChart(); 
    selectChart(charts.length - 1);
});

chartRemoveButton.addEventListener('click', () => {
    removeChart(selectedChart);
    selectChart(selectedChart);
});