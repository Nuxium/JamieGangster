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
                if (element.style.display === "block") {
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
            this.showMessage(`${crime} réussi ! Vous avez gagné ${reward}€ et ${xp} XP.`);
        }

        // Ajouter le cooldown
        this.carTheftCooldown = 300; // 300 secondes (5 minutes) de cooldown
        this.carTheftCooldownTimer();

        this.updateUI();
        this.saveGame();
    },
    
    // Contrebande
    buyContraband: function(type, price, xp) {
        if (this.prisonTime > 0) return;
        
        const quantityInput = document.getElementById(`${type.toLowerCase()}-quantity`);
        if (!quantityInput) return;

        const quantity = parseInt(quantityInput.value);
        const totalCost = price * quantity;

        if (this.argent >= totalCost) {
            this.argent -= totalCost;
            this.contraband[type] += quantity;
            this.totalTransactions += 1;
            this.addXP(xp * quantity);
            this.showMessage(`Vous avez acheté ${quantity} ${type} et gagné ${xp * quantity} XP.`);
            
            // Chance d'aller en prison avec contrebande
            if (Math.random() < Math.min(this.totalTransactions * 0.01, 0.3)) {
                this.prisonTime = 45;
                this.showMessage("Les flics ont repéré votre activité de contrebande ! Vous êtes en prison.");
                this.prisonCountdown();
            }
        } else {
            this.showMessage(`Pas assez de fric pour acheter ce ${type}.`, true);
        }
        
        this.updateUI();
        this.saveGame();
    },

    sellContraband: function(type, price, xp) {
        if (this.prisonTime > 0) return;
        
        const quantityInput = document.getElementById(`${type.toLowerCase()}-quantity`);
        if (!quantityInput) return;

        const quantity = parseInt(quantityInput.value);
        
        if (this.contraband[type] >= quantity) {
            const saleValue = price * quantity;
            this.argent += saleValue;
            this.contraband[type] -= quantity;
            this.totalTransactions += 1;
            this.addXP(xp * quantity);
            this.showMessage(`Vous avez vendu ${quantity} ${type} pour ${saleValue}€ et gagné ${xp * quantity} XP.`);
            
            // Chance d'aller en prison avec contrebande
            if (Math.random() < Math.min(this.totalTransactions * 0.01, 0.3)) {
                this.prisonTime = 45;
                this.showMessage("Les flics ont repéré votre activité de contrebande ! Vous êtes en prison.");
                this.prisonCountdown();
            }
        } else {
            this.showMessage(`Vous n'avez pas assez de ${type} à vendre.`, true);
        }
        
        this.updateUI();
        this.saveGame();
    },
    
    // Progression de niveau
    addXP: function(amount) {
        this.xp += amount;
        
        const nextRank = this.getNextRank();
        if (nextRank && this.xp >= nextRank.xpRequired) {
            this.rankLevel += 1;
            document.getElementById("new-rank").textContent = nextRank.name;
            document.getElementById("level-up").style.display = "block";
            setTimeout(() => { document.getElementById("level-up").style.display = "none"; }, 3000);
        }
        
        this.updateUI();
        this.saveGame();
    },
    
    getNextRank: function() {
        if (this.rankLevel < this.ranks.length - 1) {
            return this.ranks[this.rankLevel + 1];
        }
        return null;
    },
    
    // Interface utilisateur
    showMessage: function(text, isError = false) {
        const messageElement = document.getElementById("message");
        messageElement.textContent = text;
        messageElement.style.display = "block";
        messageElement.className = isError ? "error" : "";
        setTimeout(() => { messageElement.style.display = "none"; }, 3000);
    },
    
    // Timers
    prisonCountdown: function() {
        if (this.prisonTime <= 0) {
            document.getElementById("prison-timer").style.display = "none";
            return;
        }
        
        document.getElementById("prison-timer").style.display = "block";
        document.getElementById("prison-time").textContent = `${this.prisonTime}s`;
        
        setTimeout(() => {
            this.prisonTime -= 1;
            this.prisonCountdown();
        }, 1000);
    },
    
    crimeCooldownTimer: function() {
        if (this.crimeCooldown <= 0) {
            document.getElementById("crime-timer").style.display = "none";
            return;
        }
        
        document.getElementById("crime-timer").style.display = "block";
        document.getElementById("crime-cooldown").textContent = `${this.crimeCooldown}s`;
        
        setTimeout(() => {
            this.crimeCooldown -= 1;
            this.crimeCooldownTimer();
        }, 1000);
    },
    
    carTheftCooldownTimer: function() {
        if (this.carTheftCooldown <= 0) {
            document.getElementById("car-theft-timer").style.display = "none";
            return;
        }
        
        document.getElementById("car-theft-timer").style.display = "block";
        document.getElementById("car-theft-cooldown").textContent = `${this.carTheftCooldown}s`;
        
        setTimeout(() => {
            this.carTheftCooldown -= 1;
            this.carTheftCooldownTimer();
        }, 1000);
    },
    
    // Mise à jour interface utilisateur
    updateUI: function() {
        // Money and rank
        document.getElementById("argent").textContent = this.argent;
        const currentRank = this.ranks[this.rankLevel];
        document.getElementById("rank").textContent = currentRank.name;
        document.getElementById("rank-description").textContent = currentRank.description;
        
        // XP progress bar
        const nextRank = this.getNextRank();
        if (nextRank) {
            const currentXpRequired = currentRank.xpRequired;
            const nextXpRequired = nextRank.xpRequired;
            const xpForNextRank = nextXpRequired - currentXpRequired;
            const xpProgress = this.xp - currentXpRequired;
            const progressPercentage = Math.min(100, (xpProgress / xpForNextRank) * 100);
            
            document.getElementById("xp-current").textContent = this.xp;
            document.getElementById("xp-next").textContent = nextXpRequired;
            document.getElementById("rank-progress").style.width = `${progressPercentage}%`;
            document.getElementById("next-rank-name").textContent = nextRank.name;
        } else {
            // Max rank reached
            document.getElementById("xp-current").textContent = this.xp;
            document.getElementById("xp-next").textContent = "MAX";
            document.getElementById("rank-progress").style.width = "100%";
            document.getElementById("next-rank-name").textContent = "MAX";
        }
        
        // Contraband inventory
        Object.keys(this.contraband).forEach(type => {
            const element = document.getElementById(`${type.toLowerCase()}-owned`);
            if (element) element.textContent = this.contraband[type];
        });
    },
    
    // Sauvegarde et chargement
    saveGame: function() {
        const saveData = {
            argent: this.argent,
            xp: this.xp,
            rankLevel: this.rankLevel,
            prisonTime: this.prisonTime,
            crimeCooldown: this.crimeCooldown, 
            carTheftCooldown: this.carTheftCooldown,