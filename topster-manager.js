
let searchAlbums = []
let draggingAlbum = null;

// topster canvas
const canvas = document.getElementById("topster-canvas");

// create an album object with info
function createAlbum(artist, title, art, rank = -1) {

    let img = document.createElement("img");
    img.classList.add("select-disable");
    img.src = art;
    img.width = 100;
    img.height = 100;
    img.draggable = false;
    img.crossOrigin = "anonymous";
    img.addEventListener("load", e => { drawTopster(); });

    let album = {
        artist: artist,
        title: title,
        art: art,
        rank: rank,
        img: img,
    };
    return album;
}

// on enter, begin search for albums, and
// populate search grid with albums
const searchGrid = document.getElementById("search-grid");
const searchInput = document.getElementById("search-input");
searchInput.addEventListener("keydown", function(event) {
    if (event.key == "Enter") {
        searchInput.disabled = true;

        searchLastFM(searchInput.value).then(albumsFound => {

            // remove previous searches
            for (let album of searchAlbums) {
                album.img.remove();
            }
            searchAlbums = [];

            // add all new albums to searchAlbums
            for (let album of albumsFound) {

                let cover = album.image[album.image.length - 1]["#text"];
                let newAlbum = createAlbum(album.artist, album.name, cover);
                searchGrid.insertAdjacentElement("beforeend", newAlbum.img);

                newAlbum.img.onmousedown = function(event) {
                    beginDrag(newAlbum, event.clientX, event.clientY);
                }
                newAlbum.img.ontouchstart = function(event) {
                    beginDrag(newAlbum, event.touches[0].clientX, event.touches[0].clientY);
                }
                searchAlbums.push(newAlbum);
            }

            searchInput.disabled = false;
        });
    }
});

// cover dragging
function beginDrag(album, x, y) {

    let size = settings.coverSize.inputs[0].get() / canvasScaleY;

    draggingAlbum = {...album};
    draggingAlbum.img = album.img.cloneNode();
    draggingAlbum.img.classList.add("dragging-album");
    draggingAlbum.img.width = size;
    draggingAlbum.img.height = size;
    draggingAlbum.img.style.display = "block";
    
    draggingAlbum.img.remove();
    document.body.insertAdjacentElement("beforeend", draggingAlbum.img);

    draggingAlbum.img.style.left = x - (size/2.0) +"px";
    draggingAlbum.img.style.top = y - (size/2.0) +"px";

    draggingAlbum.redraw = function(event) {
        drawTopster();
    }
    draggingAlbum.onMove = function(event) {
        let x, y = 0;
        if (event.type == "mousemove") {
            x = event.clientX;
            y = event.clientY;
        }
        else if (event.type == "touchmove") {
            x = event.changedTouches[0].clientX;
            y = event.changedTouches[0].clientY;
        }

        draggingAlbum.img.style.left = (x - (size / 2.0)) + "px";
        draggingAlbum.img.style.top = (y - (size / 2.0)) + "px";
    }
    draggingAlbum.onUp = function(event) {
        document.removeEventListener("mouseup", draggingAlbum.onUp);
        document.removeEventListener("touchend", draggingAlbum.onUp);
        document.removeEventListener("mousemove", draggingAlbum.onMove);
        document.removeEventListener("touchmove", draggingAlbum.onMove);
        draggingAlbum.img.style.display = "none";
        drawTopster(draggingAlbum);
        draggingAlbum = null;
        previousPosition = null;
    }
    document.addEventListener("mousemove", draggingAlbum.onMove);
    document.addEventListener("touchmove", draggingAlbum.onMove);
    document.addEventListener("mouseup", draggingAlbum.onUp);
    document.addEventListener("touchend", draggingAlbum.onUp);
}

// track mouse position for cover placement
let mousePosition = {"x": 0, "y": 0}
function moveMouse(event) {
    if (event.type == "mousemove" || event.type == "mousedown") {
        mousePosition.x = event.clientX;
        mousePosition.y = event.clientY;
    }
    else if (event.type == "touchmove" || event.type == "touchstart") {
        mousePosition.x = event.touches[0].clientX;
        mousePosition.y = event.touches[0].clientY;
    }
}
document.addEventListener("mousemove", moveMouse);
document.addEventListener("touchmove", moveMouse);

// handle clicking on the canvas
let mouseDown = false;
let previousPosition = null; // if dragging an already-placed cover
function topsterClick(event) {
    moveMouse(event);
    mouseDown = true;
    drawTopster();
    mouseDown = false;
}
canvas.addEventListener("mousedown", topsterClick);
canvas.addEventListener("touchstart", topsterClick);

