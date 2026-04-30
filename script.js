// Game State Object (Easier to manage and save)
let gameState = {
    kingdomName: "Camelot",
    rulerName: "King Arthur",
    age: 20,
    health: 100,
    gold: 100,
    population: 500,
    prestige: 50,
    children: []
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
    log: document.getElementById("event-log"),
    childrenList: document.getElementById("children-list")
};

// Save and Load System
function saveGame() {
    // Convert object to string and save to browser memory
    localStorage.setItem("royalSave", JSON.stringify(gameState));
}

function loadGame() {
    const savedData = localStorage.getItem("royalSave");
    if (savedData) {
        gameState = JSON.parse(savedData); 
        
        // patch old saves so they don't break
        if (!gameState.children) gameState.children = [];
        if (!gameState.kingdomName) gameState.kingdomName = "Camelot"; 
        
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
}

// The Core Game Loop
function ageOneYear() {
    gameState.age++;
    gameState.children.forEach(kid => kid.age++);

    // 1. Economy: Taxes & Upkeep
    const taxesCollected = Math.floor(gameState.population / 10); // 1 gold for every 10 people
    const upkeepCost = 25; // fixed cost to run the castle
    const netProfit = taxesCollected - upkeepCost;

    gameState.gold += netProfit;

    // 2. Realism: Natural Death Check
    // Once over 60, there is a cumulative 3% chance per year of dying of old age
    if (gameState.age > 60) {
        const deathChance = (gameState.age - 60) * 0.03;
        if (Math.random() < deathChance) {
            gameState.health = 0; // force the death sequence
            checkDeath("natural causes");
            return; // stop the function here
        }
    }
    
    const randomEvent = events[Math.floor(Math.random() * events.length)];

    Swal.fire({
        title: `Year ${gameState.age} Report`,
        html: `
            <div style="text-align: left; background: #eee; padding: 10px; border-radius: 5px; margin-bottom: 10px;">
                <b>Taxes:</b> +${taxesCollected} 🪙<br>
                <b>Upkeep:</b> -${upkeepCost} 🪙<br>
                <b>Net:</b> ${netProfit >= 0 ? '+' : ''}${netProfit} 🪙
            </div>
            <hr>
            <p style="margin-top: 15px;">${randomEvent.text}</p>
        `,
        icon: 'info',
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

        // apply choice effects (including prestige if added to events later)
        gameState.gold += selectedChoice.goldChange;
        gameState.population += selectedChoice.popChange;
        gameState.health += selectedChoice.healthChange;
        if (selectedChoice.prestigeChange) gameState.prestige += selectedChoice.prestigeChange;

        // keep stats within reasonable bounds
        if (gameState.gold < 0) gameState.gold = 0;
        if (gameState.population < 0) gameState.population = 0;
        if (gameState.health > 100) gameState.health = 100;
        if (gameState.health < 0) gameState.health = 0; 

        addLogEntry(`Year ${gameState.age}: ${randomEvent.title} (Net Gold: ${netProfit})`);
        
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

            // Set up our brand new game stats
            gameState.rulerName = newRuler;
            gameState.kingdomName = newKingdom;
            gameState.age = 20;
            gameState.health = 100;
            gameState.gold = 100;
            gameState.population = 500;
            gameState.children = [];

            // Wipe the old log and start fresh
            if (ui.log) ui.log.innerHTML = "";
            addLogEntry(`The reign of ${newRuler} of ${newKingdom} has begun!`);

            saveGame();
            updateUI();
        });
    });
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