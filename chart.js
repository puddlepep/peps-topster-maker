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

function selectChart(idx) {
    if (idx >= charts.length) idx = charts.length - 1; 
    if (idx < 0) idx = 0;

    selectedChart = idx;
    chartSelector.selectedIndex = selectedChart;
    let chart = getChart();

    // update main settings
    for (let [key, setting] of Object.entries(settings)) {
        setting.setAll(chart.settings[setting.name]);
    }
}

// update the selector list
function updateSelectorOptions() {
    chartSelector.innerHTML = '';

    for (let chart of charts) {
        let option = document.createElement('option');
        option.text = chart.name;
        chartSelector.insertAdjacentElement('beforeend', option);
    }
    selectChart(selectedChart);
}

function addChart(name = 'new chart!') {

    let newChart = {
        name: name,
        covers: {},
        settings: getDefaultInputs(),
    }
    charts.push(newChart);

    updateSelectorOptions();
    return newChart;
}

// removes a chart
function removeChart(idx) {
    for (let [pos, cover] of Object.entries(charts[idx].covers)) {
        cover.img.remove();
    }

    charts.splice(idx, 1);

    if (charts.length == 0) {
        addChart();
    }
    updateSelectorOptions();
}

// rename the selected chart
function rename() {
    let name = renameInput.value;
    renameInput.value = '';
    charts[selectedChart].name = name;
    endRename();
    updateSelectorOptions();
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
});