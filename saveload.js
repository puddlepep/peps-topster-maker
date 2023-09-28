const saveButton = document.getElementById("save-button");
const loadButton = document.getElementById("load-button");
const exportButton = document.getElementById("export-button");
const topsters2ImportButton = document.getElementById("topsters2-import");
let imageDB = null;

// open topster in new tab when the export button is pressed
function exportTopster() {
    let dataURL = canvas.toDataURL("image/png");
    let link = document.createElement("a");
    link.download = "topster.png";
    link.href = dataURL;
    link.click();
    link.remove();
}

// stringify the charts variable
function chartsToJSON() {
    let saveData = {
        charts: []
    }

    for (let chart of charts) {

        let savedChart = {
            name: chart.name,
            settings: chart.settings,
            covers: {},
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
                rank: cover.rank,
            }
        }
        saveData.charts.push(savedChart);
    }

    return JSON.stringify(saveData, null, 4);
}

function JSONToCharts(json) {
    let loadData = JSON.parse(json);

    for (let chart of loadData.charts) {
        let newChart = addChart(chart.name);
        newChart.settings = chart.settings;

        // load covers
        for (let [pos, cover] of Object.entries(chart.covers)) {
            newChart.covers[pos] = createAlbum(cover.artist, cover.title, cover.art, cover.rank);
        }

        if (chart.backgroundID) {
            newChart.backgroundID = chart.backgroundID;
        }
    }
    selectChart(selectedChart);
}

function saveTopster() {
    let a = document.createElement('a');
    a.href = URL.createObjectURL(
        new Blob([chartsToJSON()], {type:'application/text'})
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
        console.log(f.files);

        f.files[0].text().then(s => {
            console.log(s);
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

// expand import functinality
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

window.addEventListener('beforeunload', function() {
    localStorage['charts'] = chartsToJSON();
    localStorage['selectedChart'] = selectedChart;
})

window.addEventListener('load', function() {

    if (localStorage['charts']) {
        JSONToCharts(localStorage['charts']);
        selectChart(localStorage['selectedChart']);
    }
    else {
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
})