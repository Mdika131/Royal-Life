// Game State Object (Easier to manage and save)
let gameState = {
    logs: [],
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
    landSize: 1,
    neighbors: [],
    mapTiles: [],
    armyExperience: 0,
    army: {
        infantry: 0,
        archers: 0,
        cavalry: 0
    },
    buildings: {
        market: 0,
        granary: 0,
        clinic: 0
    },
};

// Connect to HTML
const ui = {
    mapGrid: document.getElementById("ui-map-grid"),
    kingdom: document.getElementById("kingdom-name"),
    name: document.getElementById("ruler-name"),
    titleruler: document.getElementById("ruler-title"),
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
    infCount: document.getElementById("ui-inf-count"),
    infCap: document.getElementById("ui-inf-cap"),
    arcCount: document.getElementById("ui-arc-count"),
    arcCap: document.getElementById("ui-arc-cap"),
    cavCount: document.getElementById("ui-cav-count"),
    cavCap: document.getElementById("ui-cav-cap"),
    foreignRealms: document.getElementById("foreign-realms-container"),
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
        if (gameState.landSize === undefined) gameState.landSize = 1;
        if (gameState.neighbors === undefined) gameState.neighbors = [];
        if (gameState.armyExperience === undefined) gameState.armyExperience = 0;
        if (gameState.army === undefined || typeof gameState.army === 'number') {
            const oldSoldiers = typeof gameState.army === 'number' ? gameState.army : 0;
            gameState.army = { infantry: oldSoldiers, archers: 0, cavalry: 0 };
        }
        if (gameState.buildings === undefined) gameState.buildings = {};
        for (const key in buildingData) {
            if (gameState.buildings[key] === undefined) {
                gameState.buildings[key] = 0;
            }
        }
        
        if (!gameState.logs) gameState.logs = [];
        
        updateUI();
        
    } else {
        // no save found, start a new game
        startNewDynasty();
    }
}

