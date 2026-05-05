// ai.js - JS Grand Strategy Autonomous Engine v4.0 (Internal Politics Update)

// AI Archetypes with distinct behaviors and priorities. These influence their decision-making across all systems.
const AI_ARCHETYPES = [
    { name: "Warlord", draftWeight: 0.7, econWeight: 0.3, aggression: 0.9, peaceThreshold: -20, bravery: 0.8, paranoia: 0.4, tyranny: 0.8 },
    { name: "Builder", draftWeight: 0.3, econWeight: 0.7, aggression: 0.2, peaceThreshold: 20, bravery: 1.5, paranoia: 0.8, tyranny: 0.2 },
    { name: "Opportunist", draftWeight: 0.5, econWeight: 0.5, aggression: 0.6, peaceThreshold: 0, bravery: 1.2, paranoia: 0.6, tyranny: 0.5 },
    { name: "Diplomat", draftWeight: 0.2, econWeight: 0.6, aggression: 0.1, peaceThreshold: 40, bravery: 2.0, paranoia: 0.2, tyranny: 0.1 } // New Archetype
];

// AI Agendas represent the current long-term focus of each AI realm, guiding their strategic decisions and priorities.
const AGENDAS = {
    CONSOLIDATE: "Consolidating Power",
    MILITARIZING: "Militarizing",
    EXPANSION: "Seeking Expansion",
    SURVIVAL: "Seeking Coalitions",
    TRADE: "Establishing Trade", 
    QUELLING_UNREST: "Suppressing Rebels" 
};

// Core Turn Processor
function processAITurn() {
    if (!gameState.neighbors) return;

    const playerPower = gameState.army.infantry + gameState.army.archers + (gameState.army.cavalry * 2);
    const playerSize = gameState.mapTiles.filter(t => t.ownerType === "player" || t.ownerType === "vassal").length;
    const globalPlayerThreat = playerPower + (playerSize * 500);

    // Initialize the Global Mercenary Pool if it doesn't exist
    if (!gameState.mercenaries) {
        gameState.mercenaries = [
            { id: "merc_1", name: "The Iron Company", cost: 300, upkeep: 50, army: { infantry: 1500, archers: 500, cavalry: 100 }, hiredBy: null },
            { id: "merc_2", name: "The Black Riders", cost: 500, upkeep: 100, army: { infantry: 500, archers: 500, cavalry: 1000 }, hiredBy: null },
            { id: "merc_3", name: "The Free Spears", cost: 150, upkeep: 25, army: { infantry: 800, archers: 200, cavalry: 0 }, hiredBy: null }
        ];
    }

    gameState.neighbors.forEach((aiRealm, index) => {
        if (aiRealm.isDefeated) return;

        // Dynasty and Ruler System
        if (!aiRealm.ruler) {
            aiRealm.ruler = {
                name: `King ${['Aethelred', 'Clovis', 'Harald', 'Otto', 'William', 'Charles'][Math.floor(Math.random() * 6)]} the ${['Bold', 'Cruel', 'Wise', 'Just', 'Fat'][Math.floor(Math.random() * 5)]}`,
                age: 20 + Math.floor(Math.random() * 30)
            };
        }
        
        if (!aiRealm.activeWars) aiRealm.activeWars = []; 
        if (!aiRealm.aiRelations) aiRealm.aiRelations = {}; 

        // Deep State Variables
        if (!aiRealm.archetype) aiRealm.archetype = AI_ARCHETYPES[Math.floor(Math.random() * AI_ARCHETYPES.length)];
        if (!aiRealm.deployedArmy) aiRealm.deployedArmy = { infantry: 0, archers: 0, cavalry: 0 };
        if (!aiRealm.memory) aiRealm.memory = { grudges: 0, trust: 50, consecutiveYearsAtPeace: 0 };
        if (!aiRealm.allies) aiRealm.allies = [];
        if (!aiRealm.tradeRoutes) aiRealm.tradeRoutes = [];
        if (aiRealm.vassalOf === undefined) aiRealm.vassalOf = null;
        if (!aiRealm.vassals) aiRealm.vassals = [];
        if (!aiRealm.factions) aiRealm.factions = { nobles: { loyalty: 50, influence: 50 }, peasants: { loyalty: 50, unrest: 0 } };
        if (!aiRealm.agenda) aiRealm.agenda = { type: AGENDAS.CONSOLIDATE, timer: 0 };
        
        // NEW: Espionage Network Initialization
        if (!aiRealm.espionage) aiRealm.espionage = { 
            activeMission: null, // "assassinate", "sabotage", "dissent"
            targetId: null,      // AI index or "player"
            progress: 0,         // 0 to 100
            networkStrength: 10 + Math.floor(Math.random() * 20) 
        };
        // NEW: Hired Mercenaries Array
        if (!aiRealm.hiredMercenaries) aiRealm.hiredMercenaries = [];

        aiManageDynasty(aiRealm, index); 
        aiManageInternalPolitics(aiRealm, index); 
        aiManageVassalRebellions(aiRealm, index); // NEW: Check if vassals want to rebel
        aiManageAgendas(aiRealm, index, globalPlayerThreat);
        aiManageEconomy(aiRealm, index);
        aiManageTrade(aiRealm, index); 
        aiManageMercenaries(aiRealm, index);      // NEW: Hire/fire mercenaries
        aiRecruitArmy(aiRealm);
        aiManageTactics(aiRealm, index); 
        aiManageDiplomacy(aiRealm, index, globalPlayerThreat); 
        aiManageEspionage(aiRealm, index);        // NEW: Run covert operations
        aiManageEmpireFormation(aiRealm, index);  // NEW: Check for dynamic renaming
    });
}

