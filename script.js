// Game State Object (Easier to manage and save)
let gameState = {
    kingdomName: "Camelot",
    houseName: "Pendragon", 
    rulerName: "Arthur",
    rulerTitle: "King", 
    titleType: "king",
    isMale: true, 
    age: 20,
    health: 100,
    gold: 100,
    population: 500,
    prestige: 50,
    food: 1000,
    spouse: null,
    pastRulers: [],
    children: [],
    historicalOffspring: [],
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
    buildingsList: document.getElementById("buildings-list"),
    spouseContainer: document.getElementById("spouse-container"),
    dynastyTree: document.getElementById("dynasty-tree"),
};

// Traits Database for Ruler Creation
const royalTraits = [
    { name: "Strong", icon: "fa-dumbbell", color: "#27ae60", effect: "Starts with +20 Health", modHealth: 20, modGold: 0, modPrestige: 0 },
    { name: "Genius", icon: "fa-brain", color: "#2980b9", effect: "Starts with +25 Prestige", modHealth: 0, modGold: 0, modPrestige: 25 },
    { name: "Greedy", icon: "fa-coins", color: "#d35400", effect: "Starts with +50 Gold, -10 Prestige", modHealth: 0, modGold: 50, modPrestige: -10 },
    { name: "Frail", icon: "fa-crutch", color: "#c0392b", effect: "Starts with -20 Health", modHealth: -20, modGold: 0, modPrestige: 0 },
    { name: "Charismatic", icon: "fa-face-smile", color: "#8e44ad", effect: "Starts with +15 Prestige", modHealth: 0, modGold: 0, modPrestige: 15 }
];

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
        if (gameState.houseName === undefined) gameState.houseName = "Pendragon";
        if (gameState.rulerTitle === undefined) gameState.rulerTitle = "King";
        if (gameState.titleType === undefined) gameState.titleType = "king";
        if (gameState.isMale === undefined) gameState.isMale = true;
        if (gameState.children === undefined) gameState.children = [];
        if (gameState.historicalOffspring === undefined) gameState.historicalOffspring = [];
        if (gameState.kingdomName === undefined) gameState.kingdomName = "Camelot";
        if (gameState.prestige === undefined) gameState.prestige = 50;
        if (gameState.food === undefined) gameState.food = 1000;
        if (gameState.spouse === undefined) gameState.spouse = null;
        if (gameState.pastRulers === undefined) gameState.pastRulers = [];
        if (gameState.buildings === undefined) gameState.buildings = {};
        for (const key in buildingData) {
            if (gameState.buildings[key] === undefined) {
                gameState.buildings[key] = 0;
            }
        }
        
        updateUI();
    } else {
        // no save found, start a new game
        startNewDynasty();
    }
}

