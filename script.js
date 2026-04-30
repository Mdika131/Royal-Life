// Game State Object (Easier to manage and save)
let gameState = {
    kingdomName: "Camelot",
    rulerName: "King Arthur",
    age: 20,
    health: 100,
    gold: 100,
    population: 500,
    prestige: 50,
    food: 1000,
    children: [],
    buildings: {
        market: 0,
        granary: 0,
        clinic: 0
    },
};

// Connect to HTML
const ui = {
    kingdom: document.getElementById("kingdom-name"),
    name: document.getElementById("ruler-name"),
    age: document.getElementById("age"),
    health: document.getElementById("health"),
    gold: document.getElementById("gold"),
    population: document.getElementById("population"),
    prestige: document.getElementById("prestige"),
    food: document.getElementById("food"),
    log: document.getElementById("event-log"),
    childrenList: document.getElementById("children-list"),
    buildingsList: document.getElementById("buildings-list")
};

// Save and Load System
function saveGame() {
    // Convert object to string and save to browser memory
    localStorage.setItem("royalSave", JSON.stringify(gameState));
}

// Save and Load System
function loadGame() {
    const savedData = localStorage.getItem("royalSave");
    if (savedData) {
        gameState = JSON.parse(savedData); 
        
        // strictly check for undefined so a value of 0 doesn't trigger a false reset
        if (gameState.children === undefined) gameState.children = [];
        if (gameState.kingdomName === undefined) gameState.kingdomName = "Camelot";
        if (gameState.prestige === undefined) gameState.prestige = 50;
        if (gameState.food === undefined) gameState.food = 1000;
        if (gameState.buildings === undefined) {
            gameState.buildings = { market: 0, granary: 0, clinic: 0 };
        }
        
        updateUI();
    } else {
        // no save found, start a new game
        startNewDynasty();
    }
}

function updateUI() {
    // update standard stats
    ui.kingdom.innerText = gameState.kingdomName;
    ui.name.innerText = gameState.rulerName;
    ui.age.innerText = gameState.age;
    ui.health.innerText = gameState.health;
    ui.gold.innerText = gameState.gold;
    ui.population.innerText = gameState.population;
    ui.prestige.innerText = gameState.prestige;
    ui.food.innerText = gameState.food;
    
    // safety check: only try to render kids if the html element exists
    if (ui.childrenList) {
        // clear out the old list
        ui.childrenList.innerHTML = ""; 
        
        // loop through the array and render each kid
        gameState.children.forEach(kid => {
            const li = document.createElement("li");
            li.innerText = `${kid.name} (Age: ${kid.age})`;
            ui.childrenList.appendChild(li);
        });
    } else {
        console.log("Missing #children-list in HTML!");
    }
    
    // render the building shop
    renderBuildings();
}

