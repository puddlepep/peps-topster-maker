const saveButton = document.getElementById("save-button");
const loadButton = document.getElementById("load-button");
const exportButton = document.getElementById("export-button");
const topsters2ImportButton = document.getElementById("topsters2-import");
let imageDB = null;

function getRandomCacheID() {
    while (true) {
        let id = 'chart:' + Math.random().toString().substring(2);
        if (!localStorage[id]) return id;
    }
}

// open topster in new tab when the export button is pressed
function exportTopster() {
    let dataURL = canvas.toDataURL("image/png");
    let link = document.createElement("a");
    link.download = "topster.png";
    link.href = dataURL;
    link.click();
    link.remove();
}

// saves a chart's data to a new chart info object
function saveChart(chart) {

    let savedChart = {
        name: chart.name,
        settings: chart.settings,
        cacheID: chart.cacheID,
        covers: {}
    };

    if (chart.backgroundID) {
        savedChart.backgroundID = chart.backgroundID;
    }

    // get covers and save them
    for (let [pos, cover] of Object.entries(chart.covers)) {
        savedChart.covers[pos] = {
            title: cover.title,
            artist: cover.artist,
            art: cover.art,
            rank: cover.rank
        };
    }

    return savedChart;
}

// loads a chart from a chart info object (returned by saveChart)
function loadChart(chart) {
    let newChart = addChart(chart.name, chart.cacheID, true);
    newChart.settings = chart.settings;

    // load covers
    for (let [pos, cover] of Object.entries(chart.covers)) {
        newChart.covers[pos] = createAlbum(cover.artist, cover.title, cover.art, cover.rank);
    }

    if (chart.backgroundID) {
        newChart.backgroundID = chart.backgroundID;
    }
    cacheChart(newChart);

    return newChart;
}

// turns a chart into a JSON string
function chartToJSON(chart) {
    let newChart = saveChart(chart);
    return JSON.stringify(newChart);
}

// combines all charts into one big JSON string.
function chartsToJSON(readable=false) {
    let newCharts = []

    for (let chart of charts) {
        let newChart = saveChart(chart);
        newChart.cacheID = null;
        newCharts.push(newChart);
    }

    if (readable) {
        return JSON.stringify(newCharts, null, 4);
    }
    else {
        return JSON.stringify(newCharts);
    }
}

// loads a chart from JSON
function JSONToChart(json) {
    let chart = JSON.parse(json);
    return loadChart(chart);
}

// loads all charts from a JSON list of charts
function JSONToCharts(json) {
    let newCharts = JSON.parse(json);
    
    for (let i = 0; i < newCharts.length; i++) {
        loadChart(newCharts[i]);
    }
    cacheOrders();
}

function clearCache() {
    for (let key of Object.keys(localStorage)) {
        delete localStorage[key];
        console.log(`deleted cache item '${key}'`);
    }
}

function cacheOrders() {
    let orders = {};
    for (let i = 0; i < charts.length; i++) {
        orders[charts[i].cacheID] = i;
    }

    localStorage['chartOrders'] = JSON.stringify(orders);
}

// save a chart to the cache
function cacheChart(chart) {
    let chartJSON = chartToJSON(chart);
    localStorage[chart.cacheID] = chartJSON;
}

// load all charts from cache
function loadCachedCharts() {
    let items = {...localStorage};

    let keys = Object.keys(items).filter(k => k.startsWith('chart:'));
    for (let k of keys) {
        JSONToChart(localStorage[k]);
    }
    let ordersJSON = localStorage['chartOrders'];
    if (ordersJSON) {
        let orders = JSON.parse(ordersJSON);
        charts.sort((a, b) => orders[a.cacheID] - orders[b.cacheID]);
    }
    reloadChartList();
    let selected = localStorage['selectedChart'];
    if (selected) selectChart(selected);
}

function saveTopster() {
    let a = document.createElement('a');
    a.href = URL.createObjectURL(
        new Blob([chartsToJSON(true)], {type:'application/text'})
    );
    a.download = 'topster.json';
    a.click();
    a.remove();
}

function loadTopster() {
    let f = document.createElement("input");
    f.type = "file";
    f.accept = "application/json";
    f.multiple = false;
    f.click()
    f.remove();

    f.onchange = function() {
        f.files[0].text().then(s => {
            JSONToCharts(s);
            drawTopster();
        })
    }
}

function importTopsters2() {
    let f = document.createElement("input");
    f.type = "file";
    f.accept = "application/json";
    f.multiple = false;
    f.click();
    f.remove();
    
    // thanks topsters3 for the help here, lol.
    // fuck topsters2
    const fileReader = new FileReader();
    fileReader.addEventListener("load", () => {
        let unshifted = atob((fileReader.result)
        .split("")
        .map(char => String.fromCharCode(char.charCodeAt(0) - 17))
        .join(""))

        let t2Data = JSON.parse(unshifted)[0];

        console.log(t2Data["cards"]);
    });
    f.onchange = function() { fileReader.readAsText(f.files[0]); }
}

// expand import functionality
const importExpand = document.getElementById("import-expand");
importExpand.addEventListener("click", function() {
    const root = document.querySelector(":root");

    if (getComputedStyle(topsters2ImportButton).display == "none") {
        topsters2ImportButton.style.display = "inline";
        root.style.setProperty("--saveload-height", "100px");
    }
    else {
        topsters2ImportButton.style.display = "none";
        root.style.setProperty("--saveload-height", "50px");
    }
});

exportButton.addEventListener("click", exportTopster);
saveButton.addEventListener("click", saveTopster);
loadButton.addEventListener("click", loadTopster);
topsters2ImportButton.addEventListener("click", importTopsters2);

window.addEventListener('load', function() {

    // load charts from cache
    // add a default chart if no cache is present
    loadCachedCharts();
    if (charts.length == 0) {
        addChart();
    }

    let cacheClearButton = document.getElementById('cache-clear')
    let dbOpenRequest = indexedDB.open('store', 1);
    dbOpenRequest.onupgradeneeded = function() {
        let db = dbOpenRequest.result;
        if (!db.objectStoreNames.contains('images')) {
            db.createObjectStore('images', {autoIncrement: true});
        }
    }
    dbOpenRequest.onsuccess = function() {
        imageDB = dbOpenRequest.result;

        let store = imageDB.transaction('images', 'readwrite').objectStore('images');

        // find and delete all orphaned images
        let getAllKeys = store.getAllKeys();
        getAllKeys.onsuccess = function() {
            cacheClearButton.innerHTML = `clear image cache? (${getAllKeys.result.length} images)`;

            for (let id of getAllKeys.result) {

                let foundID = false;
                for (let chart of charts) {
                    if (chart.backgroundID == id) {
                        foundID = true;
                    }
                }

                if (!foundID) {
                    console.log(`image ${id} unaccounted for, deleting.`);
                    store.delete(id);
                }
            }
        }

        drawTopster(); // draw topster once imageDB is loaded, so background appears
    }

    cacheClearButton.onclick = function() {
        let store = imageDB.transaction('images', 'readwrite').objectStore('images');
        let req = store.clear();

        req.onsuccess = function() {
            cacheClearButton.innerHTML = 'cleared!';
        }
    }

    resizeCanvas();
    drawTopster();
    document.body.classList.add('fade');
})