// 1. The Agenda Engine (Long-Term Planning)
function aiManageAgendas(aiRealm, aiIndex, playerThreat) {
    const aiPower = aiRealm.army.infantry + aiRealm.army.archers + aiRealm.army.cavalry;
    
    if (aiRealm.agenda.timer > 0) aiRealm.agenda.timer--;

    if (aiRealm.agenda.timer <= 0 || aiRealm.status === "war") {
        
        if (aiRealm.status === "war") {
            aiRealm.agenda = { type: "AT WAR", timer: 1 };
            aiRealm.memory.consecutiveYearsAtPeace = 0;
            return;
        }

        aiRealm.memory.consecutiveYearsAtPeace++;

        // Priority 1: Internal Stability
        if (aiRealm.factions.peasants.unrest > 60) {
            aiRealm.agenda = { type: AGENDAS.QUELLING_UNREST, timer: 2 };
        }
        // Priority 2: Survival
        else if (playerThreat > aiPower * 3 && aiRealm.relationship < 0) {
            aiRealm.agenda = { type: AGENDAS.SURVIVAL, timer: 5 };
        } 
        // Priority 3: Economy / Trade (Especially for Builders and Diplomats)
        else if ((aiRealm.archetype.name === "Builder" || aiRealm.archetype.name === "Diplomat") && aiRealm.memory.consecutiveYearsAtPeace > 3) {
            aiRealm.agenda = { type: AGENDAS.TRADE, timer: 4 };
        }
        // Priority 4: War Preparation
        else if (aiRealm.archetype.name === "Warlord" && aiRealm.memory.consecutiveYearsAtPeace > 5 && Math.random() < 0.5) {
            aiRealm.agenda = { type: AGENDAS.MILITARIZING, timer: 3 };
        }
        else if (aiRealm.agenda.type === AGENDAS.MILITARIZING && aiRealm.memory.consecutiveYearsAtPeace > 8) {
            aiRealm.agenda = { type: AGENDAS.EXPANSION, timer: 2 };
        }
        else {
            aiRealm.agenda = { type: AGENDAS.CONSOLIDATE, timer: 5 };
        }
    }
}

// 2. Dynamic Economy (Scales based on Agenda)
function aiManageEconomy(aiRealm, aiIndex) {
    let regionalTaxes = 0;
    const harvestQuality = 0.85 + (Math.random() * 0.30);
    let ownedTiles = [];

    gameState.mapTiles.forEach(tile => {
        if (tile.ownerType === "neighbor" && tile.ownerId === aiIndex) {
            ownedTiles.push(tile);
            tile.population = Math.floor(tile.population * (1.005 + (Math.random() * 0.01)));
            // FIX: Slightly boosted AI tax collection so they can survive
            regionalTaxes += Math.floor((tile.population / 8000) * tile.development * tile.wealth);
        }
    });

    const aiUpkeep = Math.ceil((aiRealm.army.infantry * 0.002) + (aiRealm.army.archers * 0.004) + (aiRealm.army.cavalry * 0.01));
    aiRealm.wealth = Math.max(0, (aiRealm.wealth || 0) + regionalTaxes - aiUpkeep);

    // If Consolidating or Surviving, heavily invest in fortresses and development
    if (aiRealm.agenda.type === AGENDAS.CONSOLIDATE || aiRealm.agenda.type === AGENDAS.SURVIVAL) {
        const devBudget = aiRealm.wealth * 0.8; // Spend almost everything on infrastructure
        if (devBudget > 50 && ownedTiles.length > 0) {
            let targetTile = ownedTiles[Math.floor(Math.random() * ownedTiles.length)];
            
            if (aiRealm.archetype.name === "Builder" && devBudget >= targetTile.development * 25) {
                aiRealm.wealth -= targetTile.development * 25;
                targetTile.development++;
                targetTile.wealth += 2; 
            } else if (devBudget >= targetTile.defense * 2) {
                aiRealm.wealth -= targetTile.defense * 2;
                targetTile.defense += 2; 
            }
        }
    }
}

