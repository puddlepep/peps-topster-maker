const InputTypes = {
    RANGE: "RANGE",
    TEXT: "TEXT",
    DROPDOWN: "DROPDOWN",
    COLOR: "COLOR",
    SUBMIT_FILE: "SUBMIT_FILE",
    BUTTON: "BUTTON",
    NUMBER: 'NUMBER',
}

let settings = {}
let defaultInputs = {};

/*
how the settings system works:
definitions:
* setting: an object which contains a title and various inputs, all contained within a div.
* input: a single input element which allows you to interact with the topster.

charts don't save entire settings-- as that would include the divs and all.
because of this, charts only save the inputs of settings.
inside a chart:
chart {
    blahblah: ...
    settings: {
        setting1Name: [inputValue1, inputValue2],
        setting2Name: [inputValue1, inputValue2, inputValue3],
        etc ...
    }
}
settings automatically update the current selected chart's settings as they're changed.

setting format:
setting = {
    "name": name,
    "inputs" = [
        { "type": InputTypes.RANGE, "range": s, "text": t, "div": d, "get": function, "set": function },
        { "type": InputTypes.TEXT,  "text": t, "div": d, "get": function, "set": function },
    ],
    "div": div,

    "get": function(input_idx),
    "set": function(input_idx, value),
    "getAll": function(),
    "setAll": function(inputs),
}
*/

// creates a range slider alongside a text input, which are linked together.
function createRangeInput(value, min, max) {

    const container = document.createElement("div");
    container.classList.add("input-container");

    const slider = document.createElement("input");
    slider.type = "range";
    slider.value = value;
    slider.min = min;
    slider.max = max;
    
    container.insertAdjacentElement("beforeend", slider);

    const number = document.createElement("input");
    number.type = "number";
    number.maxLength = max.toString().length;
    number.value = value;
    number.style.width = 50 + "px";
    container.insertAdjacentElement("beforeend", number);

    let input = {
        type: InputTypes.RANGE,
        range: slider,
        number: number,
        div: container,

        onupdate: null,
        get: function() {
            return Number(this.number.value);
        },
        set: function(value) {
            this.number.value = value;
            this.range.value = value;

            if (this.onupdate) this.onupdate();
            drawTopster();
        }
    }

    slider.addEventListener("input", function() {
        input.set(slider.value);
    }); 

    number.addEventListener("input", function() {
        input.set(number.value);
    });
    return input;
}

// creates a dropdown input with various options
// options: array of strings
function createDropdownInput(options) {

    const container = document.createElement("div");
    container.classList.add("input-container");
    container.style.display = "inline";

    const dropdown = document.createElement("select");
    for (let optionName of options) {
        let option = document.createElement("option");
        option.innerHTML = optionName;
        dropdown.insertAdjacentElement("beforeend", option);
    }
    container.insertAdjacentElement("beforeend", dropdown);
    
    let input = {
        type: InputTypes.RANGE,
        dropdown: dropdown,
        div: container,
        
        onupdate: null,
        get: function() {
            return this.dropdown.value;
        },
        set: function(value) {
            this.dropdown.value = value;
            this.dropdown.dispatchEvent(new Event('input'));
            if (this.onupdate) this.onupdate();
            drawTopster();
        }
    }
    
    dropdown.addEventListener("change", function() {
        input.set(dropdown.value);
    });
    return input;
}

// creates a color input with a range slider for the alpha value
function createColorInput(color, alpha) {

    const container = document.createElement("div");
    container.classList.add("input-container");

    const colorInput = document.createElement("input");
    colorInput.type = "color";
    colorInput.value = color;
    colorInput.style.opacity = alpha;
    container.insertAdjacentElement("beforeend", colorInput);

    const alphaSlider = document.createElement("input");
    alphaSlider.type = "range";
    alphaSlider.min = 0;
    alphaSlider.max = 1;
    alphaSlider.step = 0.01;
    alphaSlider.value = alpha;
    container.insertAdjacentElement("beforeend", alphaSlider);

    let input = {
        type: InputTypes.COLOR,
        color: colorInput,
        alpha: alphaSlider,
        div: container,

        onupdate: null,
        get: function() {
            return {
                color: this.color.value,
                alpha: Number(this.alpha.value),
            }
        },
        set: function(value) {
            this.color.value = value.color;
            this.alpha.value = value.alpha;
            this.color.style.opacity = value.alpha;
            if (this.onupdate) this.onupdate();
            drawTopster();
        }
    }
    
    alphaSlider.addEventListener("input", function() {
        input.set({
            color: colorInput.value,
            alpha: alphaSlider.value,
        });
    });

    colorInput.addEventListener("input", function() {
        input.set({
            color: colorInput.value,
            alpha: alphaSlider.value,
        })
    })
    return input;
}

