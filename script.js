// Objet jeu global
const game = {
    // Données du joueur
    argent: 100,
    xp: 0,
    rankLevel: 0,
    ranks: [
        { name: "Outsider", description: "Nouveau venu, pas encore intégré dans l'organisation, mais cherchant à prouver sa valeur.", xpRequired: 0 },
        { name: "Runner", description: "Chargé des petites courses, des livraisons et des missions de bas niveau.", xpRequired: 100 },
        { name: "Associate", description: "Reconnu comme membre de l'organisation, commence à avoir une influence et un réseau limité.", xpRequired: 300 },
        { name: "Soldier", description: "Membre officiel, responsable des opérations quotidiennes et de la protection du territoire.", xpRequired: 700 },
        { name: "Capo", description: "Lieutenant supervisant plusieurs soldats et gérant un territoire spécifique.", xpRequired: 1500 },
        { name: "Underboss", description: "Bras droit du boss, supervise toutes les opérations et prend les décisions importantes.", xpRequired: 3000 },
        { name: "Boss", description: "Chef suprême de l'organisation criminelle, craint et respecté par tous.", xpRequired: 6000 }
    ],
    prisonTime: 0,
    crimeCooldown: 0,
    carTheftCooldown: 0,
    contraband: { Vin: 0, Cognac: 0, Cocaine: 0 },
    totalTransactions: 0,
    
    // Navigation entre sections
    toggleSection: function(sectionId) {
        const sections = ["crime-section", "contraband-section", "car-theft-section"];
        sections.forEach(id => {
            const element = document.getElementById(id);
            if (id === sectionId) {
                if (element.style.display === "block" || element.style.display === "") {
                    element.style.display = "none";
                } else {
                    element.style.display = "block";
                }
            } else {
                element.style.display = "none";
            }
        });
    },
    
    // Activités criminelles
    attemptCrime: function(crime, chance, xp) {
        if (this.prisonTime > 0) {
            this.showMessage("Vous êtes en prison, vous ne pouvez pas commettre de crime.", true);
            return;
        }
        
        if (this.crimeCooldown > 0) {
            this.showMessage(`Tu dois attendre encore ${this.crimeCooldown} secondes avant de commettre un nouveau crime.`, true);
            return;
        }
        
        const successChance = chance * (1 + (this.rankLevel * 0.05));
        if (Math.random() > successChance) {
            this.prisonTime = 30;
            this.showMessage(`Les flics t'ont choppé lors de ${crime} !`);
            this.prisonCountdown();
        } else {
            const reward = {
                'petits-larcins': 30,
                'cambriolages-de-résidences': 100,
                'braquages-de-commerces': 200,
                'attaques-de-convois': 300
            }[crime] || 0;
            
            this.argent += reward;
            this.addXP(xp);
            this.showMessage(`${crime} réussi ! Vous avez gagné ${reward}€ et ${xp} XP.`);
        }
        
        // Ajouter le cooldown
        this.crimeCooldown = 60; // 60 secondes de cooldown
        this.crimeCooldownTimer();
        
        this.updateUI();
        this.saveGame();
    },

    attemptCarTheft: function(crime, chance, xp) {
        if (this.prisonTime > 0) {
            this.showMessage("Vous êtes en prison, vous ne pouvez pas commettre de crime.", true);
            return;
        }
        
        if (this.carTheftCooldown > 0) {
            this.showMessage(`Tu dois attendre encore ${this.carTheftCooldown} secondes avant de voler une autre voiture.`, true);
            return;
        }
        
        const successChance = chance * (1 + (this.rankLevel * 0.05));
        if (Math.random() > successChance) {
            this.prisonTime = 30;
            this.showMessage(`Les flics t'ont choppé lors de ${crime} !`);
            this.prisonCountdown();
        } else {
            const reward = {
                'vol-express': 50,
                'effraction-discrète': 150,
                'carjacking': 300,
                'vol-sous-haute-sécurité': 500
            }[crime] || 0;
            
            this.argent += reward;
            this.addXP(xp);
            this.showMessage(`${crime} réussi ! Vous