// 3. Dynamic Recruitment (Scales based on Agenda)
function aiRecruitArmy(aiRealm) {
    // If Militarizing, spend 90% of wealth on troops. If Consolidating, only 20%.
    let draftModifier = aiRealm.archetype.draftWeight;
    if (aiRealm.agenda.type === AGENDAS.MILITARIZING) draftModifier = 0.9;
    if (aiRealm.agenda.type === AGENDAS.CONSOLIDATE) draftModifier = 0.2;

    const budget = aiRealm.wealth * draftModifier;
    
    if (budget > 10) {
        const infToDraft = Math.floor((budget * 0.5) / 0.1); 
        const arcToDraft = Math.floor((budget * 0.3) / 0.5);
        const cavToDraft = Math.floor((budget * 0.2) / 1.0); 

        aiRealm.army.infantry += infToDraft;
        aiRealm.army.archers += arcToDraft;
        aiRealm.army.cavalry += cavToDraft;
        aiRealm.wealth -= ((infToDraft * 0.1) + (arcToDraft * 0.5) + (cavToDraft * 1.0));
    }
}

// 4. Advanced Tactics
function aiManageTactics(aiRealm, aiIndex) {
    if (aiRealm.activeWars.length === 0 && aiRealm.status !== "war") return;

    const availableInf = aiRealm.army.infantry;
    const availableArc = aiRealm.army.archers;
    const aiPower = availableInf + availableArc + aiRealm.army.cavalry;

    // INTELLIGENCE A: Active Defense (Crush sieges on their own land, regardless of who is attacking)
    let underSiegeTiles = gameState.mapTiles.filter(t => t.ownerType === "neighbor" && t.ownerId === aiIndex && t.siegeForce && t.siegeForce.attackerId !== aiIndex);
    
    if (underSiegeTiles.length > 0) {
        let target = underSiegeTiles[0]; 
        let enemySiegePower = target.siegeForce.infantry + target.siegeForce.archers;

        if (aiPower >= enemySiegePower * aiRealm.archetype.bravery) {
            // Apply casualties to the defender who marched out
            aiRealm.army.infantry = Math.max(0, aiRealm.army.infantry - Math.floor(enemySiegePower * 0.3)); 
            
            // Apply catastrophic casualties to the siege camp (Player OR AI)
            if (target.siegeForce.attacker === "player") {
                gameState.warCasualties += enemySiegePower;
                gameState.deployedArmy.infantry -= target.siegeForce.infantry;
                gameState.deployedArmy.archers -= target.siegeForce.archers;
            } else {
                let enemyAI = gameState.neighbors[target.siegeForce.attackerId];
                if (enemyAI) {
                    enemyAI.deployedArmy.infantry -= target.siegeForce.infantry;
                    enemyAI.deployedArmy.archers -= target.siegeForce.archers;
                }
            }

            target.siegeForce = null;
            target.siegeProgress = 0;
            
            addLogEntry(`Year ${gameState.age}: The armies of ${aiRealm.name} marched out and crushed the siege camp at ${target.name}!`);
            updateUI();
            return; 
        }
    }

    // INTELLIGENCE C: Universal Invasion (Attack any enemy border)
    if (availableInf + availableArc > 500) {
        let borderTiles = [];
        
        gameState.mapTiles.forEach((tile, tileId) => {
            // Check if this tile belongs to an enemy
            let isEnemyTile = false;
            if ((tile.ownerType === "player" || tile.ownerType === "vassal") && (aiRealm.status === "war" || aiRealm.activeWars.includes("player"))) {
                isEnemyTile = true;
            } else if (tile.ownerType === "neighbor" && aiRealm.activeWars.includes(tile.ownerId)) {
                isEnemyTile = true;
            }

            if (isEnemyTile && !tile.siegeForce && !tile.isOccupied) {
                // Check if it borders the AI
                const adjs = getAdjacent(tileId);
                const bordersAI = adjs.some(adjId => gameState.mapTiles[adjId].ownerId === aiIndex);
                if (bordersAI) {
                    borderTiles.push(tile);
                }
            }
        });

        if (borderTiles.length > 0) {
            borderTiles.sort((a, b) => a.defense - b.defense); // Find weakest enemy border globally
            let targetTile = borderTiles[0];

            const infToDeploy = Math.floor(availableInf * 0.7);
            const arcToDeploy = Math.floor(availableArc * 0.7);

            aiRealm.army.infantry -= infToDeploy;
            aiRealm.army.archers -= arcToDeploy;
            aiRealm.deployedArmy.infantry += infToDeploy;
            aiRealm.deployedArmy.archers += arcToDeploy;

            targetTile.siegeForce = { 
                infantry: infToDeploy, archers: arcToDeploy, cavalry: 0, 
                attacker: "ai", attackerId: aiIndex 
            };
            targetTile.siegeProgress = 0;
            targetTile.siegeMode = 'starve'; 

            let targetName = targetTile.ownerType === "player" ? "your realm" : gameState.neighbors[targetTile.ownerId].name;
            addLogEntry(`Year ${gameState.age}: ⚔️ Crossing the border into ${targetName}, the forces of ${aiRealm.name} have laid siege to ${targetTile.name}!`);
            updateUI();
        }
    }

    if (availableInf + availableArc > 500) {
        let occupiedTiles = gameState.mapTiles.filter(t => t.ownerType === "neighbor" && t.ownerId === aiIndex && t.isOccupied && t.occupyingRealm === "player");
        
        let borderTiles = [];
        gameState.mapTiles.forEach((tile, tileId) => {
            if (tile.ownerType === "player" || tile.ownerType === "vassal") {
                const adjs = getAdjacent(tileId);
                const bordersEnemy = adjs.some(adjId => gameState.mapTiles[adjId].ownerId === aiIndex);
                if (bordersEnemy && !tile.siegeForce && !tile.isOccupied) {
                    borderTiles.push(tile);
                }
            }
        });

        let targetTile = null;
        if (occupiedTiles.length > 0) targetTile = occupiedTiles[0]; 
        else if (borderTiles.length > 0) {
            borderTiles.sort((a, b) => a.defense - b.defense); 
            targetTile = borderTiles[0];
        }

        if (targetTile) {
            const infToDeploy = Math.floor(availableInf * 0.7);
            const arcToDeploy = Math.floor(availableArc * 0.7);

            aiRealm.army.infantry -= infToDeploy;
            aiRealm.army.archers -= arcToDeploy;
            aiRealm.deployedArmy.infantry += infToDeploy;
            aiRealm.deployedArmy.archers += arcToDeploy;

            targetTile.siegeForce = { 
                infantry: infToDeploy, archers: arcToDeploy, cavalry: 0, 
                attacker: "ai", attackerId: aiIndex 
            };
            targetTile.siegeProgress = 0;
            targetTile.siegeMode = 'starve'; 

            const actionText = targetTile.ownerType === "neighbor" ? "to liberate" : "and laid siege to";
            addLogEntry(`Year ${gameState.age}: Seeking weakness, the forces of ${aiRealm.name} have marched ${actionText} ${targetTile.name}!`);
            updateUI();
        }
    }
}

