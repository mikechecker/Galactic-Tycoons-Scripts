// ==UserScript==
// @name     Galactic Tycoon Shopping List
// @version  1
// @include  https://*.galactictycoons.com/*
// ==/UserScript==

// Base
// Ingredient
// Amount
let shoppingList = new Map()

document.onclick = async function (event) {
    setTimeout(async () => {
        UpdateProductionButtons()
      UpdateConsumptionButtons()
        UpdateShoppingListDiv()
      updateInfo()
    }, 1000);
};

async function UpdateConsumptionButtons() {
    const InputCol = document.getElementsByClassName("table table-hover align-middle text-end mb-1")
    if (InputCol == undefined || InputCol.length == 0) {
        return
    }

    const Rows = InputCol[0].rows


   if(Rows[0].children.length <= 4)
   {
   
    let tdHeader = Rows[0].insertCell(-1)  
  	tdHeader.outerHTML = '<th class="col-1"  style="white-space: nowrap !important">Shopping List</th>'
    tdHeader.className = "col-2 cursor-pointer text-nowrap"
     }
    const Base = document.getElementsByClassName("list-group-item list-group-item-action hstack active")[0].children[0].textContent
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
}

async function UpdateProductionButtons() {
    const SummaryDiv = document.getElementsByClassName("user-select-none p-2 px-3")
    if (SummaryDiv == undefined || SummaryDiv.length == 0) {
        return
    }

    if (SummaryDiv[0].textContent.includes("Daily Production") == false) {
        return
    }

    const InputCol = SummaryDiv[0].parentElement.getElementsByClassName("table table-transparent table-hover mb-0")
    if (InputCol == undefined || InputCol.length == 0) {
        return
    }

    const Rows = InputCol[0].rows

    if (Rows[0].textContent != "Input") {
        return
    }

    const Base = document.getElementsByClassName("list-group-item list-group-item-action hstack active")[0].children[0].textContent
         
    for (let i = 1; i < Rows.length; i++) {
        let Row = Rows[i]

        if (Row.children.length > 2) {
            return
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
}

function AddToShoppingList(Base, Ingredient, Amount) {
    let BaseEntry = shoppingList.get(Base)

    if (BaseEntry == undefined) {
        shoppingList.set(Base, new Map())
        BaseEntry = shoppingList.get(Base)
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

function RemoveFromShoppingList(Base, Ingredient, Amount) {
    let BaseEntry = shoppingList.get(Base)

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

      if(BaseEntry.size == 0)
      {
        shoppingList.delete(Base)
      }

    } else {
        BaseEntry.set(Ingredient, currentAmount)
    }

    UpdateShoppingListDiv()
}

function UpdateShoppingListDiv() {
    let SelectedView = document.getElementsByClassName("nav-link cursor-pointer py-3 active")[0].textContent

    if (SelectedView == "Base") {
        const MainDiv = document.querySelector("main div.container-xxl > div.row:not(gy-3)")

        let Div1 = GetShoppingListTable()

        if (MainDiv.children.length > 2) {
            if (shoppingList.size == 0) {
                MainDiv.removeChild(MainDiv.children[2])
              console.log("test")
                return
            }
          
            MainDiv.children[2].replaceWith(Div1)
        }
        else {
            if (shoppingList.size == 0) {
                return
            }
            MainDiv.appendChild(Div1)
        }
    }

    else if (SelectedView == "Exchange") {
        const MainDiv = document.querySelector("main div.container-xxl div.card-body div.row.gy-3")

        if (shoppingList.size == 0) {
            MainDiv.removeChild(MainDiv.children[2])

            MainDiv.childNodes.forEach((child) => {
                child.style.width = "50%"
            })
            return
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
    }

}

function GetShoppingListTable() {
    let Div1 = document.createElement('div');
    Div1.className = "col-12 col-md-2";

    let Card = document.createElement('div');
    Card.className = "card border-0 mb-4";
    Div1.appendChild(Card)
    shoppingList.forEach((BaseValue, Base, map) => {
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
            tdIngredient.appendChild(document.createTextNode(Ingredient));

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

// --------------------- Profit Calculator --------------------------------------------

async function updateInfo() {

  console.log(0)
    const ModalDiv = document.getElementsByClassName("modal-content")
    if (ModalDiv == undefined || ModalDiv.length == 0) {
        return
    }
console.log(1)
    const TitleDiv = ModalDiv[0].getElementsByClassName("modal-title")

    if (TitleDiv == undefined || TitleDiv.length == 0) {
        return
    }
console.log(2)
    if (TitleDiv[0].firstChild.data.endsWith(" - Order") == false) {
        return
    }
console.log(3)
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
