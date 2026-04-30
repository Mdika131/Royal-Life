// events.js - Expanded Database with Prestige mechanics

const events = [
    { 
        title: "Peasant Revolt!", 
        text: "The peasants are angry about the recent taxes and are marching on the castle.",
        choices: [
            { text: "Lower Taxes", goldChange: -30, popChange: 20, healthChange: 0, prestigeChange: 15 },
            { text: "Send the Guards", goldChange: 20, popChange: -40, healthChange: -10, prestigeChange: -20 }
        ]
    },
    { 
        title: "A Strange Sickness", 
        text: "A mysterious plague has hit the capital.",
        choices: [
            { text: "Fund a Cure", goldChange: -40, popChange: 0, healthChange: 10, prestigeChange: 20 },
            { text: "Lock the Gates", goldChange: 0, popChange: -50, healthChange: -20, prestigeChange: -10 }
        ]
    },
    { 
        title: "Neighboring Threat", 
        text: "The Lord of a neighboring realm demands tribute or he will attack.",
        choices: [
            { text: "Pay Tribute", goldChange: -50, popChange: 0, healthChange: 0, prestigeChange: -15 },
            { text: "Go to War!", goldChange: -20, popChange: -30, healthChange: -15, prestigeChange: 25 }
        ]
    },
    { 
        title: "Bumper Crop", 
        text: "The harvest was massive this year. What shall we do with the surplus?",
        choices: [
            { text: "Sell it for Gold", goldChange: 50, popChange: 0, healthChange: 0, prestigeChange: -5 },
            { text: "Feed the Poor", goldChange: 0, popChange: 50, healthChange: 5, prestigeChange: 20 }
        ]
    },
    {
        title: "Royal Wedding Proposal",
        text: "A powerful noble house offers a marriage alliance.",
        choices: [
            { text: "Accept Alliance", goldChange: 20, popChange: 30, healthChange: 5, prestigeChange: 15 },
            { text: "Decline", goldChange: 0, popChange: -20, healthChange: 0, prestigeChange: -10 }
        ]
    },
    {
        title: "Bandit Raids",
        text: "Bandits are pillaging villages near the border.",
        choices: [
            { text: "Send Army", goldChange: -25, popChange: 10, healthChange: 5, prestigeChange: 10 },
            { text: "Ignore Them", goldChange: 0, popChange: -30, healthChange: -10, prestigeChange: -20 }
        ]
    },
    {
        title: "Discovery of Gold Mine",
        text: "Miners discovered a rich gold vein in your lands.",
        choices: [
            { text: "Exploit Immediately", goldChange: 80, popChange: -10, healthChange: -5, prestigeChange: -15 },
            { text: "Develop Safely", goldChange: 40, popChange: 10, healthChange: 5, prestigeChange: 10 }
        ]
    },
    {
        title: "Religious Conflict",
        text: "Two religious factions are clashing in the Capital.",
        choices: [
            { text: "Support One Side", goldChange: 0, popChange: -20, healthChange: -5, prestigeChange: -15 },
            { text: "Promote Peace", goldChange: -20, popChange: 30, healthChange: 10, prestigeChange: 20 }
        ]
    },
    {
        title: "Foreign Merchants Arrive",
        text: "Traders from distant lands offer rare goods.",
        choices: [
            { text: "Open Trade", goldChange: 30, popChange: 10, healthChange: 5, prestigeChange: 10 },
            { text: "Refuse", goldChange: 0, popChange: -10, healthChange: 0, prestigeChange: 0 }
        ]
    },
    {
        title: "Castle Fire",
        text: "A fire breaks out in part of the royal castle.",
        choices: [
            { text: "Rebuild Quickly", goldChange: -40, popChange: 10, healthChange: 5, prestigeChange: 15 },
            { text: "Save Money", goldChange: -10, popChange: -20, healthChange: -10, prestigeChange: -20 }
        ]
    },
    {
        title: "Festival of the Crown",
        text: "The people request a grand festival in your honor.",
        choices: [
            { text: "Host Festival", goldChange: -30, popChange: 40, healthChange: 10, prestigeChange: 25 },
            { text: "Deny Request", goldChange: 0, popChange: -25, healthChange: -5, prestigeChange: -15 }
        ]
    },
    {
        title: "Drought",
        text: "A severe drought threatens the harvest.",
        choices: [
            { text: "Import Food", goldChange: -50, popChange: 20, healthChange: 10, prestigeChange: 20 },
            { text: "Ration Supplies", goldChange: 10, popChange: -30, healthChange: -10, prestigeChange: -15 }
        ]
    },
    {
        title: "Knight Tournament",
        text: "A grand tournament could attract fame and warriors.",
        choices: [
            { text: "Host Tournament", goldChange: -20, popChange: 25, healthChange: 5, prestigeChange: 30 },
            { text: "Skip It", goldChange: 0, popChange: -10, healthChange: 0, prestigeChange: -5 }
        ]
    },
    {
        title: "Spy Network",
        text: "Your advisors suggest building a spy network.",
        choices: [
            { text: "Invest in Spies", goldChange: -30, popChange: 0, healthChange: 10, prestigeChange: 10 },
            { text: "Too Risky", goldChange: 0, popChange: 5, healthChange: -5, prestigeChange: -5 }
        ]
    },
    {
        title: "Great Library Proposal",
        text: "Scholars wish to build a grand library.",
        choices: [
            { text: "Fund It", goldChange: -35, popChange: 20, healthChange: 10, prestigeChange: 25 },
            { text: "Ignore Scholars", goldChange: 0, popChange: -15, healthChange: -5, prestigeChange: -10 }
        ]
    },
    {
        title: "Assassination Attempt",
        text: "An assassin tried to kill you but failed.",
        choices: [
            { text: "Increase Security", goldChange: -25, popChange: 0, healthChange: 15, prestigeChange: 10 },
            { text: "Public Execution", goldChange: 10, popChange: -20, healthChange: -5, prestigeChange: -15 }
        ]
    },
    {
        title: "Refugee Crisis",
        text: "Refugees from war seek shelter in your lands.",
        choices: [
            { text: "Accept Them", goldChange: -20, popChange: 40, healthChange: 5, prestigeChange: 20 },
            { text: "Turn Them Away", goldChange: 10, popChange: -30, healthChange: -5, prestigeChange: -20 }
        ]
    },
    {
        title: "Naval Expansion",
        text: "Admirals propose expanding your navy.",
        choices: [
            { text: "Build Fleet", goldChange: -60, popChange: 10, healthChange: 15, prestigeChange: 20 },
            { text: "Decline", goldChange: 0, popChange: -10, healthChange: -5, prestigeChange: -5 }
        ]
    },
    {
        title: "Economic Boom",
        text: "Trade and industry flourish unexpectedly.",
        choices: [
            { text: "Tax Profits", goldChange: 60, popChange: -10, healthChange: 0, prestigeChange: -10 },
            { text: "Encourage Growth", goldChange: 20, popChange: 30, healthChange: 10, prestigeChange: 15 }
        ]
    },
    {
        title: "Earthquake",
        text: "A devastating earthquake struck your lands.",
        choices: [
            { text: "Rebuild Cities", goldChange: -70, popChange: 30, healthChange: 10, prestigeChange: 20 },
            { text: "Minimal Aid", goldChange: -20, popChange: -40, healthChange: -15, prestigeChange: -30 }
        ]
    },
    {
        title: "Mysterious Prophet",
        text: "A prophet claims to foresee your empire's fate.",
        choices: [
            { text: "Hear Them", goldChange: -10, popChange: 15, healthChange: 5, prestigeChange: 5 },
            { text: "Exile Them", goldChange: 0, popChange: -15, healthChange: -5, prestigeChange: -10 }
        ]
    }
];