function updateUI() {
    // dynamically sum regional populations for the global counter
    if (gameState.mapTiles && gameState.mapTiles.length > 0) {
        gameState.population = gameState.mapTiles
            .filter(t => t.ownerType === "player" || t.ownerType === "vassal")
            .reduce((sum, tile) => sum + (tile.population || 0), 0);
    }
    // update standard stats
    ui.name.innerHTML = `${gameState.rulerTitle} ${gameState.rulerName} <span style="font-size: 0.6em; display: block; color: var(--gold); margin-top: 4px;">House ${gameState.houseName}</span>`;
    ui.titleruler.innerText = gameState.rulerTitle;
    ui.kingdom.innerText = gameState.kingdomName;
    ui.name.innerText = `${gameState.rulerName} ${gameState.houseName}`;
    ui.age.innerText = gameState.age;
    ui.health.innerText = gameState.health;
    ui.gold.innerText = gameState.gold;
    ui.population.innerText = gameState.population;
    ui.prestige.innerText = gameState.prestige;
    ui.food.innerText = gameState.food;
    if (document.getElementById("ui-army-exp-text")) document.getElementById("ui-army-exp-text").innerText = `${gameState.armyExperience} / 100`;
    if (document.getElementById("ui-army-exp-bar")) document.getElementById("ui-army-exp-bar").style.width = `${gameState.armyExperience}%`;
    
    // render persistent chronicle logs
    const logContainer = document.getElementById("ui-chronicle-log");
    if (logContainer && gameState.logs) {
        logContainer.innerHTML = gameState.logs.length > 0 
            ? gameState.logs.map(log => `<p style="margin-bottom: 8px; border-bottom: 1px solid rgba(0,0,0,0.1); padding-bottom: 5px;"><b></b> ${log.text}</p>`).join("")
            : "<p><i>The history of this dynasty has yet to be written...</i></p>";
    }
    
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

        if (ui.infCount) ui.infCount.innerText = gameState.army.infantry;
        if (ui.infCap) ui.infCap.innerText = getUnitCapacity('infantry');
        if (ui.arcCount) ui.arcCount.innerText = gameState.army.archers;
        if (ui.arcCap) ui.arcCap.innerText = getUnitCapacity('archers');
        if (ui.cavCount) ui.cavCount.innerText = gameState.army.cavalry;
        if (ui.cavCap) ui.cavCap.innerText = getUnitCapacity('cavalry');

        // render the foreign realms and attack options
    if (ui.foreignRealms) {
        ui.foreignRealms.innerHTML = "";
        
        // safety check to ensure neighbors exist on older saves
        if (!gameState.neighbors || gameState.neighbors.length === 0) generateNeighbors();

        gameState.neighbors.forEach((realm, index) => {
            if (realm.isDefeated) return;
            const div = document.createElement("div");
            div.style.background = "var(--parchment)";
            div.style.border = "1px solid var(--wood-light)";
            div.style.padding = "12px";
            div.style.marginBottom = "10px";
            div.style.borderRadius = "5px";
            div.style.textAlign = "left";
            
            // calculate the total enemy footprint for the header
            const totalEnemyPower = realm.army.infantry + realm.army.archers + realm.army.cavalry;
            const powerDisplay = realm.scouted ? totalEnemyPower : `~${totalEnemyPower}`;
            const wealthDisplay = realm.scouted ? realm.wealth : (realm.wealth > 150 ? 'High' : 'Moderate');

            div.innerHTML = `
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <b style="font-size: 1.1em; color: var(--wood-dark);">${realm.name}</b>
                    <span style="color: #c0392b; font-weight: bold;" title="Total Troops"><i class="fas fa-swords"></i> ${powerDisplay} Men</span>
                </div>
                <div style="font-size: 0.85em; color: #555; margin-bottom: 12px; font-style: italic;">
                    Wealth: ${wealthDisplay} &bull; Territory Size: ${realm.land}
                </div>
                
                <div style="display: flex; gap: 8px;">
                    <!-- toggle between paying to scout or viewing the unlocked report -->
                    ${!realm.scouted ? `
                    <button onclick="scoutNeighbor(${index})" style="flex: 1; padding: 8px; background: #27ae60; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85em;">
                        <i class="fas fa-eye"></i> Scout (50 🪙)
                    </button>
                    ` : `
                    <button onclick="viewRealmInfo(${index})" style="flex: 1; padding: 8px; background: #2980b9; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85em;">
                        <i class="fas fa-file-contract"></i> View Info
                    </button>
                    `}
                    
                    <button onclick="attackNeighbor(${index}, 'raid')" style="flex: 1; padding: 8px; background: #d35400; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85em;">
                        <i class="fas fa-fire"></i> Raid
                    </button>
                    <button onclick="attackNeighbor(${index}, 'conquer')" style="flex: 1; padding: 8px; background: #c0392b; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85em;">
                        <i class="fas fa-flag"></i> Conquer
                    </button>
                </div>
            `;
            ui.foreignRealms.appendChild(div);
        });
    // Render the interactive World Map
    if (ui.mapGrid && gameState.mapTiles) {
        ui.mapGrid.innerHTML = ""; 
        
        if (gameState.mapTiles.length === 0) generateMap();
        
        const terrainIcons = { "Plains": "", "Forest": "🌲", "Hills": "⛰️", "Mountains": "🏔️" };

        gameState.mapTiles.forEach((tile) => {
            const cell = document.createElement("div");
            
            // updated styling for visual depth and terrain support
            cell.style.cursor = "pointer";
            cell.style.minHeight = "22px"; 
            cell.style.display = "flex";
            cell.style.alignItems = "center";
            cell.style.justifyContent = "center";
            cell.style.fontSize = "10px"; // size for terrain emojis
            cell.style.boxShadow = "inset 0 0 3px rgba(0,0,0,0.2)"; // subtle 3D tile effect
            
            // apply base terrain visual
            cell.innerHTML = terrainIcons[tile.terrain];
            
            let displayOwner = "Wilderness";

            if (tile.ownerType === "player") {
                cell.style.background = "#27ae60"; 
                cell.innerHTML = `<i class="fas fa-crown" style="color: rgba(255,255,255,0.9); font-size: 11px;"></i>`;
                displayOwner = "The Crown";
            } else if (tile.ownerType === "vassal") {
                cell.style.background = "#2980b9"; 
                displayOwner = "Your Vassal";
            } else if (tile.ownerType === "neighbor" && tile.ownerId !== null) {
                const neighbor = gameState.neighbors[tile.ownerId];
                if (neighbor && !neighbor.isDefeated) {
                    cell.style.background = neighbor.color;
                    displayOwner = neighbor.name;
                } else {
                    cell.style.background = "#bdc3c7"; 
                }
            } else {
                cell.style.background = "#ecf0f1"; 
            }
            
            cell.onclick = () => {
                if (tile.ownerType === "player" || tile.ownerType === "vassal") {
                    // open micromanagement for owned lands
                    manageRegion(tile.id);
                } else {
                    // default view for foreign/wilderness lands
                    Swal.fire({
                        title: tile.name,
                        html: `<b>Controlled by:</b> ${displayOwner}<br><b>Terrain:</b> ${tile.terrain}<br><br><i>Conquer this region to manage its development.</i>`,
                        background: '#f4e8c1',
                        confirmButtonColor: '#8b5a2b',
                        color: '#333'
                    });
                }
            };
            
            ui.mapGrid.appendChild(cell);
        });
    }
    }
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

    // 1. Feudal Regional Economy & Population Dynamics
    let regionalTaxes = 0;
    let regionalFood = 0;
    let totalRealmPop = 0;
    const harvestQuality = Math.random() + 0.5; // global weather modifier

    // process every single map tile independently
    gameState.mapTiles.forEach(tile => {
        if (tile.ownerType === "player" || tile.ownerType === "vassal") {
            // natural population growth (1% to 3% annually)
            tile.population = Math.floor(tile.population * (1.01 + (Math.random() * 0.02)));
            totalRealmPop += tile.population;

            // Feudal Tax Formula: (Pop / 10000) * Development * Wealth
            const localTax = Math.floor((tile.population / 10000) * tile.development * tile.wealth);
            regionalTaxes += localTax;

            // Regional Agriculture Formula: scales with pop and development
            const localFood = Math.floor(tile.population * harvestQuality * (1 + (tile.development * 0.1)));
            regionalFood += localFood;
        }
    });

    // dynamically update the global UI counter to reflect the total regions
    gameState.population = totalRealmPop;

    // Apply Upkeep and Totals
    const armyUpkeep = (gameState.army.infantry * 0.5) + (gameState.army.archers * 1) + (gameState.army.cavalry * 3); 
    const baseUpkeepCost = 100; 
    const totalUpkeep = baseUpkeepCost + totalBuildingUpkeep + armyUpkeep;
    
    const netProfit = (regionalTaxes + buildingGold) - totalUpkeep;
    gameState.gold += netProfit;

    const foodConsumed = gameState.population; // each person eats 1 food
    const netFood = (regionalFood + buildingFood) - foodConsumed;
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
    
    // filter the event pool based on current kingdom conditions
    const possibleEvents = events.filter(event => {
        // if an event doesn't have a condition attached, assume it can always happen
        if (!event.condition) return true;
        
        // otherwise, run the condition check against our current game state
        return event.condition(gameState);
    });

    // safety fallback: if somehow NO conditions are met, just use the full list
    const validEvents = possibleEvents.length > 0 ? possibleEvents : events;
    
    // pick a random event from the newly filtered list
    const randomEvent = validEvents[Math.floor(Math.random() * validEvents.length)];

    let eventText = randomEvent.text
        .replace(/{house}/g, gameState.houseName)
        .replace(/{title}/g, gameState.rulerTitle)
        .replace(/{spouse}/g, gameState.spouse ? gameState.spouse.name : "the Royal Consort")
        .replace(/{heir}/g, gameState.children.length > 0 ? gameState.children[0].name : "the heir");

    // build the highly detailed UI for the yearly report
    let reportHtml = `
        <div style="text-align: left; background: #eee; padding: 10px; border-radius: 5px; margin-bottom: 10px; font-size: 0.9em;">
            <b>Regional Taxes:</b> +${regionalTaxes} 🪙<br>
            ${buildingGold > 0 ? `<b style="color: #27ae60;">Infrastructure Income:</b> +${buildingGold} 🪙<br>` : ''}
            <b>Castle Upkeep:</b> -${baseUpkeepCost} 🪙<br>
            ${armyUpkeep > 0 ? `<b style="color: #c0392b;">Army Wages:</b> -${armyUpkeep} 🪙<br>` : ''}
            ${totalBuildingUpkeep > 0 ? `<b style="color: #c0392b;">Building Upkeep:</b> -${totalBuildingUpkeep} 🪙<br>` : ''}
            <div style="border-top: 1px solid #ccc; margin-top: 5px; padding-top: 5px;">
                <b>Net Gold:</b> ${netProfit >= 0 ? '+' : ''}${netProfit} 🪙
            </div>

            <hr style="border: 1px solid #ddd; margin: 8px 0;">
            
            <b>Regional Harvest:</b> +${regionalFood} 🌾<br>
            ${buildingFood > 0 ? `<b style="color: #27ae60;">Infrastructure Storage:</b> +${buildingFood} 🌾<br>` : ''}
            <b>Eaten:</b> -${foodConsumed} 🌾<br>
            <div style="border-top: 1px solid #ccc; margin-top: 5px; padding-top: 5px;">
                <b>Net Food:</b> ${netFood >= 0 ? '+' : ''}${netFood} 🌾
            </div>
            
            ${buildingPrestige > 0 ? `<div style="margin-top: 8px; color: #d35400;"><b>Passive Prestige:</b> +${buildingPrestige} 🌟</div>` : ''}
            ${starved > 0 ? `<br><b style="color:#c0392b; font-size: 1.1em;">Famine! ${starved} people starved to death.</b>` : ''}
        </div>
        <p style="margin-top: 15px;">${eventText}</p>
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
            name: `${babyName} ${gameState.houseName}`,
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
                text: 'You died with no heirs. The realm falls into chaos.',
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
        gameState.gold = 500;
        gameState.prestige = 50; 
        gameState.food = 150000; 
        gameState.army = { infantry: 0, archers: 0, cavalry: 0 };
        gameState.armyExperience = 0;
        gameState.landSize = 1;
        
        // wipe family and infrastructure
        gameState.children = [];
        gameState.historicalOffspring = [];
        gameState.spouse = null;
        gameState.pastRulers = [];
        gameState.neighbors = [];
        generateNeighbors();
        generateMap();
        
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

// opens the micromanagement dashboard for a player-owned region
function manageRegion(tileIndex) {
    const region = gameState.mapTiles[tileIndex];
    
    // scaling costs based on current development level
    const devCost = region.development * 50;
    const fortCost = region.defense * 10;

    Swal.fire({
        title: region.name,
        html: `
            <div style="text-align: left; color: var(--wood-dark); font-size: 1.1em;">
                <p><i class="fas fa-users" style="width: 25px;"></i> <b>Local Population:</b> ${region.population}</p>
                <p><i class="fas fa-coins" style="width: 25px;"></i> <b>Local Wealth:</b> ${region.wealth}</p>
                <p><i class="fas fa-hammer" style="width: 25px;"></i> <b>Development:</b> Level ${region.development}</p>
                <p><i class="fas fa-shield-halved" style="width: 25px;"></i> <b>Fortifications:</b> ${region.defense}</p>
            </div>
        `,
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: `Invest Dev (${devCost} 🪙)`,
        denyButtonText: `Build Fort (${fortCost} 🪙)`,
        cancelButtonText: 'Close',
        confirmButtonColor: '#27ae60',
        denyButtonColor: '#2980b9',
        background: '#f4e8c1',
        color: '#333'
    }).then((result) => {
        if (result.isConfirmed) {
            if (gameState.gold >= devCost) {
                gameState.gold -= devCost;
                region.development += 1;
                region.wealth += 15;
                addLogEntry(`Invested in the development of ${region.name}.`);
                saveGame();
                updateUI();
                manageRegion(tileIndex); // reload popup to show new stats
            } else {
                Swal.fire({ title: 'Not Enough Gold', icon: 'error', confirmButtonColor: '#8b5a2b', background: '#f4e8c1', color: '#333' });
            }
        } else if (result.isDenied) {
            if (gameState.gold >= fortCost) {
                gameState.gold -= fortCost;
                region.defense += 10;
                addLogEntry(`Expanded the fortifications in ${region.name}.`);
                saveGame();
                updateUI();
                manageRegion(tileIndex); 
            } else {
                Swal.fire({ title: 'Not Enough Gold', icon: 'error', confirmButtonColor: '#8b5a2b', background: '#f4e8c1', color: '#333' });
            }
        }
    });
}

// calculate capacity for specific unit types based on owned buildings
function getUnitCapacity(type) {
    let cap = type === 'infantry' ? 50 : 0; // baseline kingdom can only support 50 infantry
    
    if (type === 'infantry' && gameState.buildings.barracks) cap += gameState.buildings.barracks * buildingData.barracks.capInfantry;
    if (type === 'archers' && gameState.buildings.archery_range) cap += gameState.buildings.archery_range * buildingData.archery_range.capArchers;
    if (type === 'cavalry' && gameState.buildings.stables) cap += gameState.buildings.stables * buildingData.stables.capCavalry;
    
    return cap;
}

// draft specific unit types into the standing army
function recruitUnit(type) {
    const cap = getUnitCapacity(type);
    const current = gameState.army[type] || 0;
    
    // higher tier units cost more to outfit
    const costs = { infantry: 2, archers: 4, cavalry: 10 };
    const unitCost = costs[type];

    if (current >= cap) {
        Swal.fire({ title: 'Capacity Reached', text: `Build more military infrastructure to support more ${type}.`, icon: 'warning', confirmButtonColor: '#8b5a2b', background: '#f4e8c1', color: '#333' });
        return;
    }

    Swal.fire({
        title: `Draft ${type.charAt(0).toUpperCase() + type.slice(1)}`,
        text: `Available Capacity: ${current} / ${cap}. (Cost: ${unitCost} 🪙 per soldier)`,
        input: 'number',
        inputAttributes: { min: 1, max: cap - current },
        showCancelButton: true,
        confirmButtonText: 'Recruit',
        confirmButtonColor: '#c0392b',
        background: '#f4e8c1',
        color: '#333'
    }).then((result) => {
        if (result.isConfirmed && result.value > 0) {
            const amount = parseInt(result.value);
            const totalCost = amount * unitCost;

            const currentTotalTroops = gameState.army.infantry + gameState.army.archers + gameState.army.cavalry;
            if (currentTotalTroops + amount > 0) {
                gameState.armyExperience = Math.floor(((gameState.armyExperience || 0) * currentTotalTroops) / (currentTotalTroops + amount));
            }

            if (gameState.gold >= totalCost && gameState.population > amount) {
                gameState.gold -= totalCost; 
                gameState.army[type] += amount;

                // dynamically pull the required drafted men from your most populated regions
                let remainingDraft = amount;
                const playerTiles = gameState.mapTiles
                    .filter(t => t.ownerType === "player" || t.ownerType === "vassal")
                    .sort((a, b) => b.population - a.population); // sort largest to smallest
                
                for (let pt of playerTiles) {
                    if (remainingDraft <= 0) break;
                    // never draft a region below 100 people so it doesn't completely wipe out
                    const take = Math.min(pt.population - 100, remainingDraft); 
                    if (take > 0) {
                        pt.population -= take;
                        remainingDraft -= take;
                    }
                }
                
                addLogEntry(`Drafted ${amount} ${type} into the royal army.`);
                saveGame();
                updateUI();
            } else {
                Swal.fire({ title: 'Cannot Recruit', text: 'You lack the gold or available peasantry to draft these troops!', icon: 'error', confirmButtonColor: '#8b5a2b', background: '#f4e8c1', color: '#333' });
            }
        }
    });
}

// procedurally generate neighboring kingdoms to interact with
function generateNeighbors() {
    if (gameState.neighbors && gameState.neighbors.length > 0) return;
    
    gameState.neighbors = [];
    const prefixes = ["North", "South", "East", "West", "Upper", "Lower", "New"];
    const bases = ["Mercia", "Wessex", "Frankia", "Aquitaine", "Lombardy", "Saxony", "Pictland", "Frisia", "Burgundy", "Caledonia", "Gothia"];
    
    // request exactly 20 unique colors for 20 permanent AI realms
    const mapColors = generateUniqueColors(20); 
    
    const usedNames = new Set();
    
    while (gameState.neighbors.length < 20) {
        let realmName;
        // keep rolling a new name until we get one that isn't in the usedNames set
        do {
            const usePrefix = Math.random() > 0.5;
            realmName = (usePrefix ? prefixes[Math.floor(Math.random() * prefixes.length)] + " " : "") + bases[Math.floor(Math.random() * bases.length)];
        } while (usedNames.has(realmName));
        
        usedNames.add(realmName); // mark this name as taken
        
        const isStrong = Math.random() > 0.6; 
        
        gameState.neighbors.push({
            name: realmName,
            army: {
                infantry: Math.floor((Math.random() * 50 + 20) * (isStrong ? 2 : 1)),
                archers: Math.floor((Math.random() * 30 + 10) * (isStrong ? 2 : 1)),
                cavalry: Math.floor((Math.random() * 20 + 5) * (isStrong ? 2 : 1))
            },
            wealth: isStrong ? Math.floor(Math.random() * 300) + 200 : Math.floor(Math.random() * 100) + 50,
            land: 0, 
            scouted: false,
            isDefeated: false,
            color: mapColors[gameState.neighbors.length] 
        });
    }
}

// Dynamically generate guaranteed unique colors using HSL distribution
function generateUniqueColors(count) {
    const colors = [];
    for (let i = 0; i < count; i++) {
        // distribute hues evenly across the 360-degree color wheel
        const hue = Math.floor((360 / count) * i);
        colors.push(`hsl(${hue}, 65%, 45%)`);
    }
    // shuffle the array so neighbor colors aren't clustered in rainbow order
    return colors.sort(() => Math.random() - 0.5);
}

// Gets adjacent tile indices for a 15x15 grid
function getAdjacent(index) {
    const adj = [];
    const x = index % 15;
    const y = Math.floor(index / 15);
    if (x > 0) adj.push(index - 1); 
    if (x < 14) adj.push(index + 1); 
    if (y > 0) adj.push(index - 15); 
    if (y < 14) adj.push(index + 15); 
    return adj;
}

// generates a 15x15 map with terrain and flood-fill contiguous borders
function generateMap() {
    const terrainTypes = ["Plains", "Plains", "Forest", "Forest", "Hills", "Mountains"];
    
    // create 225 tiles with random geographic terrain
    gameState.mapTiles = new Array(225).fill(null).map((_, i) => ({ 
        id: i, 
        ownerType: "wilderness", 
        ownerId: null, 
        name: "Wilderness",
        terrain: terrainTypes[Math.floor(Math.random() * terrainTypes.length)],

        population: Math.floor(Math.random() * 20000) + 5000,
        wealth: Math.floor(Math.random() * 5) + 1, //
        defense: 10, 
        development: 1 
    }));

    // randomly place player capital safely within the grid bounds
    const pX = Math.floor(Math.random() * 9) + 3; 
    const pY = Math.floor(Math.random() * 9) + 3;
    const pIndex = (pY * 15) + pX;

    gameState.mapTiles[pIndex].ownerType = "player";
    gameState.mapTiles[pIndex].name = "The Capital";
    gameState.mapTiles[pIndex].population = Math.floor(Math.random() * 30000) + 50000; // 50k - 80k
    gameState.mapTiles[pIndex].development = 3;
    gameState.mapTiles[pIndex].wealth = 5;
    
    const playerAdj = getAdjacent(pIndex);
    playerAdj.forEach(adj => {
        gameState.mapTiles[adj].ownerType = "vassal";
        gameState.mapTiles[adj].name = "Vassal State";
    });

    let seeds = [];
    gameState.neighbors.forEach((n, idx) => {
        let seedIndex;
        do {
            seedIndex = Math.floor(Math.random() * 225);
        } while (gameState.mapTiles[seedIndex].ownerType !== "wilderness");

        gameState.mapTiles[seedIndex].ownerType = "neighbor";
        gameState.mapTiles[seedIndex].ownerId = idx;
        gameState.mapTiles[seedIndex].name = `${n.name} Region`;
        
        // strong AI gets 10-14 tiles, weak gets 4-7 tiles
        const targetSize = (Math.random() > 0.5 ? Math.floor(Math.random() * 5) + 10 : Math.floor(Math.random() * 4) + 4);
        seeds.push({ index: seedIndex, targetCount: targetSize, currentCount: 1, ownerId: idx, name: n.name });
    });

    let isExpanding = true;
    while(isExpanding) {
        isExpanding = false;
        seeds.forEach(seed => {
            if (seed.currentCount < seed.targetCount) {
                let possibleMoves = [];
                gameState.mapTiles.forEach((t, i) => {
                    if (t.ownerType === "neighbor" && t.ownerId === seed.ownerId) {
                        getAdjacent(i).forEach(adj => {
                            if (gameState.mapTiles[adj].ownerType === "wilderness" && !possibleMoves.includes(adj)) {
                                possibleMoves.push(adj);
                            }
                        });
                    }
                });

                if (possibleMoves.length > 0) {
                    const picked = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
                    gameState.mapTiles[picked].ownerType = "neighbor";
                    gameState.mapTiles[picked].ownerId = seed.ownerId;
                    gameState.mapTiles[picked].name = `${seed.name} Region`;
                    seed.currentCount++;
                    isExpanding = true; 
                }
            }
        });
    }

    // Update AI land stat to perfectly match the exact number of tiles they claimed
    gameState.neighbors.forEach((n, idx) => {
        n.land = gameState.mapTiles.filter(t => t.ownerType === "neighbor" && t.ownerId === idx).length;
    });

    // Set player base land size to their initial tile count
    gameState.landSize = gameState.mapTiles.filter(t => t.ownerType === "player" || t.ownerType === "vassal").length;
}

// checks if the player's realm (crownlands or vassals) shares a border with the target neighbor
function isBorderingNeighbor(neighborIndex) {
    let playerControlled = [];
    let enemyControlled = [];

    // map out who owns what
    gameState.mapTiles.forEach((t, i) => {
        if (t.ownerType === "player" || t.ownerType === "vassal") playerControlled.push(i);
        if (t.ownerType === "neighbor" && t.ownerId === neighborIndex) enemyControlled.push(i);
    });

    // check for touching borders
    for (let pt of playerControlled) {
        const adjs = getAdjacent(pt);
        for (let a of adjs) {
            if (enemyControlled.includes(a)) return true;
        }
    }
    return false;
}

// spend gold to reveal the exact unit composition of a neighbor
function scoutNeighbor(index) {
    const cost = 50; // cost to fund a spy network

    if (gameState.gold < cost) {
        Swal.fire({ title: 'Treasury Empty', text: `You need ${cost} gold to fund the spy network.`, icon: 'warning', confirmButtonColor: '#8b5a2b', background: '#f4e8c1', color: '#333' });
        return;
    }

    gameState.gold -= cost;
    gameState.neighbors[index].scouted = true; // lift the fog of war for this specific realm
    
    addLogEntry(`Spies have returned from ${gameState.neighbors[index].name}, revealing their troop formations.`);
    saveGame();
    updateUI();
}

// display a detailed intelligence dossier for a fully scouted realm
function viewRealmInfo(index) {
    const target = gameState.neighbors[index];
    const totalTroops = target.army.infantry + target.army.archers + target.army.cavalry;

    // analyze the specific terrain tiles owned by this realm
    const controlledTiles = gameState.mapTiles.filter(t => t.ownerType === "neighbor" && t.ownerId === index);
    const terrainCounts = { "Plains": 0, "Forest": 0, "Hills": 0, "Mountains": 0 };
    controlledTiles.forEach(t => terrainCounts[t.terrain]++);

    let terrainHtml = "";
    if (terrainCounts["Plains"] > 0) terrainHtml += `<div style="margin-left: 10px;"><i class="fas fa-seedling" style="width: 25px; color: #1aff0191;"></i> Plains: ${terrainCounts["Plains"]} regions</div>`;
    if (terrainCounts["Forest"] > 0) terrainHtml += `<div style="margin-left: 10px;"><i class="fas fa-tree" style="width: 25px; color: #006d10;"></i> Forests: ${terrainCounts["Forest"]} regions</div>`;
    if (terrainCounts["Hills"] > 0) terrainHtml += `<div style="margin-left: 10px;"><i class="fas fa-mound" style="width: 25px; color: #008b1c;"></i> Hills: ${terrainCounts["Hills"]} regions</div>`;
    if (terrainCounts["Mountains"] > 0) terrainHtml += `<div style="margin-left: 10px;"><i class="fas fa-mountain" style="width: 25px; color: #2c3e50;"></i> Mountains: ${terrainCounts["Mountains"]} regions</div>`;

    Swal.fire({
        title: `Intelligence Report`,
        html: `
            <div style="text-align: left; font-size: 1.1em; line-height: 1.6; color: var(--wood-dark);">
                <h3 style="margin-top: 0; color: ${target.color}; text-align: center; text-shadow: 1px 1px 1px rgba(0,0,0,0.2);">${target.name}</h3>
                <p><b><i class="fas fa-coins" style="width: 25px;"></i> Treasury:</b> ${target.wealth} Gold</p>
                <p><b><i class="fas fa-swords" style="width: 25px;"></i> Total Garrison:</b> ~${totalTroops} Men</p>
                
                <hr style="border-top: 1px dashed var(--wood-light); margin: 15px 0;">
                
                <h4 style="margin: 0 0 5px 0;"><i class="fas fa-map" style="width: 25px;"></i> Geographic Hold (${target.land} Total):</h4>
                <div style="font-size: 0.9em; color: #555; margin-bottom: 15px; border-left: 3px solid ${target.color}; padding-left: 8px;">
                    ${terrainHtml}
                </div>

                <h4 style="margin: 0 0 10px 0;">Confirmed Unit Composition:</h4>
                <div style="display: flex; flex-direction: column; gap: 8px; background: rgba(0,0,0,0.05); padding: 10px; border-radius: 5px; border: 1px solid rgba(0,0,0,0.1);">
                    <div><i class="fas fa-shield" style="width: 25px; color: #7f8c8d;"></i> <b>Infantry:</b> ${target.army.infantry}</div>
                    <div><i class="fas fa-bullseye" style="width: 25px; color: #27ae60;"></i> <b>Archers:</b> ${target.army.archers}</div>
                    <div><i class="fas fa-horse" style="width: 25px; color: #d35400;"></i> <b>Cavalry:</b> ${target.army.cavalry}</div>
                </div>
            </div>
        `,
        icon: 'info',
        confirmButtonText: 'Close Dossier',
        confirmButtonColor: '#8b5a2b',
        background: '#f4e8c1',
        color: '#333'
    });
}

// execute a tactical military campaign against a specific neighbor
function attackNeighbor(index, type) {
    const target = gameState.neighbors[index];
    const pArmy = gameState.army;
    const eArmy = target.army;
    const vetBonus = 1.0 + ((gameState.armyExperience || 0) * 0.005);

    // prevent attacking realms that don't share a physical border
    if (!isBorderingNeighbor(index)) {
        Swal.fire({ title: 'Too Far!', text: 'You can only attack realms that share a physical border with your territories.', icon: 'warning', confirmButtonColor: '#8b5a2b', background: '#f4e8c1', color: '#333' });
        return;
    }

    const totalPlayerTroops = pArmy.infantry + pArmy.archers + pArmy.cavalry;
    const totalEnemyTroops = eArmy.infantry + eArmy.archers + eArmy.cavalry;

    if (totalPlayerTroops <= 0) {
        Swal.fire({ title: 'No Army', text: 'You have no soldiers to send into battle!', icon: 'error', confirmButtonColor: '#8b5a2b', background: '#f4e8c1', color: '#333' });
        return;
    }

    // 1. roll for random battlefield terrain
    const terrains = [
        { name: "Open Plains", buff: "Cavalry is highly effective.", effect: (force) => { force.cavMult *= 1.5; } },
        { name: "Dense Forest", buff: "Infantry thrives, Cavalry struggles.", effect: (force) => { force.infMult *= 1.2; force.cavMult *= 0.5; } },
        { name: "High Hills", buff: "Archers have the high ground.", effect: (force) => { force.arcMult *= 1.5; } }
    ];
    const terrain = terrains[Math.floor(Math.random() * terrains.length)];

    // 2. setup base multipliers and apply terrain
    let pForce = { infMult: 1, arcMult: 1, cavMult: 1 };
    let eForce = { infMult: 1, arcMult: 1, cavMult: 1 };

    terrain.effect(pForce);
    terrain.effect(eForce);

    // 3. rock-paper-scissors logic
    // Inf beats Cav, Arc beats Inf, Cav beats Arc. 
    // They gain up to +50% power depending on how much of their prey is in the enemy army.
    pForce.infMult += 0.5 * (eArmy.cavalry / (totalEnemyTroops || 1));
    pForce.arcMult += 0.5 * (eArmy.infantry / (totalEnemyTroops || 1));
    pForce.cavMult += 0.5 * (eArmy.archers / (totalEnemyTroops || 1));

    eForce.infMult += 0.5 * (pArmy.cavalry / (totalPlayerTroops || 1));
    eForce.arcMult += 0.5 * (pArmy.infantry / (totalPlayerTroops || 1));
    eForce.cavMult += 0.5 * (pArmy.archers / (totalPlayerTroops || 1));

    // add a slight random tactical variance (simulating general skill/luck)
    const pTactics = 1.0 + (Math.random() * 0.2);
    const eTactics = 1.0 + (Math.random() * 0.2);

    // calculate final combat power
    const playerPower = (pArmy.infantry * pForce.infMult + pArmy.archers * pForce.arcMult + pArmy.cavalry * pForce.cavMult) * pTactics * vetBonus;
    const enemyPower = (eArmy.infantry * eForce.infMult + eArmy.archers * eForce.arcMult + eArmy.cavalry * eForce.cavMult) * eTactics;

    let isVictory = playerPower >= enemyPower;
    let resultHtml = `<div style="font-size: 0.9em; color: #555; margin-bottom: 10px; border-bottom: 1px solid #ccc; padding-bottom: 5px;"><b>Terrain:</b> ${terrain.name}<br><i>${terrain.buff}</i></div>`;

    // 4. casualties math (winners lose 10-30%, losers lose 50-80%)
    const lossRateP = isVictory ? (0.1 + Math.random() * 0.2) : (0.5 + Math.random() * 0.3);
    
    const lostInf = Math.floor(pArmy.infantry * lossRateP);
    const lostArc = Math.floor(pArmy.archers * lossRateP);
    const lostCav = Math.floor(pArmy.cavalry * lossRateP);
    
    gameState.army.infantry -= lostInf;
    gameState.army.archers -= lostArc;
    gameState.army.cavalry -= lostCav;

    const totalLost = lostInf + lostArc + lostCav;

    // 5. apply battle results
    if (isVictory) {
        // grant experience for ANY victory (both raid and conquer)
        const expGained = Math.floor(Math.random() * 8) + 4; 
        gameState.armyExperience = Math.min(100, (gameState.armyExperience || 0) + expGained);

        if (type === 'raid') {
            const loot = target.wealth;
            gameState.gold += loot;
            target.wealth = Math.floor(target.wealth / 2);
            
            resultHtml += `<b>Victory!</b> Your tactical formation broke the enemy lines.<br><br><b>Loot:</b> +${loot} 🪙<br><b style="color: #c0392b;">Losses:</b> -${totalLost} troops<br><b style="color: #f39c12;">Veterancy:</b> +${expGained} Exp<br><span style="font-size: 0.8em; color: #666;">(${lostInf} Inf, ${lostArc} Arc, ${lostCav} Cav)</span>`;
            addLogEntry(`Successfully raided ${target.name} for ${loot} gold.`);
        } else if (type === 'conquer') {
            gameState.landSize += target.land;
            gameState.prestige += 50;
            
            resultHtml += `<b>Total Victory!</b> You have conquered ${target.name}.<br><br><b>Territory:</b> +${target.land} Land<br><b>Prestige:</b> +50 🌟<br><b style="color: #c0392b;">Losses:</b> -${totalLost} troops<br><b style="color: #f39c12;">Veterancy:</b> +${expGained} Exp`;
            addLogEntry(`Conquered the realm of ${target.name}! They have been wiped from the map.`);
            
            // NEW WORLD MAP CONQUEST LOGIC:
            target.isDefeated = true; // Mark them as dead
            
            // Loop through the map and claim all their tiles for the player!
            gameState.mapTiles.forEach(tile => {
                if (tile.ownerType === "neighbor" && tile.ownerId === index) {
                    tile.ownerType = "player"; // paint it green
                    tile.name = `Conquered ${target.name}`;
                }
            });
        }
    } else {
        gameState.prestige -= 20;
        resultHtml += `<b>Defeat.</b> Your forces were outmaneuvered by ${target.name}.<br><br><b style="color: #c0392b;">Losses:</b> -${totalLost} troops<br><span style="font-size: 0.8em; color: #666;">(${lostInf} Inf, ${lostArc} Arc, ${lostCav} Cav)</span><br><b>Prestige:</b> -20 🌟`;
        addLogEntry(`Suffered a crushing tactical defeat against ${target.name}.`);
    }

    Swal.fire({
        title: 'Battle Report',
        html: resultHtml,
        icon: isVictory ? 'success' : 'error',
        confirmButtonColor: '#8b5a2b',
        background: '#f4e8c1',
        color: '#333'
    }).then(() => {
        saveGame();
        updateUI();
    });
}

// adds an event to the kingdom's history and keeps the last 50 entries
function addLogEntry(message) {
    if (!gameState.logs) gameState.logs = [];
    
    // add new log to the top of the list with the current year
    gameState.logs.unshift({ year: gameState.year || 1, text: message });
    
    // trim old logs so the save file doesn't get massive
    if (gameState.logs.length > 50) gameState.logs.pop();
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