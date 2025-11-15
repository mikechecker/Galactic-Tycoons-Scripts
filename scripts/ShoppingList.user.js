// ==UserScript==
// @name     Galactic Tycoon Shopping List
// @version  0.1.7
// @include  https://*.galactictycoons.com/*
// @updateURL https://github.com/mikechecker/Galactic-Tycoons-Scripts/raw/refs/heads/main/scripts/ShoppingList.user.js
// @downloadURL https://github.com/mikechecker/Galactic-Tycoons-Scripts/raw/refs/heads/main/scripts/ShoppingList.user.js
// @run-at document-end
// ==/UserScript==

let _iconMap = new Map();

// ShopingList class: wraps the existing ShoppingList Map, provides add/remove helpers
// and a change-event API. Instantiated as `shopingList` and replaces the global
// ShoppingList variable with a proxied Map so existing code continues to work.
class ShopingListClass {
    constructor(initialMap = new Map()) {
        this._map = initialMap;
        this._listeners = new Set();
    }

    _emitChange() {
        try {
            for (const callback of Array.from(this._listeners)) {
                try { callback(this._map); } catch (e) {
                    console.error("shoppingList listener error:", e);
                    this.removeChangeListener(callback)
                }
            }
        } catch (e) {
            console.error(e);
        }
    }

    // Register a listener; returns an unsubscribe function
    addChangeListener(callback) {
        this._listeners.add(callback);
        return () => this._listeners.delete(callback);
    }

    removeChangeListener(callback) {
        this._listeners.delete(callback);
    }

    add(Base, Ingredient, Amount, icon) {
        let baseEntry = this._map.get(Base);
        if (baseEntry === undefined) {
            this._map.set(Base, new Map());
            baseEntry = this._map.get(Base);
        }

        const mat = getMatForName(Ingredient)

        let currentAmount = baseEntry.get(mat.id);
        if (currentAmount === undefined) {
            baseEntry.set(mat.id, parseInt(Amount));
        } else {
            baseEntry.set(mat.id, parseInt(currentAmount) + parseInt(Amount));
        }

        _iconMap.set(mat.id, icon)
        this._emitChange();
        return this._map;
    }

    remove(Base, ingredientId, Amount) {
        let baseEntry = this._map.get(Base);
        if (baseEntry === undefined) return this._map;

        let ingredientEntry = baseEntry.get(ingredientId);
        if (ingredientEntry === undefined) return this._map;

        let currentAmount = parseInt(ingredientEntry) - parseInt(Amount);
        if (currentAmount <= 0) {
            baseEntry.delete(ingredientId);
            if (baseEntry.size === 0) this._map.delete(Base);
        } else {
            baseEntry.set(ingredientId, currentAmount);
        }

        if (baseEntry.size === 0) this._map.delete(Base);

        this._emitChange();
        return this._map;
    }

    removeWholeIngredient(ingredientId) {
        for (let [Key, Value] of Array.from(this._map.entries())) {
            if (Value.has(ingredientId)) {
                let baseEntry = this._map.get(Key);
                baseEntry.delete(ingredientId);
                if (baseEntry.size === 0) {
                    this._map.delete(Key);
                }
            }
        }
        this._emitChange();
        return this._map;
    }

    clear() {
        this._map.clear();
        this._emitChange();
        return this._map;
    }

    toMap() {
        return this._map;
    }

    totalIngredients() {
        const totals = new Map();
        for (const [, ingredients] of this._map.entries()) {
            for (const [ingredient, amount] of ingredients.entries()) {
                const n = parseInt(amount) || 0;
                totals.set(ingredient, (totals.get(ingredient) || 0) + n);
            }
        }
        return totals;
    }

    // Map-like helpers so existing code that uses ShoppingList as a Map still works
    get(key) { return this._map.get(key); }
    set(key, value) { const res = this._map.set(key, value); this._emitChange(); return res; }
    delete(key) { const res = this._map.delete(key); this._emitChange(); return res; }
    entries() { return Array.from(this._map.entries()); }
    forEach(cb) { return this._map.forEach((v, k) => cb(v, k, this._map)); }
    get size() { return this._map.size; }

}

//--- constants --
const shoppingListId = "shoppingList"

const shoppingList = new ShopingListClass()

let filterExchangeList = false

let shouldUpdate = true

const config = { attributes: false, childList: true, subtree: true };
const callback = (mutationList, observer) => {
    if (shouldUpdate) {
        UpdateShoppingListDiv()
        UpdateButtons()
        shouldUpdate = false
    }
    setTimeout(() => {
        shouldUpdate = true
    }, 10)
};

