// ==UserScript==
// @name     Galactic Tycoon Profit Calculator
// @version  0
// @include  https://*.galactictycoons.com/*
// ==/UserScript==


const cookieNotesName = "checker-script-notes"

var notes = document.createElement("input");
notes.type = "button";
notes.value = "Show Notes";
notes.className = "btn btn-sm btn-secondary"
notes.onclick = showNotes;

document.body.insertBefore(notes, document.body.firstChild);

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
    const prices = await response.json().prices;

    // get all Ingredients
    for (let i = 1; i < Rows.length; i++) {
        const IngredientDiv = Rows[i].cells[0]
        const ContentDiv = IngredientDiv.getElementsByClassName("btn btn-material")

        let TotalCost = 0
        let ingredients = []
        console.log("----------------")
        for (var Recipe of ContentDiv) {
            const amount = Recipe.getElementsByClassName("badge btn-badge bg-secondary")[0].textContent
            const ingredient = Recipe.getElementsByClassName("btn-caption")[0].textContent
            const price = GetMat(ingredient, prices).avgPrice
            console.log(ingredient)
            console.log(amount)
            console.log(price)
            TotalCost += amount * price

            ingredients.push([ingredient, amount, price])
        }

        const TimeCell = Rows[i].cells[2]
        const Time = ConvertTimeToHours(TimeCell.textContent)

        console.log(Time)
        const ResultCell = Rows[i].cells[3]
        const ResultContentDiv = ResultCell.getElementsByClassName("btn btn-material")

        const amount = ResultContentDiv[0].getElementsByClassName("badge btn-badge bg-secondary")[0].textContent
        const ingredient = ResultContentDiv[0].getElementsByClassName("btn-caption")[0].textContent

        const price =
            GetMat(ingredient, prices).avgPrice

        console.log(amount)
        console.log(price)

        let td = document.createElement('td');
        td.textContent = Math.round((price * amount - TotalCost) / Time / 100).toLocaleString() + "$"
        Rows[i].appendChild(td);
    }

}

function showNotes() {
    var notes = getNotes()
    notes = prompt("Please enter your name:", notes);

    if (notes == null || notes == "") {
        text = "User cancelled the prompt.";
    } else {

        var exdate = new Date();
        exdate.setDate(exdate.getDate() + 999);
        document.cookie = cookieNotesName + "=" + escape(notes) + ";expires=" + exdate.toUTCString();
    }
}

function saveNotes() {
    setCookie(cookieNotesName, "test", 999)
}

function setCookie(c_name, value, expiredays) {
    var exdate = new Date();
    exdate.setDate(exdate.getDate() + expiredays);
    document.cookie = c_name + "=" + escape(value) + ((expiredays == null) ?
        "" :
        ";expires=" + exdate.toUTCString());
}

function getNotes() {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${cookieNotesName}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
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
    const ExactEntry = ExchangePrices.find((element) => element.matName == ingredient)

    if (ExactEntry)
        return ExactEntry
    return ExchangePrices.find((element) => element.matName.includes(ingredient))
}
