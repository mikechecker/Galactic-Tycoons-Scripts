// ==UserScript==
// @name     Galactic Tycoon Shopping List
// @version  0.1
// @include  https://*.galactictycoons.com/*
// ==/UserScript==

// {Base{Ingrediented, Amount}}
let shoppingList = new Map()

addEventListener("click", function (event) {
    setTimeout(async () => {
        UpdateProductionButtons()
      UpdateConsumptionButtons()
        UpdateShoppingListDiv()
    }, 1000);
});

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

