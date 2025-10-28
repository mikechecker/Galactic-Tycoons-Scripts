// ==UserScript==
// @name     Galactic Tycoon Shopping List
// @version  0.1
// @include  https://*.galactictycoons.com/*
// ==/UserScript==

// {Base{Ingrediented, Amount}}
let ShoppingList = new Map()

let ShoppingListInterval
let AddingButtonsListInterval

let filterExchangeList = false

setTimeout(() => {
    ShoppingListInterval = setInterval(UpdateShoppingList, 100)
    AddingButtonsListInterval = setInterval(UpdateButtons, 100)
}, 1000);

document.addEventListener('click', () => {
    if (ShoppingListInterval == undefined) {
        ShoppingListInterval = setInterval(UpdateShoppingList, 100);
    }
    if (AddingButtonsListInterval == undefined) {
        AddingButtonsListInterval = setInterval(UpdateButtons, 100);
    }

})

async function UpdateShoppingList() {
    if (UpdateShoppingListDiv()) {
        clearInterval(ShoppingListInterval);
        ShoppingListInterval = undefined
    }
}

async function UpdateButtons() {
    let Result = false

    const SummaryDiv = document.getElementsByClassName("user-select-none p-2 px-3")
    if (SummaryDiv && SummaryDiv.length > 0) {
        if (SummaryDiv[0].textContent.includes("Daily Production")) {
            Result = Result || UpdateProductionButtons()
        }
    }

    const InputCol = document.getElementsByClassName("table table-hover align-middle text-end mb-1")
    if (InputCol && InputCol.length > 0) {
        Result = Result || UpdateConsumptionButtons()
    }

    if (Result) {
        clearInterval(AddingButtonsListInterval);
        AddingButtonsListInterval = undefined
    }
}

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

        let button = document.createElement('input');
        button.type = "button";
        button.value = "+"
        button.className = "btn btn-sm btn-secondary"

        const ingredient = Row.cells[0].children[0].children[0].children[0].attributes[0].nodeValue.split("#")[1]
        const amount = Row.cells[2].textContent
        button.addEventListener('click', () => AddToShoppingList(Base, ingredient, amount));

        td.appendChild(button);
    }

    return true
}

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

    const Base = document.getElementsByClassName("list-group-item list-group-item-action hstack active")[0].children[0].textContent

    if (Rows.length < 2) {
        return false;
    }

    for (let i = 1; i < Rows.length; i++) {
        let Row = Rows[i]

        if (Row.children.length > 2) {
            Row.removeChild(Row.children[2])
        }

        let button = document.createElement('input');
        button.type = "button";
        button.value = "+"
        button.className = "btn btn-sm btn-secondary"

        const ingredient = Row.cells[0].children[0].children[0].attributes[0].nodeValue.split("#")[1]
        const amount = Row.cells[1].textContent

        button.addEventListener('click', () => AddToShoppingList(Base, ingredient, amount));

        Row.appendChild(button, Row.cells[1]);
    }

    return true
}

function AddToShoppingList(Base, Ingredient, Amount) {
    let BaseEntry = ShoppingList.get(Base)

    if (BaseEntry == undefined) {
        ShoppingList.set(Base, new Map())
        BaseEntry = ShoppingList.get(Base)
    }

    let currentAmount = BaseEntry.get(Ingredient)
    if (currentAmount == undefined) {
        BaseEntry.set(Ingredient, Amount)
    }
    else {
        BaseEntry.set(Ingredient, parseInt(currentAmount) + parseInt(Amount))
    }

    UpdateShoppingListDiv()
}

function RemoveIngredientFromShoppingList(Ingredient) {
    for (let [Key, Value] of ShoppingList) {
        if (Value.has(Ingredient)) {
            let BaseEntry = ShoppingList.get(Key)
            BaseEntry.delete(Ingredient)

            if (BaseEntry.size == 0) {
                ShoppingList.delete(Key)
            }
        }
    }

    UpdateShoppingListDiv()
}