const observer = new MutationObserver(callback);
observer.observe(document.body, config);

//----------------------------------------------------------------------------------------------------------
async function UpdateButtons() {
    const SummaryDiv = document.getElementsByClassName("user-select-none p-2 px-3")
    if (SummaryDiv && SummaryDiv.length > 0) {
        if (SummaryDiv[0].textContent.includes("Daily Production")) {
            UpdateProductionButtons()
        }
    }

    const InputCol = document.getElementsByClassName("table table-hover align-middle text-end mb-1")
    if (InputCol && InputCol.length > 0) {
        UpdateConsumptionButtons()
    }
}

//----------------------------------------------------------------------------------------------------------
function UpdateConsumptionButtons() {
    const InputCol = document.getElementsByClassName("table table-hover align-middle text-end mb-1")
    if (InputCol == undefined || InputCol.length == 0) {
        return false;
    }

    const Rows = InputCol[0].rows

    if (Rows[0].children.length <= 4) {

        let tdHeader = Rows[0].insertCell(-1)
        tdHeader.outerHTML = '<th class="col-1"  style="white-space: nowrap !important">Shopping List</th>'
        tdHeader.className = "col-2 cursor-pointer text-nowrap"
    }

    const Base = document.getElementsByClassName("list-group-item list-group-item-action hstack active")[0].children[0].textContent

    if (Rows.length < 2) {
        return false;
    }

    for (let i = 1; i < Rows.length; i++) {
        let Row = Rows[i]

        if (Row.children.length > 4) {
            Row.removeChild(Row.children[4])
        }

        let td = Row.insertCell(-1)

        const icon = Row.cells[0].children[0].children[0].children[0].attributes[0].nodeValue
        const amount = Row.cells[2].textContent

        td.appendChild(getAddingButtons(Base, icon, amount, true));
    }

    return true
}

//----------------------------------------------------------------------------------------------------------
function UpdateProductionButtons() {
    const SummaryDiv = document.getElementsByClassName("user-select-none p-2 px-3")
    if (SummaryDiv == undefined || SummaryDiv.length == 0) {
        return false
    }

    if (SummaryDiv[0].textContent.includes("Daily Production") == false) {
        return false
    }

    const InputCol = SummaryDiv[0].parentElement.getElementsByClassName("table table-transparent table-hover mb-0")
    if (InputCol == undefined || InputCol.length == 0) {
        return false
    }

    const Rows = InputCol[0].rows

    if (Rows[0].textContent != "Input") {
        return false
    }

    const config = { attributes: false, childList: true, subtree: true };
    const callback = (mutationList, observer) => {

        for (let record of mutationList) {
            for (let addedNode of record.addedNodes) {
                if (addedNode.tagName != "TR") {
                    continue
                }

                if (addedNode.children.length > 2) {
                    addedNode.removeChild(addedNode.children[-1])
                }

                 const buttons = getAddingButtons(Base, Row, false);
                //addedNode.cells[1].remove()
                addedNode.appendChild(buttons, addedNode.cells[1]);
            }
        }
    };

    const observer = new MutationObserver(callback);
    observer.observe(InputCol[0], config);

    Rows[0].cells[0].setAttribute('colspan', "")
    let headerCell = document.createElement('th')
    headerCell.textContent = "List"
    headerCell.className = "col"
    Rows[0].appendChild(headerCell)
    const Base = document.getElementsByClassName("list-group-item list-group-item-action hstack active")[0].children[0].textContent

    if (Rows.length < 2) {
        return false;
    }

    for (let i = 1; i < Rows.length; i++) {
        let Row = Rows[i]

        if (Row.children.length > 2) {
            Row.removeChild(Row.children[-1])
        }

        const buttons = getAddingButtons(Base, Row, false);
        //Row.cells[1].remove()
        Row.appendChild(buttons, Row.cells[1]);
    }

    return true
}