// creates a basic text input
function createTextInput(text, placeholder=null, size = null) {

    const container = document.createElement("div");
    container.classList.add("input-container");
    container.style.display = "inline";

    const textInput = document.createElement("input");
    textInput.type = "text";
    textInput.value = text;
    textInput.placeholder = placeholder;

    if (size) {
        textInput.style.width = size + "px";
    }
    container.insertAdjacentElement("beforeend", textInput);

    let input = {
        type: InputTypes.TEXT,
        text: textInput,
        div: container,

        onupdate: null,
        get: function() {
            return this.text.value;
        },
        set: function(value) {
            this.text.value = value;
            if (this.onupdate) this.onupdate();
            drawTopster();
        }
    }
    textInput.addEventListener("input", function() {
        input.set(textInput.value);
    })
    return input;
}

function createNumberInput(value, placeholder=null, size=null) {

    const container = document.createElement('div');
    container.classList.add('input-container');
    container.style.display = 'inline';

    const number = document.createElement('input');
    number.type = 'number';
    number.value = value;
    number.placeholder = placeholder;

    if (size) {
        number.style.width = size + 'px';
    }
    container.insertAdjacentElement('beforeend', number);

    let input = {
        type: InputTypes.NUMBER,
        number: number,
        div: container,

        onupdate: null,
        get: function() {
            return Number(this.number.value);
        },
        set: function(value) {
            this.number.value = value;
            if (this.onupdate) this.onupdate();
            drawTopster();
        }
    }
    number.addEventListener('input', function() {
        input.set(number.value);
    })
    return input;
}

// creates a button input that acts as a file uploader
function createSubmitFileInput(buttonLabel, acceptedFiles) {

    const container = document.createElement("div");
    container.classList.add("input-container");

    const button = document.createElement("button");
    button.innerHTML = buttonLabel;
    container.insertAdjacentElement("beforeend", button);

    let input = {
        type: InputTypes.SUBMIT_FILE,
        button: button,
        div: container,

        onupdate: null,
        onupload: function(file) { 
            console.log('uploaded file.'); 
        },
        get: function() {

        },
        set: function(value) {

        },
    }

    button.addEventListener("click", function() {
        let f = document.createElement("input");
        f.type = "file";
        f.accept = acceptedFiles;
        f.click();
        f.remove();

        f.onchange = function() {
            input.onupload(f.files[0]);
            if (input.onupdate) input.onupdate();
        }
    });
    return input;
}

function createButtonInput(buttonLabel) {

    const container = document.createElement('div');
    container.classList.add('input-container');

    const button = document.createElement('button');
    button.innerHTML = buttonLabel;
    container.insertAdjacentElement('beforeend', button);

    let input = {
        type: InputTypes.BUTTON,
        button: button,
        div: container,

        onupdate: null,
        get: function() {

        },
        set: function() {

        }
    }
    button.addEventListener('click', function() {
        drawTopster();
    });

    return input;
}

// creates a setting given a bunch of inputs and returns it.
function createSetting(name, inputs, parentContainer = null) {

    const sidebar = document.getElementById("settings-container");
    const container = document.createElement("div");
    container.classList.add("setting");

    const settingName = document.createElement("p");
    settingName.innerHTML = name;
    container.insertAdjacentElement("afterbegin", settingName);

    let setting = {
        name: name,
        inputs: inputs,
        div: container,

        get: function(idx) {
            return inputs[idx].get();
        },
        set: function(idx, value) {
            inputs[idx].set(value);
        },
        getAll: function() {

            let inputValues = [];
            for (let input of this.inputs) {
                inputValues.push(input.get());
            }
            return inputValues;
        },
        setAll: function(newInputs) {
            for (let i = 0; i < inputs.length; i++) {
                inputs[i].set(newInputs[i]);
            }
        }
    }

    // add all inputs to setting
    for (let input of inputs) {
        input.onupdate = function() {
            getChart().settings[name] = setting.getAll();
            cacheChart(getChart());
        }
        container.insertAdjacentElement("beforeend", input.div);
    }

    if (parentContainer != null) {
        parentContainer.insertAdjacentElement("beforeend", container);
    }
    else {
        sidebar.insertAdjacentElement("beforeend", container);
    }

    return setting;
}