// The Core Game Loop
function ageOneYear() {
    gameState.age++;
    gameState.children.forEach(kid => kid.age++);

    const buildingGold = gameState.buildings.market * buildingData.market.goldBonus;
    const buildingFood = gameState.buildings.granary * buildingData.granary.foodBonus;
    const buildingHealth = gameState.buildings.clinic * buildingData.clinic.healthBonus;

    // 1. Economy: Taxes & Upkeep
    const taxesCollected = Math.floor(gameState.population / 10); 
    const upkeepCost = 25; 
    const netProfit = (taxesCollected + buildingGold) - upkeepCost;
    gameState.gold += netProfit;


    // 2. Agriculture: Food & Starvation
    // random harvest quality multiplier (between 0.5 drought and 1.5 bumper crop)
    const harvestQuality = Math.random() + 0.5; 
    const foodProduced = Math.floor(gameState.population * harvestQuality);
    const foodConsumed = gameState.population; 
    const netFood = (foodProduced + buildingFood) - foodConsumed;
    
    gameState.food += netFood;

    // apply passive health bonus
    gameState.health += buildingHealth;

    let starved = 0;
    if (gameState.food < 0) {
        // famine logic: 1 person dies per missing unit of food
        starved = Math.abs(gameState.food);
        gameState.population -= starved;
        gameState.prestige -= 20; // peasants blame you for the famine
        gameState.health -= 20; // stress takes a toll
        gameState.food = 0; // cant have negative food in the granary
    }
 
    // 3. Realism: Natural Death Check
    if (gameState.age > 60) {
        const deathChance = (gameState.age - 60) * 0.03;
        if (Math.random() < deathChance) {
            gameState.health = 0; 
            checkDeath("natural causes");
            return; 
        }
    }
    
    const randomEvent = events[Math.floor(Math.random() * events.length)];

    // build the UI for the yearly report popup
    let reportHtml = `
        <div style="text-align: left; background: #eee; padding: 10px; border-radius: 5px; margin-bottom: 10px;">
            <b>Taxes:</b> +${taxesCollected} 🪙<br>
            <b>Upkeep:</b> -${upkeepCost} 🪙<br>
            <b>Net Gold:</b> ${netProfit >= 0 ? '+' : ''}${netProfit} 🪙
            <hr style="border: 1px solid #ddd; margin: 8px 0;">
            <b>Harvest:</b> +${foodProduced} 🌾<br>
            <b>Eaten:</b> -${foodConsumed} 🌾<br>
            <b>Net Food:</b> ${netFood >= 0 ? '+' : ''}${netFood} 🌾
            ${starved > 0 ? `<br><b style="color:#c0392b;">Famine! ${starved} people starved to death.</b>` : ''}
        </div>
        <p style="margin-top: 15px;">${randomEvent.text}</p>
    `;

    Swal.fire({
        title: `Year ${gameState.age} Report`,
        html: reportHtml,
        icon: starved > 0 ? 'warning' : 'info',
        showDenyButton: true,
        confirmButtonText: randomEvent.choices[0].text,
        denyButtonText: randomEvent.choices[1].text,
        confirmButtonColor: '#27ae60',
        denyButtonColor: '#8b5a2b',
        background: '#f4e8c1',
        color: '#333',
        allowOutsideClick: false
    }).then((result) => {
        const selectedChoice = result.isConfirmed ? randomEvent.choices[0] : randomEvent.choices[1];

        // apply choice effects
        gameState.gold += selectedChoice.goldChange;
        gameState.population += selectedChoice.popChange;
        gameState.health += selectedChoice.healthChange;
        if (selectedChoice.prestigeChange) gameState.prestige += selectedChoice.prestigeChange;

        // boundary checks
        if (gameState.gold < 0) gameState.gold = 0;
        if (gameState.population < 0) gameState.population = 0;
        if (gameState.health > 100) gameState.health = 100;
        if (gameState.health < 0) gameState.health = 0; 

        addLogEntry(`Year ${gameState.age}: ${randomEvent.title} (Net Gold: ${netProfit}, Net Food: ${netFood})`);
        
        saveGame();
        updateUI();
        checkDeath();

    });
}

function haveChild() {
    // trigger a popup asking for the baby's name
    Swal.fire({
        title: 'A Royal Birth!',
        text: 'What shall you name your new heir?',
        input: 'text',
        inputPlaceholder: 'e.g. William, Mary, Henry',
        confirmButtonText: 'Name Child',
        confirmButtonColor: '#27ae60', // Matches our primary button theme
        background: '#f4e8c1',
        color: '#333',
        allowOutsideClick: false // force them to type a name
    }).then((result) => {
        // Grab what they typed. If they leave it blank, give a funny default name.
        const babyName = result.value || "A Nameless Royal";

        // safety check: ensure array exists before pushing
        if (!gameState.children) {
            gameState.children = [];
        }

        // push the new baby into the children array
        gameState.children.push({
            name: babyName,
            age: 0
        });

        addLogEntry(`A new heir, ${babyName}, was born!`);
        
        saveGame();
        updateUI();
    });
}
function checkDeath(reason = "poor health") {
    if (gameState.health <= 0) {
        // use the reason in the text
        const deathText = reason === "natural causes" 
            ? `passed away peacefully at the age of ${gameState.age}.` 
            : `has died due to ${reason}.`;
        
        // check if we got kids to take over
        if (gameState.children.length > 0) {
            
            // shift removes the first item from the array and returns it to us
            const heir = gameState.children.shift(); 
            
            Swal.fire({
                title: 'The Ruler is Dead!',
                text: `Long live ${heir.name}, the new ruler!`,
                icon: 'info',
                confirmButtonText: 'Continue Reign',
                confirmButtonColor: '#8b5a2b',
                background: '#f4e8c1',
                color: '#333'
            }).then(() => {
                // swap the stats over to the kid
                gameState.rulerName = heir.name;
                gameState.age = heir.age;
                gameState.health = 100;
                
                addLogEntry(`${heir.name} has ascended to the throne.`);
                saveGame();
                updateUI();
            });
            
        } else {
            // no kids, game over man
            Swal.fire({
                title: 'Lineage Ended!',
                text: 'You died with no heirs. The kingdom falls into chaos.',
                icon: 'error',
                confirmButtonText: 'Start New Dynasty',
                confirmButtonColor: '#8b2b2b',
                background: '#f4e8c1',
                color: '#333'
            }).then(() => {
                resetGame();
            });
        }
    }
}