// 5. The Grand Diplomatic Network (Coalitions & Grudges)
function aiManageDiplomacy(aiRealm, aiIndex, playerThreat) {
    const aiPower = aiRealm.army.infantry + aiRealm.army.archers + aiRealm.army.cavalry;

    // INTELLIGENCE: Evaluate other AIs for War
    if (aiRealm.agenda.type === AGENDAS.EXPANSION && aiRealm.activeWars.length === 0 && aiRealm.status !== "war") {
        
        // Loop through all neighbors to find a target
        gameState.neighbors.forEach((targetRealm, targetIdx) => {
            if (targetIdx === aiIndex || targetRealm.isDefeated || aiRealm.allies.includes(targetIdx) || aiRealm.vassalOf === targetIdx) return;
            
            // Populate relationship if missing
            if (aiRealm.aiRelations[targetIdx] === undefined) aiRealm.aiRelations[targetIdx] = Math.floor(Math.random() * 40) - 20;

            const targetPower = targetRealm.army.infantry + targetRealm.army.archers + targetRealm.army.cavalry;
            
            // Will they attack this AI?
            let willAttack = false;
            if (aiRealm.aiRelations[targetIdx] < -20 && aiPower >= targetPower * aiRealm.archetype.bravery) willAttack = true;
            else if (aiPower >= targetPower * (aiRealm.archetype.bravery + 0.5)) willAttack = true; // Bully weak AIs

            if (willAttack && Math.random() < 0.3) {
                aiRealm.activeWars.push(targetIdx);
                targetRealm.activeWars.push(aiIndex);
                
                aiRealm.aiRelations[targetIdx] = -100;
                targetRealm.aiRelations[aiIndex] = -100;

                addLogEntry(`Year ${gameState.age}: 🎺 WAR! ${aiRealm.name} has formally declared war upon the realm of ${targetRealm.name}!`);
                updateUI();
            }
        });
    }
    
    // INTELLIGENCE: AI vs AI Peace Treaties
    if (aiRealm.activeWars.length > 0) {
        aiRealm.activeWars.forEach(enemyIdx => {
            if (enemyIdx === "player") return; // Handled below
            
            let enemyRealm = gameState.neighbors[enemyIdx];
            const enemyPower = enemyRealm.army.infantry + enemyRealm.army.archers + enemyRealm.army.cavalry;

            // If this AI is utterly broken by the other AI
            if (aiRealm.wealth <= 0 && aiPower < enemyPower * 0.15) {
                // AI Surrenders to AI
                aiRealm.activeWars = aiRealm.activeWars.filter(id => id !== enemyIdx);
                enemyRealm.activeWars = enemyRealm.activeWars.filter(id => id !== aiIndex);
                
                // Vassalization
                aiRealm.vassalOf = enemyIdx;
                enemyRealm.vassals.push(aiIndex);
                
                addLogEntry(`Year ${gameState.age}: 👑 Broken by war, ${aiRealm.name} has surrendered and become a permanent Vassal to ${enemyRealm.name}.`);
                
                // Hand over any occupied land automatically
                gameState.mapTiles.forEach(tile => {
                    if (tile.ownerId === aiIndex && tile.isOccupied && tile.occupyingRealm === enemyIdx) {
                        tile.ownerId = enemyIdx;
                        tile.isOccupied = false;
                        tile.occupyingRealm = null;
                        tile.siegeForce = null;
                        tile.siegeProgress = 0;
                    }
                });
                updateUI();
            }
        });
    }

    // Standard Player Surrender Logic
    if (aiRealm.status === "war") {
        const playerPower = gameState.army.infantry + gameState.army.archers + gameState.army.cavalry;
        if (aiRealm.warScore <= -60 || (aiRealm.wealth <= 0 && aiPower < playerPower * 0.15)) {
            const reparations = Math.floor(aiRealm.wealth * 0.8);
            gameState.gold += reparations;
            aiRealm.wealth -= reparations;
            aiRealm.status = "neutral";
            aiRealm.memory.grudges += 5; 
            aiRealm.relationship = Math.max(-100, aiRealm.relationship - 50); 
            addLogEntry(`Year ${gameState.age}: 🕊️ With their realm burning, ${aiRealm.name} surrendered to you, paying ${reparations} gold.`);
            updateUI();
        }
    }
    
    // Defeat & Vassalization logic
    else if (aiRealm.status === "war") {
        if (aiRealm.warScore <= -60 || (aiRealm.wealth <= 0 && aiPower < playerPower * 0.15)) {
            
            // If they are losing to the PLAYER
            if (aiRealm.warScore <= -60) {
                const reparations = Math.floor(aiRealm.wealth * 0.8);
                gameState.gold += reparations;
                aiRealm.wealth -= reparations;
                aiRealm.status = "neutral";
                aiRealm.memory.grudges += 5; 
                aiRealm.relationship = Math.max(-100, aiRealm.relationship - 50); 
                addLogEntry(`${gameState.age}: 🕊️ With their realm burning, ${aiRealm.name} surrendered to you, paying ${reparations} gold.`);
            } 
            // If they are losing to ANOTHER AI (Future proofing for AI vs AI wars)
            else {
                // The AI becomes a vassal to whoever beat them
                let conquerorIdx = aiRealm.siegeForce ? aiRealm.siegeForce.attackerId : null;
                if (conquerorIdx !== null && conquerorIdx !== "player") {
                    let conqueror = gameState.neighbors[conquerorIdx];
                    aiRealm.vassalOf = conquerorIdx;
                    conqueror.vassals.push(aiIndex);
                    aiRealm.status = "neutral";
                    addLogEntry(`Year ${gameState.age}: 👑 Broken by war, ${aiRealm.name} has bent the knee and become a permanent Vassal to ${conqueror.name}.`);
                }
            }
            updateUI();
        }
    }
}