//----------------------------------------------------------------------------------------------------------
function getAddingButtons(base, row, useAllButtons = false) {
    let rowElement = document.createElement('td');

    let div = document.createElement('div');
    // div.style.textAlign = "center"
    // div.style.flexWrap = "nowrap"
    // div.style.display = "inline-block"

    //let amountText = document.createElement('a');
    //amountText.className = "text-end"
    //div.appendChild(amountText)

    if (useAllButtons) {
        let dailyButton = document.createElement('input');
        dailyButton.type = "button";
        dailyButton.value = "1D"
        dailyButton.className = "btn btn-sm btn-secondary"

        dailyButton.style.verticalAlign = "middle"
        dailyButton.addEventListener('click', () => {
            const icon = row.cells[0].children[0].children[0].attributes[0].nodeValue
            let amount = row.cells[1].textContent
            amount = amount.replace(',', '')
            const ingredient = convertSVGMatToMatName(icon)
            shoppingList.add(base, ingredient, amount, icon)

        })
        div.appendChild(dailyButton)
    }

    let halfButton = document.createElement('input');
    halfButton.type = "button";
    halfButton.value = "1/2"
    halfButton.className = "btn btn-sm btn-secondary"
    halfButton.style.display = "inline-block"
    halfButton.style.verticalAlign = "middle"

    halfButton.addEventListener('click', () => {
        const icon = row.cells[0].children[0].children[0].attributes[0].nodeValue
        let amount = row.cells[1].textContent
        amount = amount.replace(',', '')
        const ingredient = convertSVGMatToMatName(icon)

        shoppingList.add(base, ingredient, Math.ceil(amount / 2), icon)
    })

    div.appendChild(halfButton)

    rowElement.appendChild(div)
    return rowElement
}

//----------------------------------------------------------------------------------------------------------
function UpdateShoppingListDiv() {
    if (document.querySelector('#' + shoppingListId)) {
        return
    }

    let SelectedView = document.getElementsByClassName("nav-link cursor-pointer py-3 active")
    if (SelectedView == undefined || SelectedView.length == 0) {
        return false
    }

    if (SelectedView[0].textContent == "Base") {
        const MainDiv = document.querySelector("main div.container-xxl > div.row:not(gy-3)")

        let Div1 = getShoppingListTable()
        shoppingList.addChangeListener(() => {
            updateShoppingList()
        })
        MainDiv.appendChild(Div1)
        updateShoppingList()
    }
    else if (SelectedView[0].textContent == "Exchange") {
        return modifyExchangeMaterialsList()
    }

    return true
}

//----------------------------------------------------------------------------------------------------------
function modifyExchangeMaterialsList() {
    const shoppingListHeader = "Shopping List"
    let materialsList = document.querySelector("div[class='row g-4'] div.card-body")
    if (!materialsList) {
        return false
    }

    let header = materialsList.querySelector("thead tr")
    if (Array.from(header.cells).find(cell => cell.textContent == shoppingListHeader))
        return false;

    filterExchangeList = false

    let inputGroup = materialsList.querySelector("div.input-group")
    if (!inputGroup) {
        return false
    }

    let filterButton = inputGroup.lastChild.cloneNode(true)

    if (filterButton.querySelector("input") == undefined) {
        return
    }

    let input = filterButton.querySelector("input")
    input.checked = false
    input.addEventListener("change", () => {
        filterExchangeList = !filterExchangeList
        updateMaterialsList()
    })

    addToolTipToElement(filterButton)

    let shopingCartDiv = createElementFromHTML('<span class="input-group-text rounded-0 border-0 px-2"><svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" class="iu">' +
        '<path d="M0 1.5A.5.5 0 0 1 .5 1H2a.5.5 0 0 1 .485.379L2.89 3H14.5a.5.5 0 0 1 .491.592l-1.5 8A.5.5 0 0 1 13 12H4a.5.5 0 0 1-.491-.408L2.01 3.607 1.61 2H.5a.5.5 0 0 1-.5-.5M3.102 4l1.313 7h8.17l1.313-7zM5 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4m7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4m-7 1a1 1 0 1 1 0 2 1 1 0 0 1 0-2m7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2"></path>' +
        '</svg></span>')
    inputGroup.appendChild(shopingCartDiv)
    inputGroup.appendChild(filterButton)

    if (header.cells.length == 3) {
        header.insertCell(1).outerHTML = `<th class="col text-end">${shoppingListHeader}</th>`
    }

    updateMaterialsList(materialsList)
    return true
}