// This asks the player for names when a new dynasty starts
function startNewDynasty() {
    Swal.fire({
        title: 'Found Your Dynasty',
        text: 'What is the name of your new ruler?',
        input: 'text',
        inputPlaceholder: 'e.g. Arthur, Elizabeth, Ragnar',
        confirmButtonText: 'Next',
        confirmButtonColor: '#8b5a2b',
        background: '#f4e8c1',
        allowOutsideClick: false // Don't let them click away
    }).then((rulerResult) => {
        // Grab what they typed, or default to "A Nameless King" if they left it blank
        const newRuler = rulerResult.value || "A Nameless King";

        // Chain the second popup to ask for the Kingdom name
        Swal.fire({
            title: 'Name Your Realm',
            text: `What is the name of the land ${newRuler} rules?`,
            input: 'text',
            inputPlaceholder: 'e.g. Camelot, Westeros, Rohan',
            confirmButtonText: 'Begin Reign',
            confirmButtonColor: '#27ae60',
            background: '#f4e8c1',
            allowOutsideClick: false
        }).then((kingdomResult) => {
            const newKingdom = kingdomResult.value || "The Unknown Lands";

            // explicitly reset EVERY stat so nothing carries over from a previous life
            gameState.rulerName = newRuler;
            gameState.kingdomName = newKingdom;
            gameState.age = 20;
            gameState.health = 100;
            gameState.gold = 100;
            gameState.population = 500;
            gameState.prestige = 50; 
            gameState.food = 1000; 
            gameState.children = [];
            
            // wipe the infrastructure slate clean
            gameState.buildings = { market: 0, granary: 0, clinic: 0 };

            // Wipe the old log and start fresh
            if (ui.log) ui.log.innerHTML = "";
            addLogEntry(`The reign of ${newRuler} of ${newKingdom} has begun!`);

            saveGame();
            updateUI();
        });
    });
}

// draw the building shop interface
function renderBuildings() {
    if (!ui.buildingsList) return;
    ui.buildingsList.innerHTML = "";

    for (const key in buildingData) {
        const b = buildingData[key];
        const owned = gameState.buildings[key] || 0;
        
        // each building costs 15% more than the last one
        const currentCost = Math.floor(b.baseCost * Math.pow(1.15, owned));

        const li = document.createElement("li");
        li.innerHTML = `
            <div style="font-size: 1.8em; margin-bottom: 8px; color: var(--wood-dark);"><i class="fas ${b.icon}"></i></div>
            <div style="font-size: 1.1em; margin-bottom: 5px;"><b>${b.name}</b></div>
            <div style="font-size: 0.9em; color: #555; margin-bottom: 5px;">Owned: ${owned}</div>
            <div style="font-size: 0.8em; margin-bottom: 12px;"><i>${b.desc}</i></div>
            <button onclick="buyBuilding('${key}', ${currentCost})" style="padding: 8px; font-size: 0.9em; width: 100%;" ${gameState.gold < currentCost ? 'disabled' : ''}>
                Buy (${currentCost} 🪙)
            </button>
        `;
        ui.buildingsList.appendChild(li);
    }
}

// process the building purchase
function buyBuilding(buildingKey, cost) {
    if (gameState.gold >= cost) {
        gameState.gold -= cost;
        gameState.buildings[buildingKey]++;
        
        saveGame();
        updateUI();
        
        Swal.fire({
            title: 'Construction Complete',
            text: `You have successfully built a new ${buildingData[buildingKey].name}!`,
            icon: 'success',
            confirmButtonColor: '#27ae60',
            background: '#f4e8c1',
            color: '#333'
        });
    }
}

function addLogEntry(message) {
    const newLog = document.createElement("li");
    newLog.innerText = message;
    ui.log.prepend(newLog); 
}

function resetGame() {
    localStorage.removeItem("royalSave");
    location.reload(); // Refresh the page to wipe memory
}

// Event Listeners
document.getElementById("age-btn").addEventListener("click", ageOneYear);
document.getElementById("reset-btn").addEventListener("click", resetGame);
document.getElementById("child-btn").addEventListener("click", haveChild);

// Load the game when the page opens
window.onload = loadGame;

// Handles switching between the different menu tabs
function switchTab(tabId) {
    // remove active class from all tabs and buttons
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

    // show the selected tab
    document.getElementById(tabId).classList.add('active');
    
    // highlight the clicked button
    const clickedBtn = Array.from(document.querySelectorAll('.tab-btn')).find(btn => 
        btn.getAttribute('onclick').includes(tabId)
    );
    if (clickedBtn) clickedBtn.classList.add('active');
}