// 6. Internal Politics & Civil Wars
function aiManageInternalPolitics(aiRealm, aiIndex) {
    // 1. Natural Drift
    let baseUnrest = 0;
    
    // War Exhaustion: Being at war makes peasants angry
    if (aiRealm.status === "war") baseUnrest += 5;
    
    // Tyranny: Warlords upset nobles and peasants over time
    if (aiRealm.archetype.tyrannt > 0.6) {
        aiRealm.factions.nobles.loyalty -= 2;
        aiRealm.factions.peasants.unrest += 2;
    } else {
        aiRealm.factions.nobles.loyalty = Math.min(100, aiRealm.factions.nobles.loyalty + 1);
        aiRealm.factions.peasants.unrest = Math.max(0, aiRealm.factions.peasants.unrest - 2);
    }

    // 2. Suppress Unrest (Costs Gold)
    if (aiRealm.factions.peasants.unrest > 50 && aiRealm.wealth > 100) {
        aiRealm.wealth -= 50; // Spend gold to appease the masses
        aiRealm.factions.peasants.unrest -= 20;
        aiRealm.agenda = { type: AGENDAS.QUELLING_UNREST, timer: 2 };
        addLogEntry(`Year ${gameState.age}: ⚖️ ${aiRealm.name} has spent gold to quell rising peasant rebellions in their provinces.`);
        updateUI();
    }

    // 3. CIVIL WAR TRIGGER
    if (aiRealm.factions.peasants.unrest >= 100) {
        // Find a tile to rebel
        let ownedTiles = gameState.mapTiles.filter(t => t.ownerType === "neighbor" && t.ownerId === aiIndex);
        if (ownedTiles.length > 1) { // Need at least 2 tiles to split
            
            // The weakest tile breaks away
            ownedTiles.sort((a, b) => a.defense - b.defense);
            let rebelTile = ownedTiles[0];

            // Create a new Rebel Faction
            let rebelColor = "#" + Math.floor(Math.random()*16777215).toString(16);
            let rebelRealm = {
                name: `${aiRealm.name} Separatists`,
                color: rebelColor,
                gold: 100,
                wealth: 5,
                land: 1,
                army: { infantry: 500, archers: 200, cavalry: 0 },
                relationship: -100, // Hates everyone
                status: "war",
                isDefeated: false
            };

            gameState.neighbors.push(rebelRealm);
            let rebelIndex = gameState.neighbors.length - 1;

            // Give the tile to the rebels
            rebelTile.ownerId = rebelIndex;
            rebelTile.name = `Rebel Stronghold of ${aiRealm.name}`;

            // Declare war between the master and the rebels
            aiRealm.status = "war";
            aiRealm.factions.peasants.unrest = 20; // Unrest resets after the rebellion fires

            addLogEntry(`Year ${gameState.age}: 🔥 CIVIL WAR! The peasants of ${aiRealm.name} have revolted, forming a separatist state!`);
            updateUI();
        }
    }
}