//----------------------------------------------------------------------------------------------------------
function updateMaterialsList() {
    let materialsList = document.querySelector("div[class='row g-4'] div.card-body")
    if (!materialsList) {
        return false
    }

    const config = { attributes: false, childList: true, subtree: false };
    const callback = function (mutationList, observer) {
        for (const mutation of mutationList) {

            if (mutation.type === "childList" && mutation.addedNodes.length > 0 && mutation.addedNodes[0].cells != undefined) {
                const mat = getMatForName(mutation.addedNodes[0].cells[0].textContent) ?? undefined

                const TotalShoppingList = shoppingList.totalIngredients()

                if (filterExchangeList && TotalShoppingList.get(mat.id) == undefined) {
                    mutation.addedNodes[0].style.display = "none"
                    continue
                }
                else {
                    mutation.addedNodes[0].style.display = ""
                }

                if (mutation.addedNodes[0].cells.length > 3) {
                    mutation.addedNodes[0].cells[1].remove()
                }
                mutation.addedNodes[0].insertCell(1).textContent = mat ? TotalShoppingList.get(mat.id) ?? " " : " "
            }
        }
    };

    const observer = new MutationObserver(callback);
    let table = materialsList.querySelector("tbody")
    observer.observe(table, config);

    const updateMaterialsShopingListEntries = function () {
        let rows = materialsList.querySelectorAll("tbody tr")
        const TotalShoppingList = shoppingList.totalIngredients()

        for (let row of rows) {
            const mat = getMatForName(row.cells[0].textContent) ?? undefined
            if (filterExchangeList && TotalShoppingList.get(mat.id) == undefined) {
                row.style.display = "none"
            } else {
                row.style.display = ""
            }

            if (row.cells.length > 3) {
                row.cells[1].remove()
            }

            row.insertCell(1).textContent = mat ? TotalShoppingList.get(mat.id) ?? " " : " "
        }
    }

    updateMaterialsShopingListEntries()

    shoppingList.addChangeListener(() => {
        updateMaterialsShopingListEntries()
    });
}

//----------------------------------------------------------------------------------------------------------
function getShoppingListTable() {
    let Div1 = document.createElement('div');
    Div1.className = "col-12 col-md-2";
    Div1.id = shoppingListId
    return Div1
}

//----------------------------------------------------------------------------------------------------------
function updateShoppingList() {
    let Div1 = document.querySelector('#' + shoppingListId);
    if (Div1 == undefined) {
        return
    }

    Div1.innerHTML = '';

    let Card = document.createElement('div');
    Card.className = "card border-0 mb-4";
    Div1.appendChild(Card)

    let header = document.createElement('div');

    Card.appendChild(header)
    let CardBase = document.createElement('div');
    CardBase.className = "card-header text-body-secondary";
    CardBase.textContent = "Total"
    header.appendChild(CardBase)

    let button = document.createElement('input');
    button.type = "button";
    button.value = "Clear"
    button.className = "btn btn-sm btn-secondary"
    button.addEventListener('click', () => {
        shoppingList.clear()
    });

    header.appendChild(button)

    let CardTotalEntry = document.createElement('div');
    CardTotalEntry.className = "list-group list-group-flush";
    Card.appendChild(CardTotalEntry)

    let TotalTable = document.createElement('table');
    CardTotalEntry.appendChild(TotalTable)

    // Total Section
    const TotalShoppingList = shoppingList.entries().reduce(function (Acc, Entry) {
        for (let [Key, Value] of Entry[1]) {
            let CurrentAmount = Acc.get(Key) ?? 0
            Acc.set(Key, parseInt(Value) + parseInt(CurrentAmount));
        }
        return Acc;
    }, new Map());

    TotalShoppingList.forEach((Amount, Ingredient) => {
        var tr = TotalTable.insertRow();
        let tdIngredient = tr.insertCell();

        tdIngredient.appendChild(GetIngredientImage(Ingredient));

        let tdAmount = tr.insertCell();
        tdAmount.appendChild(document.createTextNode(Amount));

        let button = document.createElement('input');
        button.type = "button";
        button.value = "-"
        button.className = "btn btn-sm btn-secondary"
        button.addEventListener('click', function () { shoppingList.removeWholeIngredient(Ingredient) });

        let tdRemove = tr.insertCell();
        tdRemove.appendChild(button);
    })

    if (getSelectedPage == pageEnum.Exchange) {
        return Div1
    }

    // for each base
    shoppingList.forEach((BaseValue, Base) => {
        let CardBase = document.createElement('div');
        CardBase.className = "card-header text-body-secondary";
        CardBase.textContent = Base
        Card.appendChild(CardBase)

        let button = document.createElement('input');
        button.type = "button";
        button.value = "Clear"
        button.className = "btn btn-sm btn-secondary"
        button.addEventListener('click', () => {
            shoppingList.set(Base, new Map())
            UpdateShoppingListDiv()
        });
        Card.appendChild(button)

        let CardBaseEntry = document.createElement('div');
        CardBaseEntry.className = "list-group list-group-flush";
        Card.appendChild(CardBaseEntry)

        let Table = document.createElement('table');

        BaseValue.forEach((Amount, Ingredient, map) => {
            var tr = Table.insertRow();

            let tdIngredient = tr.insertCell();
            tdIngredient.appendChild(GetIngredientImage(Ingredient));

            let tdAmount = tr.insertCell();
            tdAmount.appendChild(document.createTextNode(Amount));

            let button = document.createElement('input');
            button.type = "button";
            button.value = "-"
            button.className = "btn btn-sm btn-secondary"
            button.addEventListener('click', function () { shoppingList.remove(Base, Ingredient, Amount) });

            let tdRemove = tr.insertCell();
            tdRemove.appendChild(button);
        })

        CardBaseEntry.appendChild(Table)
    })
}

