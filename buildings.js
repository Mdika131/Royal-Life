// building database for kingdom infrastructure
const buildingData = {
    market: { 
        name: "Town Market", 
        icon: "fa-store", 
        baseCost: 100, 
        desc: "Increases tax revenue by +15 🪙/year.", 
        goldBonus: 15, 
        foodBonus: 0, 
        healthBonus: 0 
    },
    granary: { 
        name: "Granary", 
        icon: "fa-wheat-awn", 
        baseCost: 150, 
        desc: "Preserves extra food by +30 🌾/year.", 
        goldBonus: 0, 
        foodBonus: 30, 
        healthBonus: 0 
    },
    clinic: { 
        name: "Herbalist Clinic", 
        icon: "fa-briefcase-medical", 
        baseCost: 250, 
        desc: "Improves public health by +2 💖/year.", 
        goldBonus: 0, 
        foodBonus: 0, 
        healthBonus: 2 
    }
};