// 7. Trade Engine & Vassal Taxes
function aiManageTrade(aiRealm, aiIndex) {
    // 1. Vassal Tribute (If this AI is an overlord, collect from vassals)
    if (aiRealm.vassals.length > 0) {
        aiRealm.vassals.forEach(vassalIdx => {
            let vassal = gameState.neighbors[vassalIdx];
            if (vassal && !vassal.isDefeated) {
                let tribute = Math.floor(vassal.wealth * 0.2); // Overlord takes 20%
                vassal.wealth -= tribute;
                aiRealm.wealth += tribute;
            }
        });
    }

    // 2. Active Trade Routes
    if (aiRealm.tradeRoutes.length > 0) {
        aiRealm.tradeRoutes.forEach(partnerIdx => {
            let partner = gameState.neighbors[partnerIdx];
            // Trade only works if they are still at peace
            if (partner && !partner.isDefeated && partner.status !== "war" && aiRealm.status !== "war") {
                let tradeValue = Math.floor((aiRealm.archetype.econWeight + partner.archetype.econWeight) * 10);
                aiRealm.wealth += tradeValue;
                partner.wealth += tradeValue;
            } else {
                // War breaks trade routes
                aiRealm.tradeRoutes = aiRealm.tradeRoutes.filter(id => id !== partnerIdx);
            }
        });
    }

    // 3. Establish New Trade Routes (Diplomat / Builder Agendas)
    if (aiRealm.agenda.type === AGENDAS.TRADE && aiRealm.status !== "war") {
        let potentialPartner = gameState.neighbors.find((n, idx) => 
            idx !== aiIndex && 
            n.status !== "war" && 
            !n.isDefeated && 
            n.relationship > 10 && 
            !aiRealm.tradeRoutes.includes(idx)
        );

        if (potentialPartner) {
            aiRealm.tradeRoutes.push(gameState.neighbors.indexOf(potentialPartner));
            potentialPartner.tradeRoutes.push(aiIndex);
            aiRealm.relationship += 10; // Trade builds trust
            addLogEntry(`Year ${gameState.age}: 🤝 ${aiRealm.name} and ${potentialPartner.name} have signed a lucrative Trade Agreement.`);
            updateUI();
        }
    }
}

function aiManageDynasty(aiRealm, aiIndex) {
    aiRealm.ruler.age += 1;

    // Death Check: After age 50, increasing chance to die each year
    if (aiRealm.ruler.age > 50 && Math.random() < ((aiRealm.ruler.age - 50) * 0.05)) {
        let oldName = aiRealm.ruler.name;
        
        // Generate Heir
        aiRealm.ruler = {
            name: `King ${['Henry', 'Louis', 'Frederick', 'Richard', 'Edward', 'Philip'][Math.floor(Math.random() * 6)]}`,
            age: 18 + Math.floor(Math.random() * 15)
        };
        
        // Succession completely rerolls the kingdom's personality
        aiRealm.archetype = AI_ARCHETYPES[Math.floor(Math.random() * AI_ARCHETYPES.length)];
        
        // Succession Crisis: Broken Alliances and Faction Unrest
        aiRealm.allies = []; // Old treaties die with the king
        aiRealm.tradeRoutes = [];
        aiRealm.factions.nobles.loyalty -= 30; // Nobles test the new king
        aiRealm.factions.peasants.unrest += 20;
        
        addLogEntry(`Year ${gameState.age}: 👑 The bells toll! ${oldName} of ${aiRealm.name} has died at age ${aiRealm.ruler.age - 1}. The new ${aiRealm.ruler.name} ascends the throne, and the realm's foreign policy has drastically shifted.`);
        updateUI();
    }
}