//----------------------------------------------------------------------------------------------------------
function GetIngredientImage(Ingredient) {
    const iconString = _iconMap.get(Ingredient)
    let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    let use = document.createElementNS("http://www.w3.org/2000/svg", "use");

    svg.setAttribute("width", "24");
    svg.setAttribute("height", "24");
    use.setAttribute("href", iconString);

    svg.appendChild(use);
    svg.className = "io ai-st flex-shrink-0 me-2";

    return svg
}

//----------------------------------------------------------------------------------------------------------
function convertSVGMatToMatName(svgName) {
    console.assert(svgName.includes('#'), `Illegial svgName: ${svgName}`)
    let result = svgName.split("#")[1]

    // handle special cases
    if (result == 'ReinforcedTruss')
        return "Truss"

    result = result.replace("Basic", '')
    result = result.replace("Bar", '')
    result = result.match(/[A-Z][a-z]+/g).join(" ")
    result = result.trim()
    return result
}

//------------------------------------------------------------------------------------------------------
// Tooltip
//------------------------------------------------------------------------------------------------------

let tooltipDiv
document.addEventListener('DOMContentLoaded', (event) => {
    var div = document.createElement('div');
    div.innerHTML = `<div class="tooltip bs-tooltip-auto fade show" role="tooltip" style="position: absolute; inset: auto auto 0px 0px; margin: 0px;" data-popper-placement="top">` +
        '<div class="tooltip-arrow" style="position: absolute; left: 0px; transform: translate(25px);">' +
        `</div><div class="tooltip-inner">tooltip</div></div>`.trim();

    tooltipDiv = div.firstChild;
    tooltipDiv.style.display = "none";
    document.body.appendChild(tooltipDiv);
})

//----------------------------------------------------------------------------------------------------------
function addToolTipToElement(elem) {
    elem.addEventListener("mouseover", function () {
        const rect = elem.getBoundingClientRect();
        CreateTooltip("Filter materials that are in the shopping list", rect.left + window.scrollX, rect.top + window.scrollY);
    });

    elem.addEventListener("mouseout", function () {
        tooltipDiv.style.display = "none";
    });
}

//----------------------------------------------------------------------------------------------------------
function CreateTooltip(text, posX, posY) {
    tooltipDiv.querySelector('.tooltip-inner').textContent = text
    tooltipDiv.style.transform = `translate(${posX}px, ${posY - document.body.getBoundingClientRect().height - tooltipDiv.getBoundingClientRect().height * 0.8}px)`
    tooltipDiv.style.display = "block";
}

//----------------------------------------------------------------------------------------------------------
function HideTooltip() {
    tooltipDiv.style.display = "none";
}

//------------------------------------------------------------------------------------------------------
// Utils
//------------------------------------------------------------------------------------------------------
let gameData
setTimeout(async function () {
    const gameDataResponse = await fetch('https://api.g2.galactictycoons.com/gamedata.json', {
        method: 'GET'
    });

    gameData = await gameDataResponse.json()
}, 10)

//----------------------------------------------------------------------------------------------------------
function findBuildingFromName(name) {
    const exactEntry = gameData.buildings.find((element) => element.name == name)

    if (exactEntry)
        return exactEntry
    return gameData.materials.find((element) => element.name.includes(name))
}

//----------------------------------------------------------------------------------------------------------
function getMatForName(matName) {
    const name = matName.trim()
    const exactEntry = gameData.materials.find((element) => element.name == name || element.sName == matName)

    if (exactEntry)
        return exactEntry
    const fuzzyResult = gameData.materials.find((element) => element.name.includes(name) || element.sName.includes(name))

    console.assert(fuzzyResult, `Could not find material: ${matName}`)
    if (fuzzyResult) {
        return fuzzyResult
    }
}

//----------------------------------------------------------------------------------------------------------
function createElementFromHTML(htmlString) {
    var div = document.createElement('div');
    div.innerHTML = htmlString.trim();
    return div.firstChild;
}

//----------------------------------------------------------------------------------------------------------
const pageEnum =
{
    Exchange: "Exchange",
    Base: "Base",
}

//----------------------------------------------------------------------------------------------------------
function getSelectedPage() {
    const selectedPage = document.querySelector("a.nav-link.cursor-pointer.py-3.active span.ms-1").textContent
    return selectedPage
}



