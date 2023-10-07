const resizer = document.getElementById("resizer");
let canvasScaleX = 1;
let canvasScaleY = 1;

function beginResize(e) {
    if (e.type == "mousedown") {
        document.addEventListener("mouseup", endResize);
        document.addEventListener("mousemove", resizeSidebar);
        document.body.style.cursor = "ew-resize";
    }
    else if (e.type == "touchstart") {
        document.addEventListener("touchend", endResize);
        document.addEventListener("touchmove", resizeSidebar);
    }
}

function endResize(e) {
    if (e.type == "mouseup") {
        document.removeEventListener("mouseup", endResize);
        document.removeEventListener("mousemove", resizeSidebar);
        document.body.style.cursor = "";
    }
    else if (e.type == "touchend") {
        document.removeEventListener("touchend", endResize);
        document.removeEventListener("touchmove", resizeSidebar);
    }
}

function resizeSidebar(e) {

    let x, y = 0;
    if (e.type == "mousemove") {
        x = e.clientX;
        y = e.clientY;
    }
    else if (e.type == "touchmove") {
        x = e.changedTouches[0].clientX;
        y = e.changedTouches[0].clientY;
    }

    const sidebar = document.getElementById("sidebar");
    const main = document.getElementById("main");

    const width = window.innerWidth;
    const height = window.innerHeight;

    sidebar.style.width = x + "px";
    main.style.left = x + "px";

    resizeCanvas();
}

function resizeCanvas() {
    const sidebar = document.getElementById("sidebar");
    const main = document.getElementById("main");

    const sidebarWidth = Number(getComputedStyle(sidebar).width.replace("px",""));
    resizer.style.left = sidebarWidth - 5 + "px";
    main.style.width = window.innerWidth - sidebarWidth + "px";
    
    let rect = canvas.getBoundingClientRect();
    canvasScaleX = canvas.width / rect.width;
    canvasScaleY = canvas.height / rect.height;
    
    let realWidth = Math.floor(canvas.width / canvasScaleX);
    let realHeight = Math.floor(canvas.height / canvasScaleY);
    
    if (realHeight > window.innerHeight) {
        canvas.style.width = "auto";
        canvas.style.height = "100%";
    }
    else if (realWidth > window.innerWidth - sidebarWidth) {
        canvas.style.width = "100%";
        canvas.style.height = "auto";
    }
}

resizer.addEventListener("mousedown", beginResize);
resizer.addEventListener("touchstart", beginResize);

window.addEventListener("resize", resizeCanvas);