// 8. The Shadows: Covert Espionage Engine
function aiManageEspionage(aiRealm, aiIndex) {
    // Opportunists and highly paranoid AIs use spies more frequently
    const isDevious = aiRealm.archetype.name === "Opportunist" || aiRealm.archetype.paranoia > 0.6;
    if (!isDevious || aiRealm.wealth < 50) return;

    // Phase 1: Pick a Mission and Target
    if (!aiRealm.espionage.activeMission) {
        // Find someone they hate (grudge > 0 or relation < -20)
        let potentialTargets = [];
        if (aiRealm.relationship < -20) potentialTargets.push("player");
        
        Object.keys(aiRealm.aiRelations).forEach(targetIdx => {
            if (aiRealm.aiRelations[targetIdx] < -20) potentialTargets.push(parseInt(targetIdx));
        });

        if (potentialTargets.length > 0) {
            let target = potentialTargets[Math.floor(Math.random() * potentialTargets.length)];
            let missions = ["assassinate", "sabotage", "dissent"];
            
            aiRealm.espionage.activeMission = missions[Math.floor(Math.random() * missions.length)];
            aiRealm.espionage.targetId = target;
            aiRealm.espionage.progress = 0;
            aiRealm.wealth -= 50; // Funding the spy ring
        }
    }

    // Phase 2: Execute Mission Progress
    if (aiRealm.espionage.activeMission) {
        // Progress increases based on network strength and paranoia
        aiRealm.espionage.progress += Math.floor((aiRealm.espionage.networkStrength * 0.5) + (Math.random() * 15));

        // Chance of being discovered! (10% chance per turn)
        if (Math.random() < 0.10) {
            let targetName = aiRealm.espionage.targetId === "player" ? "your court" : gameState.neighbors[aiRealm.espionage.targetId].name;
            addLogEntry(`Year ${gameState.age}: 👁️ COVERT: Spies from ${aiRealm.name} were caught operating in ${targetName}! Their spy ring has been dismantled.`);
            
            // Severe relationship penalty for being caught
            if (aiRealm.espionage.targetId === "player") aiRealm.relationship -= 30;
            else gameState.neighbors[aiRealm.espionage.targetId].aiRelations[aiIndex] -= 30;
            
            aiRealm.espionage.activeMission = null;
            return;
        }

        // Mission Complete!
        if (aiRealm.espionage.progress >= 100) {
            let targetRealm = aiRealm.espionage.targetId === "player" ? gameState : gameState.neighbors[aiRealm.espionage.targetId];
            let targetName = aiRealm.espionage.targetId === "player" ? "your realm" : targetRealm.name;

            if (aiRealm.espionage.activeMission === "assassinate" && targetRealm.ruler) {
                addLogEntry(`Year ${gameState.age}: 🗡️ ASSASSINATION! The ruler of ${targetName} was found poisoned! Whispers point to the shadows...`);
                // Force an immediate succession crisis
                targetRealm.ruler.age = 999; 
                if (aiRealm.espionage.targetId !== "player") aiManageDynasty(targetRealm, aiRealm.espionage.targetId);
            } 
            else if (aiRealm.espionage.activeMission === "dissent" && targetRealm.factions) {
                addLogEntry(`Year ${gameState.age}: 🔥 SABOTAGE: Agents from an unknown realm have spread vicious rumors in ${targetName}, stoking peasant rebellion!`);
                targetRealm.factions.peasants.unrest += 40; // Push them towards civil war
            }
            else if (aiRealm.espionage.activeMission === "sabotage") {
                // Find a random tile and destroy its defense
                let targetTiles = gameState.mapTiles.filter(t => t.ownerId === aiRealm.espionage.targetId || (aiRealm.espionage.targetId === "player" && t.ownerType === "player"));
                if (targetTiles.length > 0) {
                    let tile = targetTiles[Math.floor(Math.random() * targetTiles.length)];
                    tile.defense = Math.max(1, tile.defense - 3);
                    addLogEntry(`Year ${gameState.age}: 💥 SABOTAGE: The armories of ${tile.name} in ${targetName} mysteriously burned to the ground!`);
                }
            }

            // Clear mission
            aiRealm.espionage.activeMission = null;
            updateUI();
        }
    }
}

