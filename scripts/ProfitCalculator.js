// ==UserScript==
// @name     Galactic Tyocoons Profit Calculator
// @version  0.1
// @include  https://*.galactictycoons.com/*
// @run-at document-end
// ==/UserScript==

let ExchangePrices = []

setTimeout(async () => {
    const response = await fetch('https://api.g2.galactictycoons.com/public/exchange/mat-prices');
    ExchangePrices = (await response.json()).prices;
}, 100);

setInterval(async function () {
    const response = await fetch('https://api.g2.galactictycoons.com/public/exchange/mat-prices');
    ExchangePrices = (await response.json()).prices;
}, 10000)

setInterval(function () {
    if (ExchangePrices.length == 0) {
        return
    }

    updateEncyclpediaInfo()
    updateProductionInfo()
}, 100)

async function updateProductionInfo() {
    let RecipeTbody = document.querySelector('tbody[data-tutorial="recipe-select"]')
    if (!RecipeTbody) {
        return
    }

    let RecipeSelectionHeader = RecipeTbody.parentElement.querySelector('thead tr')

    if (RecipeSelectionHeader.children.length != 4) {
        return
    }

    let Cell = RecipeSelectionHeader.insertCell(-1)
    let th = document.createElement('th');
    th.textContent = "Profit"
    Cell.appendChild(th)

    let RecipeRows = RecipeTbody.querySelectorAll('tr.cursor-pointer')

    // get all Ingredients
    for (let i = 0; i < RecipeRows.length; i++) {
        if (Row.children.length < 4) {
            return
        }
        if (RecipeRows[i].children.length != 4) {
            RecipeRows[i].removeChild(RecipeRows[i].children[4])
        }

        const IngredientDiv = RecipeRows[i].cells[0]
        const ContentDiv = IngredientDiv.getElementsByClassName("btn btn-material")

        let TotalCost = 0
        let ingredients = []
        for (var Recipe of ContentDiv) {
            const amount = Recipe.getElementsByClassName("badge btn-badge bg-secondary")[0].textContent
            const ingredient = Recipe.getElementsByClassName("btn-caption")[0].textContent
            const price = GetMat(ingredient, ExchangePrices).avgPrice
            TotalCost += amount * price

            ingredients.push([ingredient, amount, price])
        }

        const TimeCell = RecipeRows[i].cells[2]
        const Time = ConvertTimeToHours(TimeCell.textContent)

        const ResultCell = RecipeRows[i].cells[3]
        const ResultContentDiv = ResultCell.getElementsByClassName("btn btn-material")

        const amount = ResultContentDiv[0].getElementsByClassName("badge btn-badge bg-secondary")[0].textContent
        const ingredient = ResultContentDiv[0].getElementsByClassName("btn-caption")[0].textContent

        const price =
            GetMat(ingredient, ExchangePrices).avgPrice

        let td = document.createElement('td');
        td.textContent = Math.round((price * amount - TotalCost) / Time / 100).toLocaleString() + "$"
        RecipeRows[i].appendChild(td);
    }
}

async function updateEncyclpediaInfo() {
    let SourceDiv = document.querySelector('div[class="fw-bold"]')
    if (!SourceDiv || SourceDiv.textContent != "Source") {
        return
    }

    SourceDiv.parentElement.querySelectorAll('thead tr').forEach(tr => {
        if (tr.children.length < 4) {
            return
        }

        if (tr.children.length == 5) {
            let Cell = tr.insertCell(-1)
            let newTh = document.createElement('th');
            newTh.textContent = "Profit"
            Cell.appendChild(newTh)
        }

        let RecipeRows = tr.parentElement.parentElement.querySelectorAll('tbody tr')

        // get all Ingredients
        for (let i = 0; i < RecipeRows.length; i++) {
            let Row = RecipeRows[i]
            if (Row.children.length < 5) {
                return
            }

            if (Row.children.length == 6) {
                Row.removeChild(Row.children[5])
            }

            const IngredientDiv = Row.cells[1]
            const ContentDiv = IngredientDiv.getElementsByClassName("btn btn-material")

            let TotalCost = 0
            let ingredients = []
            for (var Recipe of ContentDiv) {
                const amount = Recipe.getElementsByClassName("badge btn-badge bg-secondary")[0].textContent
                const ingredient = Recipe.getElementsByClassName("btn-caption")[0].textContent
                const price = GetMat(ingredient, ExchangePrices).avgPrice
                TotalCost += amount * price

                ingredients.push([ingredient, amount, price])
            }

            const TimeCell = Row.cells[3]
            const Time = ConvertTimeToHours(TimeCell.textContent)

            const ResultCell = Row.cells[4]
            const ResultContentDiv = ResultCell.getElementsByClassName("btn btn-material")

            const amount = ResultContentDiv[0].getElementsByClassName("badge btn-badge bg-secondary")[0].textContent
            const ingredient = ResultContentDiv[0].getElementsByClassName("btn-caption")[0].textContent

            const price =
                GetMat(ingredient, ExchangePrices).avgPrice

            let td = document.createElement('td');
            td.textContent = Math.round((price * amount - TotalCost) / Time / 100).toLocaleString() + "$"
            Row.appendChild(td);
        }
    })
}

function ConvertTimeToHours(_time) {
    const Splits = _time.split(' ');
    if (Splits[0].endsWith('h')) {
        const Hours = Splits[0].substring(0, Splits[0].length - 1);
        const Minutes = Splits[1].substring(0, Splits[1].length - 1);
        return Number(Hours) + Minutes / 60;
    }

    const Minutes = Splits[0].substring(0, Splits[0].length - 1);
    return Minutes / 60;
}

function GetMat(MatName, ExchangePrices) {
    const ExactEntry = ExchangePrices.find((element) => element.matName == MatName)

    if (ExactEntry)
        return ExactEntry
    return ExchangePrices.find((element) => element.matName.includes(MatName))
}