function RemoveFromShoppingList(Base, Ingredient, Amount) {
    let BaseEntry = ShoppingList.get(Base)

    if (BaseEntry == undefined) {
        return
    }

    let IngredientEntry = BaseEntry.get(Ingredient)
    if (IngredientEntry == undefined) {
        return
    }

    let currentAmount = IngredientEntry - Amount
    if (currentAmount <= 0) {
        BaseEntry.delete(Ingredient)

        if (BaseEntry.size == 0) {
            ShoppingList.delete(Base)
        }

    } else {
        BaseEntry.set(Ingredient, currentAmount)
    }

    if (BaseEntry.size == 0) {
        ShoppingList.delete(Base)
    }

    UpdateShoppingListDiv()
}

function UpdateShoppingListDiv() {
    let SelectedView = document.getElementsByClassName("nav-link cursor-pointer py-3 active")
    if (SelectedView == undefined || SelectedView.length == 0) {
        return false
    }
    if (SelectedView[0].textContent == "Base") {
        const MainDiv = document.querySelector("main div.container-xxl > div.row:not(gy-3)")

        let Div1 = GetShoppingListTable()

        if (MainDiv.children.length > 2) {
            if (ShoppingList.size == 0) {
                MainDiv.removeChild(MainDiv.children[2])
                return
            }

            MainDiv.children[2].replaceWith(Div1)
        }
        else {
            if (ShoppingList.size == 0) {
                return true
            }
            MainDiv.appendChild(Div1)
        }
    }

    else if (SelectedView[0].textContent == "Exchange") {
        const MainDiv = document.querySelector("main div.container-xxl div.card-body div.row.gy-3")

        if (ShoppingList.size == 0) {
            if (MainDiv.children.length <= 2)
                return
            MainDiv.removeChild(MainDiv.children[2])

            MainDiv.childNodes.forEach((child) => {
                child.style.width = "50%"
            })
            return false
        }

        MainDiv.childNodes.forEach((child) => {
            child.style.width = "40%"
        })

        let Div1 = GetShoppingListTable()
        Div1.style.width = "20%"

        if (MainDiv.children.length > 2) {
            MainDiv.children[2].replaceWith(Div1)
        }
        else {
            MainDiv.appendChild(Div1)
        }

        return modifyExchangeMaterialsList()
    }

    return true
}

