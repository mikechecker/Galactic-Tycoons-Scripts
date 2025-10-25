// ==UserScript==
// @name     Galactic Tycoon Notes
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