function updateUI() {
    // update standard stats
    ui.name.innerHTML = `${gameState.rulerTitle} ${gameState.rulerName} <span style="font-size: 0.6em; display: block; color: var(--gold); margin-top: 4px;">House ${gameState.houseName}</span>`;
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
        
        // loop through the array and render each kid as a detailed UI card
        gameState.children.forEach((kid, index) => {
            const trait = kid.trait || royalTraits[0]; 
            
            // backwards compatibility for older saves that lack new gender properties
            const isMale = kid.isMale !== undefined ? kid.isMale : true;
            const baseTitle = kid.baseTitle || (isMale ? "Prince" : "Princess");
            const heirTitle = kid.heirTitle || (isMale ? "Crown Prince" : "Crown Princess");
            
            // the child at index 0 is always next in line for the throne
            const isHeir = index === 0; 
            const displayTitle = isHeir ? heirTitle : baseTitle;

            const li = document.createElement("li");
            li.innerHTML = `
                <div style="font-size: 0.8em; color: ${isHeir ? 'var(--gold)' : '#555'}; text-transform: uppercase; font-weight: bold;">
                    ${isHeir ? `<i class="fas fa-crown"></i> ${displayTitle}` : displayTitle}
                </div>
                <div style="font-size: 1.2em; color: var(--wood-dark); margin-bottom: 5px;"><b>${kid.name}</b></div>
                <div style="font-size: 0.9em; margin-bottom: 8px; color: #555;">
                    Age: ${kid.age} &bull; <i>${kid.isSibling ? 'Sibling' : 'Child'}</i>
                </div>
                <div style="font-size: 0.85em; color: ${trait.color}; border-top: 1px solid rgba(0,0,0,0.1); padding-top: 5px; margin-bottom: 12px;">
                    <i class="fas ${trait.icon}"></i> <b>${trait.name}</b>
                    <div style="font-size: 0.8em; color: #555; margin-top: 2px;">${trait.effect}</div>
                </div>
                <div style="display: flex; gap: 5px; border-top: 1px dashed var(--wood-light); padding-top: 10px;">
                    <button onclick="setHeir(${index})" style="flex: 1; padding: 6px; font-size: 0.75em; background: ${isHeir ? '#ccc' : 'var(--wood-dark)'}; color: ${isHeir ? '#666' : 'white'}; border: none; border-radius: 3px; cursor: pointer;" ${isHeir ? 'disabled' : ''}>
                        Make Heir
                    </button>
                    <button onclick="marryOff(${index})" style="flex: 1; padding: 6px; font-size: 0.75em; background: #8e44ad; color: white; border: none; border-radius: 3px; cursor: pointer;" ${isHeir ? 'disabled' : ''}>
                        Marry Off
                    </button>
                </div>
            `;
            ui.childrenList.appendChild(li);
        });
    } else {
        console.log("Missing #children-list in HTML!");
    }
    
    // render the building shop
    renderBuildings();

    // render spouse panel
    if (ui.spouseContainer) {
        if (gameState.spouse) {
            ui.spouseContainer.innerHTML = `<div style="font-size: 1.2em; color: var(--wood-dark);"><b>${gameState.spouse.name}</b></div><div style="font-size: 0.9em;">Age: ${gameState.spouse.age}</div>`;
        } else {
            ui.spouseContainer.innerHTML = `<button onclick="findSpouse()" style="padding: 10px 20px; font-size: 1em; background: #8e44ad; color: white; border: none; border-radius: 5px; cursor: pointer; text-shadow: 1px 1px 2px rgba(0,0,0,0.5);"><i class="fas fa-ring"></i> Find Spouse (50 🪙)</button>`;
        }
    }

    // render the chronological dynasty tree
    if (ui.dynastyTree) {
        ui.dynastyTree.innerHTML = "";
        
        // draw a connecting line down the left side to simulate a family tree timeline
        gameState.pastRulers.forEach((ruler, index) => {
            const li = document.createElement("li");
            li.style.marginBottom = "15px";
            li.style.borderLeft = "3px solid var(--gold)";
            li.style.paddingLeft = "15px";
            li.style.position = "relative";
            
            li.innerHTML = `
                <div style="position: absolute; left: -8px; top: 0; width: 12px; height: 12px; background: var(--wood-dark); border-radius: 50%; border: 2px solid var(--gold);"></div>
                <div style="position: absolute; left: -8px; top: 0; width: 12px; height: 12px; background: var(--wood-dark); border-radius: 50%; border: 2px solid var(--gold);"></div>
                <div style="font-size: 1.1em; color: var(--wood-dark);"><b>${index + 1}. ${ruler.name}</b> <span style="font-size: 0.8em; color: #555;">(Ruled ${ruler.reignLength} yrs)</span></div>
                <div style="font-size: 0.85em; color: #444; margin-top: 4px;"><i class="fas fa-ring" style="color: #8e44ad;"></i> Married: ${ruler.spouse}</div>
                <div style="font-size: 0.85em; color: #444; margin-top: 2px;"><i class="fas fa-baby" style="color: #27ae60;"></i> Offspring: ${ruler.children}</div>
            `;
            ui.dynastyTree.appendChild(li);
        });
    }
}

