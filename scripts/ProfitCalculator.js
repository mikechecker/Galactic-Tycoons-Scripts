// ==UserScript==
// @name     Galactic Tyocoons Profit Calculator
// @version  0.1
// @include  https://*.galactictycoons.com/*
// ==/UserScript==

// {Base{Ingrediented, Amount}}
let shoppingList = new Map()

addEventListener("click", function (event) {
    setTimeout(async () => {
      updateInfo()
    }, 1000);
});

async function updateInfo() {
    const ModalDiv = document.getElementsByClassName("modal-content")
    if (ModalDiv == undefined || ModalDiv.length == 0) {
        return
    }

    const TitleDiv = ModalDiv[0].getElementsByClassName("modal-title")

    if (TitleDiv == undefined || TitleDiv.length == 0) {
        return
    }

    if (TitleDiv[0].firstChild.data.endsWith(" - Order") == false) {
        return
    }

    TitleDiv[0].firstChild.data += " Improved"


    const Rows = ModalDiv[0].querySelectorAll('tr')

    let th = document.createElement('th');
    th.textContent = "Profit"
    Rows[0].appendChild(th);


    const response = await fetch('https://api.g2.galactictycoons.com/public/exchange/mat-prices');
    const ExchangePrices = (await response.json()).prices;

    // get all Ingredients
    for (let i = 1; i < Rows.length; i++) {
        const IngredientDiv = Rows[i].cells[0]
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

        const TimeCell = Rows[i].cells[2]
        const Time = ConvertTimeToHours(TimeCell.textContent)

        const ResultCell = Rows[i].cells[3]
        const ResultContentDiv = ResultCell.getElementsByClassName("btn btn-material")

        const amount = ResultContentDiv[0].getElementsByClassName("badge btn-badge bg-secondary")[0].textContent
        const ingredient = ResultContentDiv[0].getElementsByClassName("btn-caption")[0].textContent

        const price =
            GetMat(ingredient, ExchangePrices).avgPrice

        let td = document.createElement('td');
        td.textContent = Math.round((price * amount - TotalCost) / Time / 100).toLocaleString() + "$"
        Rows[i].appendChild(td);
    }

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