// creates a container with a header name to store a bunch of related settings.
// returns a div.
function createSettingCategory(name) {
    const sidebar = document.getElementById("settings-container");
    const container = document.createElement("div");
    container.classList.add("setting-category");

    const categoryName = document.createElement("p");
    categoryName.innerHTML = name;
    categoryName.classList.add("setting-category");
    container.insertAdjacentElement("afterbegin", categoryName);

    sidebar.insertAdjacentElement("beforeend", container);
    return container;
}

function insertDivisor() {
    
    const sidebar = document.getElementById("settings-container");
    const divisor = document.createElement("hr");
    divisor.style.border = "none";
    divisor.style.borderTop = "4px dashed #382b38";
    divisor.style.width = "80%";

    sidebar.insertAdjacentElement("beforeend", divisor);
}

function getAllInputs() {
    let inputValues = {}

    for (let [key, setting] of Object.entries(settings)) {
        inputValues[setting.name] = setting.getAll();
    }
    return inputValues;
}

function getDefaultInputs() {
    return structuredClone(defaultInputs);
}

function createDefaultSettings() {

    settings.resolution = createSetting("resolution", [
        createNumberInput(1920, "x!", 50),
        createNumberInput(1080, "y!", 50),
    ])
    settings.resolution.inputs[0].number.addEventListener("input", function() { resizeCanvas(); });
    settings.resolution.inputs[1].number.addEventListener("input", function() { resizeCanvas(); })

    settings.offset = createSetting("offset", [
        createNumberInput(0, "x!", 50),
        createNumberInput(0, "y!", 50)
    ])

    insertDivisor();
    let covers = createSettingCategory("covers");

    settings.gridSize = createSetting("grid size", [
        createRangeInput(5, 1, 10),
        createRangeInput(5, 1, 10)
    ], covers);

    settings.coverSize = createSetting("cover size", [
        createRangeInput(100, 25, 500)
    ], covers);

    settings.coverSeparation = createSetting("cover separation", [
        createRangeInput(20, 0, 500)
    ], covers);

    settings.emptyCoverColor = createSetting("empty cover color", [
        createColorInput("#FFFFFF", 0.2)
    ], covers);

    settings.overlapBehavior = createSetting("cover move behavior", [
        createDropdownInput(["push", "swap", "replace"]),
    ], covers);

    insertDivisor();
    let text = createSettingCategory("text");

    settings.fontSize = createSetting("font size", [
        createRangeInput(14, 1, 99),
        createDropdownInput(["shown", "hidden"])
    ], text);

    settings.textFormat = createSetting("text format", [
        createTextInput("{rank}. {artist} - {title}", "e.g. {artist} - {title}")
    ], text);

    settings.textSeparation = createSetting("text separation", [
        createRangeInput(20, 0, 100)
    ], text);

    settings.font = createSetting("font", [
        createTextInput("Ubuntu", "fonts :D", 150),
        createDropdownInput(["normal", "bold", "italic"]),
    ], text);

    settings.textColor = createSetting("text color", [
        createColorInput("#FFFFFF", 1.0)
    ], text);

    insertDivisor();

    // background settings
    settings.background = createSetting("background", [
        createDropdownInput(["color", "image"]),
        createColorInput("#000000", 1.0),
        createSubmitFileInput("upload!", "image/png,image/jpeg"),
    ]);

    // toggle background modes between different dropdown options
    settings.background.inputs[2].div.style.display = "none";
    settings.background.inputs[0].dropdown.addEventListener("input", () => {
        let dd = settings.background.inputs[0].dropdown;
        if (dd.value == "color") {
            settings.background.inputs[1].div.style.display = "block";
            settings.background.inputs[2].div.style.display = "none";
        }
        else {
            settings.background.inputs[1].div.style.display = "none";
            settings.background.inputs[2].div.style.display = "block";
        }
    });

    // set the background image when pressing the button
    settings.background.image = null;
    settings.background.inputs[2].onupload = function(file) {
        const reader = new FileReader();
        reader.addEventListener("load", () => {
            storeImage(getChart(), reader.result);
        });
        reader.readAsDataURL(file);
    }
    defaultInputs = getAllInputs();
}

function storeImage(chart, dataURL) {

    let store = imageDB.transaction('images', 'readwrite').objectStore('images');
    let trans = store.add(dataURL);

    trans.onsuccess = function() {

        if (chart.backgroundID) {
            store.delete(chart.backgroundID);
            delete chart.background;
        }

        chart.backgroundID = trans.result;
        drawTopster();
    }    
}