// The Core Game Loop
// The Core Game Loop
function ageOneYear() {
    gameState.age++;
    gameState.children.forEach(kid => kid.age++);
    if (gameState.spouse) gameState.spouse.age++;

    // dynamically calculate all passive bonuses based on inventory
    let buildingGold = 0;
    let buildingFood = 0;
    let buildingHealth = 0;
    let buildingPrestige = 0;
    let totalBuildingUpkeep = 0;

    for (const key in gameState.buildings) {
        const owned = gameState.buildings[key];
        if (owned > 0 && buildingData[key]) {
            buildingGold += owned * (buildingData[key].goldBonus || 0);
            buildingFood += owned * (buildingData[key].foodBonus || 0);
            buildingHealth += owned * (buildingData[key].healthBonus || 0);
            buildingPrestige += owned * (buildingData[key].prestigeBonus || 0);
            totalBuildingUpkeep += owned * (buildingData[key].upkeep || 0);
        }
    }

    // 1. Economy: Taxes & Upkeep
    const taxesCollected = Math.floor(gameState.population / 10); 
    const baseUpkeepCost = 25; 
    const totalUpkeep = baseUpkeepCost + totalBuildingUpkeep;
    const netProfit = (taxesCollected + buildingGold) - totalUpkeep;
    gameState.gold += netProfit;

    // 2. Agriculture: Food & Starvation
    const harvestQuality = Math.random() + 0.5; 
    const foodProduced = Math.floor(gameState.population * harvestQuality);
    const foodConsumed = gameState.population; 
    const netFood = (foodProduced + buildingFood) - foodConsumed;
    
    gameState.food += netFood;
    gameState.health += buildingHealth;
    gameState.prestige += buildingPrestige;

    // starvation logic
    let starved = 0;
    if (gameState.food < 0) {
        starved = Math.abs(gameState.food);
        gameState.population -= starved;
        gameState.prestige -= 20; 
        gameState.health -= 20; 
        gameState.food = 0; 
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

    // build the highly detailed UI for the yearly report
    let reportHtml = `
        <div style="text-align: left; background: #eee; padding: 10px; border-radius: 5px; margin-bottom: 10px; font-size: 0.9em;">
            <b>Taxes:</b> +${taxesCollected} 🪙<br>
            ${buildingGold > 0 ? `<b style="color: #27ae60;">Infrastructure Income:</b> +${buildingGold} 🪙<br>` : ''}
            <b>Castle Upkeep:</b> -${baseUpkeepCost} 🪙<br>
            ${totalBuildingUpkeep > 0 ? `<b style="color: #c0392b;">Building Upkeep:</b> -${totalBuildingUpkeep} 🪙<br>` : ''}
            <div style="border-top: 1px solid #ccc; margin-top: 5px; padding-top: 5px;">
                <b>Net Gold:</b> ${netProfit >= 0 ? '+' : ''}${netProfit} 🪙
            </div>

            <hr style="border: 1px solid #ddd; margin: 8px 0;">
            
            <b>Harvest:</b> +${foodProduced} 🌾<br>
            ${buildingFood > 0 ? `<b style="color: #27ae60;">Infrastructure Storage:</b> +${buildingFood} 🌾<br>` : ''}
            <b>Eaten:</b> -${foodConsumed} 🌾<br>
            <div style="border-top: 1px solid #ccc; margin-top: 5px; padding-top: 5px;">
                <b>Net Food:</b> ${netFood >= 0 ? '+' : ''}${netFood} 🌾
            </div>
            
            ${buildingPrestige > 0 ? `<div style="margin-top: 8px; color: #d35400;"><b>Passive Prestige:</b> +${buildingPrestige} 🌟</div>` : ''}
            ${starved > 0 ? `<br><b style="color:#c0392b; font-size: 1.1em;">Famine! ${starved} people starved to death.</b>` : ''}
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

// handles finding a spouse to expand the royal family
function findSpouse() {
    if (gameState.gold < 50) {
        Swal.fire({ title: 'Not Enough Gold', text: 'You need at least 50 gold to host a royal wedding.', icon: 'error', confirmButtonColor: '#8b2b2b', background: '#f4e8c1', color: '#333' });
        return;
    }

    Swal.fire({
        title: 'Royal Wedding',
        text: 'Enter the name of your new spouse:',
        input: 'text',
        inputPlaceholder: 'e.g. Guinevere, Eleanor, Philip',
        showCancelButton: true,
        confirmButtonText: 'Marry (50 🪙)',
        confirmButtonColor: '#8e44ad',
        background: '#f4e8c1',
        color: '#333'
    }).then((result) => {
        if (result.isConfirmed && result.value) {
            gameState.gold -= 50;
            gameState.spouse = {
                name: result.value,
                age: gameState.age - Math.floor(Math.random() * 5) // roughly same age as ruler
            };
            
            addLogEntry(`You have married ${gameState.spouse.name}. The realm celebrates!`);
            saveGame();
            updateUI();
        }
    });
}

function haveChild() {
    // roll for gender and genetics BEFORE asking for a name
    const isMale = Math.random() > 0.5;
    const baseTitle = isMale ? "Prince" : "Princess";
    const heirTitle = isMale ? "Crown Prince" : "Crown Princess";
    const randomTrait = royalTraits[Math.floor(Math.random() * royalTraits.length)];

    const promptTitle = isMale ? 'A Son is Born!' : 'A Daughter is Born!';
    const promptText = `Your wife has given birth to a healthy baby ${isMale ? 'boy' : 'girl'}. What shall you name your new ${baseTitle}?`;

    Swal.fire({
        title: promptTitle,
        text: promptText,
        input: 'text',
        inputPlaceholder: isMale ? 'e.g. William, Henry, Arthur' : 'e.g. Mary, Elizabeth, Victoria',
        confirmButtonText: 'Name Child',
        confirmButtonColor: '#27ae60',
        background: '#f4e8c1',
        color: '#333',
        allowOutsideClick: false
    }).then((result) => {
        const babyName = result.value || "A Nameless Royal";
        
        if (gameState.children === undefined) gameState.children = [];

        const newBaby = {
            name: babyName,
            isMale: isMale,
            baseTitle: baseTitle,
            heirTitle: heirTitle,
            age: 0,
            trait: randomTrait,
            isSibling: false // this is a direct descendant
        };

        // primogeniture: direct children always jump ahead of siblings in the line of succession
        const firstSiblingIndex = gameState.children.findIndex(kid => kid.isSibling);
        
        if (firstSiblingIndex !== -1) {
            // insert the baby right before the first sibling
            gameState.children.splice(firstSiblingIndex, 0, newBaby);
        } else {
            // no siblings exist, just add to the end of the line
            gameState.children.push(newBaby);
            gameState.historicalOffspring.push(babyName);
        }

        addLogEntry(`${baseTitle} ${babyName} was born! They seem to be ${randomTrait.name}.`);
        
        
        saveGame();
        updateUI();
    });
}

// designate a specific child to inherit the throne
function setHeir(index) {
    if (index === 0) return; // they are already the heir
    
    // remove the chosen child from their current spot and move them to the front of the array
    const chosenOne = gameState.children.splice(index, 1)[0];
    gameState.children.unshift(chosenOne);
    
    addLogEntry(`${chosenOne.title} ${chosenOne.name} has been officially designated as the Crown Heir.`);
    
    saveGame();
    updateUI();
}

// marry off a spare child for political alliances and resources
function marryOff(index) {
    // safety check so you don't accidentally game-over yourself
    if (gameState.children.length <= 1 || index === 0) {
        Swal.fire({
            title: 'Cannot Marry Off!',
            text: 'You cannot marry off your designated Crown Heir! The lineage must survive.',
            icon: 'warning',
            confirmButtonColor: '#8b5a2b',
            background: '#f4e8c1',
            color: '#333'
        });
        return;
    }

    const kid = gameState.children[index];
    
    // generate random dowry and alliance prestige
    const goldGained = Math.floor(Math.random() * 100) + 50;
    const prestigeGained = Math.floor(Math.random() * 20) + 10;
    
    Swal.fire({
        title: 'Royal Marriage',
        text: `You have married off ${kid.baseTitle} ${kid.name} to a neighboring realm. The alliance brings +${goldGained} 🪙 and +${prestigeGained} 🌟.`,
        icon: 'success',
        confirmButtonColor: '#8e44ad',
        background: '#f4e8c1',
        color: '#333'
    }).then(() => {
        // permanently remove the child from the kingdom
        gameState.children.splice(index, 1);
        
        gameState.gold += goldGained;
        gameState.prestige += prestigeGained;
        
        addLogEntry(`${kid.name} was married off for an alliance (+${goldGained} Gold, +${prestigeGained} Prestige).`);
        
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
            
            // peek at the heir without removing them yet so the popup has their name
            const heir = gameState.children[0]; 
            
            Swal.fire({
                title: 'The Ruler is Dead!',
                text: `Long live ${heir.name}, the new ruler!`,
                icon: 'info',
                confirmButtonText: 'Continue Reign',
                confirmButtonColor: '#8b5a2b',
                background: '#f4e8c1',
                color: '#333',
                allowOutsideClick: false
            }).then(() => {
                
                // 1. ARCHIVE THE OLD RULER FIRST (before any stats change)
                gameState.pastRulers.push({
                    name: `${gameState.rulerTitle} ${gameState.rulerName} of House ${gameState.houseName}`,
                    spouse: gameState.spouse ? gameState.spouse.name : "Unmarried",
                    reignLength: gameState.age - 20, 
                    children: gameState.historicalOffspring.length > 0 ? gameState.historicalOffspring.join(", ") : "None"
                });

                // clear the old ruler's personal family data
                gameState.spouse = null;
                gameState.historicalOffspring = [];

                // 2. SUCCESSION (bring in the heir)
                const actualHeir = gameState.children.shift(); 
                
                // the remaining royal family members are now siblings to the new ruler
                gameState.children.forEach(kid => kid.isSibling = true); 

                // update name and gender
                gameState.rulerName = actualHeir.name;
                gameState.isMale = actualHeir.isMale !== undefined ? actualHeir.isMale : true;
                
                // assign gendered title based on the realm rank
                if (gameState.isMale) {
                    if (gameState.titleType === "emperor") gameState.rulerTitle = "Emperor";
                    else if (gameState.titleType === "duke") gameState.rulerTitle = "Duke";
                    else if (gameState.titleType === "sultan") gameState.rulerTitle = "Sultan";
                    else gameState.rulerTitle = "King";
                } else {
                    if (gameState.titleType === "emperor") gameState.rulerTitle = "Empress";
                    else if (gameState.titleType === "duke") gameState.rulerTitle = "Duchess";
                    else if (gameState.titleType === "sultan") gameState.rulerTitle = "Sultana";
                    else gameState.rulerTitle = "Queen";
                }

                gameState.age = actualHeir.age;
                
                // apply inherited trait modifiers to starting baseline
                const heirTrait = actualHeir.trait || royalTraits[0];
                gameState.health = 100 + heirTrait.modHealth;
                gameState.gold += heirTrait.modGold;
                gameState.prestige += heirTrait.modPrestige;
                
                // safety bounds
                if (gameState.health > 100) gameState.health = 100;
                
                addLogEntry(`${gameState.rulerTitle} ${gameState.rulerName} the ${heirTrait.name} has ascended to the throne.`);
                
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
    const formHtml = `
        <div style="display: flex; flex-direction: column; gap: 15px; text-align: left; font-family: 'Lora', serif; margin-top: 10px;">
            <div>
                <label style="font-weight: bold; font-size: 0.9em; color: var(--wood-dark);">Ruler First Name:</label>
                <input id="c-fname" class="swal2-input" style="margin: 5px 0 0 0; width: 100%; box-sizing: border-box;" placeholder="e.g. Arthur">
            </div>
            <div>
                <label style="font-weight: bold; font-size: 0.9em; color: var(--wood-dark);">House / Dynasty Name:</label>
                <input id="c-hname" class="swal2-input" style="margin: 5px 0 0 0; width: 100%; box-sizing: border-box;" placeholder="e.g. Pendragon">
            </div>
            <div style="display: flex; gap: 10px;">
                <div style="flex: 1;">
                    <label style="font-weight: bold; font-size: 0.9em; color: var(--wood-dark);">Gender:</label>
                    <select id="c-gender" class="swal2-select" style="margin: 5px 0 0 0; width: 100%; display: flex; box-sizing: border-box;">
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                    </select>
                </div>
                <div style="flex: 1;">
                    <label style="font-weight: bold; font-size: 0.9em; color: var(--wood-dark);">Realm Rank:</label>
                    <select id="c-title" class="swal2-select" style="margin: 5px 0 0 0; width: 100%; display: flex; box-sizing: border-box;">
                        <option value="king">Kingdom</option>
                        <option value="emperor">Empire</option>
                        <option value="duke">Duchy</option>
                        <option value="sultan">Sultanate</option>
                    </select>
                </div>
            </div>
            <div>
                <label style="font-weight: bold; font-size: 0.9em; color: var(--wood-dark);">Realm Name:</label>
                <input id="c-kname" class="swal2-input" style="margin: 5px 0 0 0; width: 100%; box-sizing: border-box;" placeholder="e.g. Camelot">
            </div>
        </div>
    `;

    Swal.fire({
        title: 'Found Your Dynasty',
        html: formHtml,
        confirmButtonText: 'Begin Reign',
        confirmButtonColor: '#27ae60',
        background: '#f4e8c1',
        allowOutsideClick: false,
        preConfirm: () => {
            // grab all form values
            const fname = document.getElementById('c-fname').value || "Nameless";
            const hname = document.getElementById('c-hname').value || "Nobody";
            const gender = document.getElementById('c-gender').value;
            const titleType = document.getElementById('c-title').value;
            const kname = document.getElementById('c-kname').value || "The Unknown Lands";

            // assign correct title prefix based on gender and rank
            let finalTitle = "";
            if (gender === "male") {
                if (titleType === "king") finalTitle = "King";
                if (titleType === "emperor") finalTitle = "Emperor";
                if (titleType === "duke") finalTitle = "Duke";
                if (titleType === "sultan") finalTitle = "Sultan";
            } else {
                if (titleType === "king") finalTitle = "Queen";
                if (titleType === "emperor") finalTitle = "Empress";
                if (titleType === "duke") finalTitle = "Duchess";
                if (titleType === "sultan") finalTitle = "Sultana";
            }

            return { fname, hname, isMale: gender === "male", titleType, finalTitle, kname };
        }
    }).then((result) => {
        const data = result.value;

        // apply character creation data
        gameState.rulerName = data.fname;
        gameState.houseName = data.hname;
        gameState.isMale = data.isMale;
        gameState.rulerTitle = data.finalTitle;
        gameState.titleType = data.titleType;
        gameState.kingdomName = data.kname;
        
        // reset stats
        gameState.age = 20;
        gameState.health = 100;
        gameState.gold = 100;
        gameState.population = 500;
        gameState.prestige = 50; 
        gameState.food = 1000; 
        
        // wipe family and infrastructure
        gameState.children = [];
        gameState.historicalOffspring = [];
        gameState.spouse = null;
        gameState.pastRulers = [];
        
        gameState.buildings = {};
        for (const key in buildingData) {
            gameState.buildings[key] = 0;
        }

        if (ui.log) ui.log.innerHTML = "";
        addLogEntry(`The reign of ${data.finalTitle} ${data.fname} of House ${data.hname} has begun!`);

        saveGame();
        updateUI();
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
            <div style="font-size: 0.8em; margin-bottom: 12px;">
                <i>${b.desc}</i><br>
                <span style="color: #c0392b; font-weight: bold;">Upkeep: -${b.upkeep} 🪙/yr</span>
            </div>
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