function modifyExchangeMaterialsList() {
    const shoppingListHeader = "Shopping List"
    let materialsList = document.querySelector("div[class='row g-4'] div.card-body")
    if (!materialsList) {
        return false
    }

    let header = materialsList.querySelector("thead tr")
    if (Array.from(header.cells).find(cell => cell.textContent == shoppingListHeader))
        return false;

    let inputGroup = materialsList.querySelector("div.input-group")
    if (!inputGroup) {
        return false
    }

    let filterButton = inputGroup.lastChild.cloneNode(true)

    filterButton.querySelector("input").addEventListener("change", () => {
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

function updateMaterialsList() {
    let materialsList = document.querySelector("div[class='row g-4'] div.card-body")
    if (!materialsList) {
        return false
    }

    const config = { attributes: false, childList: true, subtree: false };
    const callback = (mutationList, observer) => {
        for (const mutation of mutationList) {
            if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
                const mat = getMatForName(mutation.addedNodes[0].cells[0].textContent) ?? undefined


                const TotalShoppingList = ShoppingList.entries().reduce(function (Acc, Entry) {
                    for (let [Key, Value] of Entry[1]) {
                        let CurrentAmount = Acc.get(Key) ?? 0
                        Acc.set(getMatForName(convertSVGMatToMatName(Key)).id, parseInt(Value) + parseInt(CurrentAmount));
                    }

                    return Acc;
                }, new Map());

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

        updateMaterialsList()
    };

    const TotalShoppingList = ShoppingList.entries().reduce(function (Acc, Entry) {
        for (let [Key, Value] of Entry[1]) {
            let CurrentAmount = Acc.get(Key) ?? 0
            const mat = getMatForName(convertSVGMatToMatName(Key))
            if(mat)
            {
                Acc.set(mat.id, parseInt(Value) + parseInt(CurrentAmount));

            }
            else
            {
                console.log(`${convertSVGMatToMatName(Key)} : ${Key}`)
            }
        }

        return Acc;
    }, new Map());

    const observer = new MutationObserver(callback);
    let table = materialsList.querySelector("tbody")
    observer.observe(table, config);

    let rows = materialsList.querySelectorAll("tbody tr")

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

function GetShoppingListTable() {
    let Div1 = document.createElement('div');
    Div1.className = "col-12 col-md-2";

    let Card = document.createElement('div');
    Card.className = "card border-0 mb-4";
    Div1.appendChild(Card)

    let CardBase = document.createElement('div');
    CardBase.className = "card-header text-body-secondary";
    CardBase.textContent = "Total"
    Card.appendChild(CardBase)

    let CardTotalEntry = document.createElement('div');
    CardTotalEntry.className = "list-group list-group-flush";
    Card.appendChild(CardTotalEntry)

    let TotalTable = document.createElement('table');
    CardTotalEntry.appendChild(TotalTable)

    // Total Section
    const TotalShoppingList = ShoppingList.entries().reduce(function (Acc, Entry) {
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
        button.addEventListener('click', () => RemoveIngredientFromShoppingList(Ingredient));

        let tdRemove = tr.insertCell();
        tdRemove.appendChild(button);
    })

    if(getSelectedPage() == pageEnum.Exchange)
    {
        return Div1
    }

    // for each base
    ShoppingList.forEach((BaseValue, Base) => {
        let CardBase = document.createElement('div');
        CardBase.className = "card-header text-body-secondary";
        CardBase.textContent = Base
        Card.appendChild(CardBase)

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
            button.addEventListener('click', () => RemoveFromShoppingList(Base, Ingredient, Amount));

            let tdRemove = tr.insertCell();
            tdRemove.appendChild(button);
        })

        CardBaseEntry.appendChild(Table)
    })

    return Div1
}

function GetIngredientImage(Ingredient) {
    let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    let use = document.createElementNS("http://www.w3.org/2000/svg", "use");

    svg.setAttribute("width", "24");
    svg.setAttribute("height", "24");
    use.setAttribute("href", "/assets/sprite-Bex5IPo-.svg#" + Ingredient);

    svg.appendChild(use);
    svg.className = "io ai-st flex-shrink-0 me-2";

    return svg
}

function convertSVGMatToMatName(svgName) {
    let result = svgName.replace("Basic", '')
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

function addToolTipToElement(elem) {
    elem.addEventListener("mouseover", function () {
        const rect = elem.getBoundingClientRect();
        CreateTooltip("Filter materials that are in the shopping list", rect.left + window.scrollX, rect.top + window.scrollY);
    });

    elem.addEventListener("mouseout", function () {
        tooltipDiv.style.display = "none";
    });
}

function CreateTooltip(text, posX, posY) {
    tooltipDiv.querySelector('.tooltip-inner').textContent = text
    tooltipDiv.style.transform = `translate(${posX}px, ${posY - document.body.getBoundingClientRect().height - tooltipDiv.getBoundingClientRect().height * 0.8}px)`
    tooltipDiv.style.display = "block";
}

function HideTooltip() {
    tooltipDiv.style.display = "none";
}

//------------------------------------------------------------------------------------------------------
// Utils
//------------------------------------------------------------------------------------------------------
let gameData
setTimeout(async () => {
    const gameDataResponse = await fetch('https://api.g2.galactictycoons.com/gamedata.json', {
        method: 'GET'
    });

    gameData = await gameDataResponse.json()
}, 10)

function findBuildingFromName(name) {
    const exactEntry = gameData.buildings.find((element) => element.name == name)

    if (exactEntry)
        return exactEntry
    return gameData.materials.find((element) => element.name.includes(name))
}

function getMatForName(matName) {
    const name = matName.trim()
    const exactEntry = gameData.materials.find((element) => element.name == name || element.sName == matName)

    if (exactEntry)
        return exactEntry
    return gameData.materials.find((element) => element.name.includes(name) || element.sName.includes(name))
}

function createElementFromHTML(htmlString) {
    var div = document.createElement('div');
    div.innerHTML = htmlString.trim();
    return div.firstChild;
}

const pageEnum =
{
    Exchange: "Exchange",
    Base: "Base",
}

function getSelectedPage() {
    const selectedPage = document.querySelector("a.nav-link.cursor-pointer.py-3.active span.ms-1").textContent
    return selectedPage
}