function updateRanks() {
    let rank = 1;
    for (let y = 0; y < settings.gridSize.inputs[1].get(); y++) {
        for (let x = 0; x < settings.gridSize.inputs[0].get(); x++) {
            if (getChart().covers[x + "-" + y]) {
               getChart().covers[x + "-" + y].rank = rank;
               rank++; 
            }
        }
    }
}

// draw the topster
function drawTopster(newAlbum = null) {
    if (!getChart()) { return; }

    const ctx = canvas.getContext("2d");

    const width = settings.gridSize.inputs[0].get();
    const height = settings.gridSize.inputs[1].get();
    const coverSize = settings.coverSize.inputs[0].get();
    const coverSeparation = settings.coverSeparation.inputs[0].get();
    const resolutionX = Number(settings.resolution.inputs[0].get());
    const resolutionY = Number(settings.resolution.inputs[1].get());
    const offsetX = Number(settings.offset.inputs[0].get());
    const offsetY = Number(settings.offset.inputs[1].get());
    const fontSize = settings.fontSize.inputs[0].get();
    const font = settings.font.inputs[0].get();
    const fontType = settings.font.inputs[1].get();
    
    let textFormat = settings.textFormat.inputs[0].get();
    if (textFormat == "") {
        textFormat = "{rank}. {artist} - {title}";
    }

    const backgroundColor = settings.background.inputs[1].get();
    const emptyCoverColor = settings.emptyCoverColor.inputs[0].get();
    const textSeparation = settings.textSeparation.inputs[0].get();
    const textVisibility = settings.fontSize.inputs[1].get() == "shown";
    const textColor = settings.textColor.inputs[0].get();

    if (canvas.width != resolutionX || canvas.height != resolutionY) {
        canvas.width = resolutionX;
        canvas.height = resolutionY;
    }

    const gridWidth = coverSize * width + coverSeparation * width;
    const gridHeight = coverSize * height + coverSeparation * height;

    let rect = canvas.getBoundingClientRect();
    canvasScaleX = canvas.width / rect.width;
    canvasScaleY = canvas.height / rect.height;

    let newMpX = (mousePosition.x - rect.x) * canvasScaleX;
    let newMpY = (mousePosition.y - rect.y) * canvasScaleY;

    function getCoverPos(x, y) {
        return x + "-" + y;
    } 

    function processCover(x, y) {
        
        let coverPos = getCoverPos(x, y);

        function placePushedCover(x, y) {
            let pushedCoverPos = getCoverPos(x, y);

            let pushedCover = getChart().covers[pushedCoverPos];
            getChart().covers[pushedCoverPos] = newAlbum;

            newAlbum = pushedCover;
            if (newAlbum) {

                let prevPosIdx = (previousPosition.y * height) + previousPosition.x;
                let curPosIdx = (y * height) + x;

                if (curPosIdx < prevPosIdx) {
                    if (x+1 < width) {
                        placePushedCover(x+1, y);
                        drawCover(x+1, y);
                    }
                    else if (y+1 < height){
                        placePushedCover(0, y+1);
                        drawCover(0, y+1);
                    }
                }
                else {
                    if (x-1 >= 0) {
                        placePushedCover(x-1, y);
                        drawCover(x-1, y);
                    }
                    else if (y-1 >= 0) {
                        placePushedCover(width-1, y-1);
                        drawCover(width-1, y-1);
                    }
                }
            }
        }

        let rect = {
            "x": (resolutionX / 2.0) + x*coverSize + x*coverSeparation - (gridWidth / 2.0) - (longestString / 2.0) - (textSeparation * Number(textVisibility)) + offsetX, 
            "y": (resolutionY / 2.0) + y*coverSize + y*coverSeparation - (gridHeight / 2.0) + offsetY, 
            "w": coverSize + coverSeparation,
            "h": coverSize + coverSeparation
        }

        if (newMpX > rect.x && newMpX < rect.x + rect.w &&
            newMpY > rect.y && newMpY < rect.y + rect.h) {   
                
                if (newAlbum) {
                    if (getChart().covers[coverPos]) {

                        let overlapBehavior = settings.overlapBehavior.inputs[0].get();
                        if (!previousPosition) {
                            overlapBehavior = "replace";
                        }

                        switch (overlapBehavior) {
                            case "push":
                                placePushedCover(x, y);
                                break;
                            
                            case "swap":
                                let overlappedImg = getChart().covers[coverPos];
                                getChart().covers[getCoverPos(previousPosition.x, previousPosition.y)] = overlappedImg;
                                drawCover(previousPosition.x, previousPosition.y);
                                getChart().covers[coverPos] = newAlbum;
                                break;
                        
                            case "replace":
                                getChart().covers[coverPos].img.remove()
                                delete getChart().covers[coverPos]

                                getChart().covers[coverPos] = newAlbum;
                                break;
                        }
                    }
                    else {
                        getChart().covers[coverPos] = newAlbum;
                    }

                    newAlbum = null;
                    requireRedraw = true;
                    updateRanks();
                    cacheChart(getChart());
                }
                else if (mouseDown && getChart().covers[coverPos] && draggingAlbum == null) {
                    beginDrag(getChart().covers[coverPos], mousePosition.x, mousePosition.y);
                    delete getChart().covers[coverPos];
                    previousPosition = {"x": x, "y": y};
                    requireRedraw = true;
                    updateRanks();
                }
        }
    }

    function drawCover(x, y) {
        let rect = {
            "x": (resolutionX / 2.0) + x*coverSize + x*coverSeparation - (gridWidth / 2.0) + (coverSeparation / 2.0) - (longestString / 2.0) - (textSeparation * Number(textVisibility)) + offsetX, 
            "y": (resolutionY / 2.0) + y*coverSize + y*coverSeparation - (gridHeight / 2.0) + (coverSeparation / 2.0) + offsetY, 
            "w": coverSize,
            "h": coverSize
        }

        let coverPos = getCoverPos(x, y);
        if (getChart().covers[coverPos]) {

            let album = getChart().covers[coverPos];
            ctx.drawImage(album.img, rect.x, rect.y, rect.w, rect.h);
            
            let text = textFormat;
            text = text.replace("{rank}", album.rank);
            text = text.replace("{artist}", album.artist);
            text = text.replace("{title}", album.title);

            let textMetrics = ctx.measureText(text);
            
            let textX = resolutionX / 2.0 + (gridWidth / 2.0) - (longestString / 2.0) + textSeparation - (coverSeparation/2.0) + offsetX;
            let textY = rect.y + (coverSize * ((x+1) / width)) - (((1 / width) * coverSize) / 2.0) + (textMetrics.actualBoundingBoxAscent / 2.0);
            
            if (textVisibility) {
                ctx.fillStyle = textColor.color;
                ctx.globalAlpha = textColor.alpha;
                ctx.fillText(text, textX, textY);
                ctx.globalAlpha = 1.0;
            }
        }
        else {
            ctx.globalAlpha = emptyCoverColor.alpha;
            ctx.fillStyle = emptyCoverColor.color;
            ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
            ctx.globalAlpha = 1.0;
        }
    }

    ctx.font = `${fontType} ${fontSize}px ${font}`;
    ctx.clearRect(0,0,resolutionX, resolutionY);

    let backgroundID = getChart().backgroundID;
    let background = getChart().background;
    
    // if the chart has an assigned background id, but no background,
    // then we must load the background
    if (backgroundID && !background && imageDB) {

        let store = imageDB.transaction('images', 'readwrite').objectStore('images');
        let req = store.get(backgroundID);
        let chart = selectedChart;

        req.onsuccess = function() {
            let img = new Image;
            img.onload = function() {
                charts[chart].background = img;
                drawTopster();
            }
            img.onerror = function() {
                delete charts[chart].backgroundID;
            }
            img.src = req.result;
        }
        req.onerror = function() {
            delete charts[chart].backgroundID;
        }
    }

    // if background is loaded and the background setting is set to 'image', draw it
    if (background && settings.background.get(0) == 'image') {  

        let wrh = background.width / background.height;
        let newWidth = resolutionX;
        let newHeight = newWidth / wrh;
        if (newHeight > resolutionY) {
            newHeight = resolutionY;
            newWidth = newHeight * wrh;
        }

        ctx.drawImage(background, (resolutionX / 2.0) - (newWidth / 2.0), (resolutionY / 2.0) - (newHeight / 2.0), newWidth, newHeight);
    }

    // otherwise, fill in the back with the selected background color
    else {
        ctx.fillStyle = backgroundColor.color;
        ctx.globalAlpha = backgroundColor.alpha;
        ctx.fillRect(0, 0 , resolutionX, resolutionY);
        ctx.globalAlpha = 1.0;
    }

    // get the longest string and record it
    let longestString = 0;
    if (textVisibility) {
        for (let [p, s] of Object.entries(getChart().covers)) {

            let text = textFormat;
            text = text.replace("{rank}", s.rank);
            text = text.replace("{artist}", s.artist);
            text = text.replace("{title}", s.title);

            let width = ctx.measureText(text).width;
            if (width > longestString) {
                longestString = width;
            }
        }
    }

    let requireRedraw = false;
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            processCover(x, y);
            drawCover(x, y);
        }
    }

    // this means the album was not placed
    if (newAlbum != null) {
        newAlbum.img.remove();
        newAlbum = null;
    }

    if (requireRedraw) {
        drawTopster();
    }
}

new FontFace("Ubuntu", "url('assets/fonts/Ubuntu/Ubuntu-Regular.ttf')").load();
createDefaultSettings();
