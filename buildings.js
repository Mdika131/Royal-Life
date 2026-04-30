// building database for kingdom infrastructure
const buildingData = {
    market: { 
        name: "Town Market", 
        icon: "fa-store", 
        baseCost: 100, 
        desc: "Increases tax revenue by +25 🪙/year.", 
        goldBonus: 25, foodBonus: 0, healthBonus: 0, prestigeBonus: 0, 
        upkeep: 5 
    },
    granary: { 
        name: "Granary", 
        icon: "fa-wheat-awn", 
        baseCost: 150, 
        desc: "Preserves extra food by +30 🌾/year.", 
        goldBonus: 0, foodBonus: 30, healthBonus: 0, prestigeBonus: 0, 
        upkeep: 5 
    },
    clinic: { 
        name: "Herbalist Clinic", 
        icon: "fa-briefcase-medical", 
        baseCost: 250, 
        desc: "Improves public health by +2 💖/year.", 
        goldBonus: 0, foodBonus: 0, healthBonus: 2, prestigeBonus: 0, 
        upkeep: 15 
    },
    tavern: { 
        name: "Local Tavern", 
        icon: "fa-beer-mug-empty", 
        baseCost: 120, 
        desc: "Boosts morale and generates slight income. +1 🌟, +10 🪙/year.", 
        goldBonus: 10, foodBonus: 0, healthBonus: 0, prestigeBonus: 1, 
        upkeep: 2 
    },
    barracks: { 
        name: "City Barracks", 
        icon: "fa-shield-halved", 
        baseCost: 300, 
        desc: "Increases kingdom prestige by +3 🌟/year.", 
        goldBonus: 0, foodBonus: 0, healthBonus: 0, prestigeBonus: 3, 
        upkeep: 20 
    },
    windmill: { 
        name: "Windmill", 
        icon: "fa-fan", 
        baseCost: 200, 
        desc: "Greatly increases grain processing by +50 🌾/year.", 
        goldBonus: 0, foodBonus: 50, healthBonus: 0, prestigeBonus: 0, 
        upkeep: 10 
    }
};