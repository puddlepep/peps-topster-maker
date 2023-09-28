const resizer = document.getElementById("resizer");
let canvasScaleX = 1;
let canvasScaleY = 1;

function beginResize() {
    document.addEventListener("mouseup", endResize);
    document.addEventListener("mousemove", resizeSidebar);
    document.body.style.cursor = "ew-resize";
}

function endResize() {
    document.removeEventListener("mouseup", endResize);
    document.removeEventListener("mousemove", resizeSidebar);
    document.body.style.cursor = "";
}

function resizeSidebar(event) {
    const sidebar = document.getElementById("sidebar");
    const main = document.getElementById("main");

    const width = window.innerWidth;
    const height = window.innerHeight;

    sidebar.style.width = event.clientX + "px";
    main.style.left = event.clientX + "px";

    resizeCanvas();
}

function resizeCanvas() {
    const sidebar = document.getElementById("sidebar");
    const main = document.getElementById("main");

    const sidebarWidth = Number(getComputedStyle(sidebar).width.replace("px",""));
    resizer.style.left = sidebarWidth - 5 + "px";

    let rect = canvas.getBoundingClientRect();
    canvasScaleX = canvas.width / rect.width;
    canvasScaleY = canvas.height / rect.height;

    let realWidth = canvas.width / canvasScaleX;
    let realHeight = canvas.height / canvasScaleY;

    main.style.width = window.innerWidth - sidebarWidth + "px";
    if (realHeight > window.innerHeight) {
        canvas.style.width = "auto";
        canvas.style.height = "100%";
    }

    if (realWidth > window.innerWidth - sidebarWidth) {
        canvas.style.width = "100%";
        canvas.style.height = "auto";
    }
}

resizer.addEventListener("mousedown", beginResize);
window.addEventListener("resize", resizeCanvas);