// 9. Wars of Independence (Vassal Rebellions)
function aiManageVassalRebellions(aiRealm, aiIndex) {
    // If this AI is a vassal, evaluate if they can overthrow their master
    if (aiRealm.vassalOf !== null && aiRealm.status !== "war") {
        let master = gameState.neighbors[aiRealm.vassalOf];
        
        if (!master || master.isDefeated) {
            aiRealm.vassalOf = null; // Master is dead, we are free
            return;
        }

        const myPower = aiRealm.army.infantry + aiRealm.army.archers + aiRealm.army.cavalry;
        const masterPower = master.army.infantry + master.army.archers + master.army.cavalry;

        // If the master's army is wiped out (e.g., they are losing another war) and vassal is strong
        if (myPower > masterPower * 1.5 && aiRealm.archetype.bravery > 0.8) {
            // DECLARE INDEPENDENCE!
            aiRealm.vassalOf = null;
            master.vassals = master.vassals.filter(id => id !== aiIndex);
            
            aiRealm.status = "war";
            master.status = "war";
            aiRealm.activeWars.push(gameState.neighbors.indexOf(master));
            master.activeWars.push(aiIndex);
            
            aiRealm.aiRelations[gameState.neighbors.indexOf(master)] = -100;

            addLogEntry(`⛓️ REBELLION! Sensing weakness, ${aiRealm.name} has declared Independence from their overlord, ${master.name}!`);
            updateUI();
        }
    }
}

// 10. The Global Mercenary Market
function aiManageMercenaries(aiRealm, aiIndex) {
    if (!gameState.mercenaries) return;

    // 1. Pay upkeep for existing mercenaries
    if (aiRealm.hiredMercenaries.length > 0) {
        for (let i = aiRealm.hiredMercenaries.length - 1; i >= 0; i--) {
            let mercId = aiRealm.hiredMercenaries[i];
            let merc = gameState.mercenaries.find(m => m.id === mercId);
            
            if (merc) {
                if (aiRealm.wealth >= merc.upkeep) {
                    aiRealm.wealth -= merc.upkeep; // Pay them
                } else {
                    // Go bankrupt, mercenaries abandon them!
                    aiRealm.army.infantry = Math.max(0, aiRealm.army.infantry - merc.army.infantry);
                    aiRealm.army.archers = Math.max(0, aiRealm.army.archers - merc.army.archers);
                    aiRealm.army.cavalry = Math.max(0, aiRealm.army.cavalry - merc.army.cavalry);
                    
                    merc.hiredBy = null;
                    aiRealm.hiredMercenaries.splice(i, 1);
                    
                    addLogEntry(`💰 BANKRUPTCY! Unable to pay their upkeep, the mercenary company '${merc.name}' has abandoned ${aiRealm.name}!`);
                    updateUI();
                }
            }
        }
    }

    // 2. Hire new mercenaries if losing a war and rich
    if (aiRealm.status === "war" && aiRealm.warScore <= -20 && aiRealm.wealth > 300) {
        // Find an available company
        let availableMercs = gameState.mercenaries.filter(m => m.hiredBy === null && aiRealm.wealth >= m.cost);
        
        if (availableMercs.length > 0) {
            // Hire the most expensive one they can afford
            availableMercs.sort((a, b) => b.cost - a.cost);
            let hiredMerc = availableMercs[0];

            aiRealm.wealth -= hiredMerc.cost;
            hiredMerc.hiredBy = aiIndex;
            aiRealm.hiredMercenaries.push(hiredMerc.id);

            // Instantly add troops to the AI's standing army
            aiRealm.army.infantry += hiredMerc.army.infantry;
            aiRealm.army.archers += hiredMerc.army.archers;
            aiRealm.army.cavalry += hiredMerc.army.cavalry;

            addLogEntry(`⚔️ Desperate to turn the tide of war, ${aiRealm.name} has hired the infamous mercenary company: ${hiredMerc.name}!`);
            updateUI();
        }
    }
}

// 11. Dynamic Empire Formation
function aiManageEmpireFormation(aiRealm, aiIndex) {
    // Skip if they are already an Empire or a Vassal
    if (aiRealm.name.includes("Empire") || aiRealm.vassalOf !== null) return;

    let ownedTilesCount = gameState.mapTiles.filter(t => t.ownerType === "neighbor" && t.ownerId === aiIndex).length;

    // FIX: Must have massive territory AND a thriving economy to declare an Empire
    if (ownedTilesCount >= 12 && aiRealm.wealth >= 1000) {
        let oldName = aiRealm.name;
        
        aiRealm.name = `The Grand Empire of ${oldName}`;
        // FIX: We removed the purple override. They now keep their original unique map color!
        
        aiRealm.factions.nobles.loyalty = 100;
        aiRealm.factions.peasants.unrest = 0;
        aiRealm.wealth += 500;
        
        // Shift archetype to Warlord/Expansionist
        aiRealm.archetype = AI_ARCHETYPES[0]; 
        aiRealm.agenda = { type: AGENDAS.EXPANSION, timer: 10 };

        addLogEntry(`👑 IMPERIAL PROCLAMATION! Through massive conquest and wealth, ${oldName} has reorganized into ${aiRealm.name}!`);
        updateUI();
    }
}