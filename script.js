"use strict";

const GAME_STORAGE_KEY = "idleGangsterGame";

const PRODUCTS = {
    VIN: "Vin",
    COGNAC: "Cognac",
    COCAINE: "Cocaine"
};

const CRIME_TYPES = {
    PETITS_LARCINS: "petits-larcins",
    CAMBRIOLAGES_RESIDENCES: "cambriolages-de-résidences",
    BRAQUAGES_COMMERCES: "braquages-de-commerces",
    ATTAQUES_CONVOIS: "attaques-de-convois"
};

const CAR_THEFT_TYPES = {
    VOL_EXPRESS: "vol-express",
    EFFRACTION_DISCRETE: "effraction-discrète",
    CARJACKING: "carjacking",
    VOL_SOUS_HAUTE_SECURITE: "vol-sous-haute-sécurité"
};

const game = {
    argent: 100,
    xp: 0,
    rankLevel: 0,
    ranks: [
        { name: "Outsider", description: "Nouveau venu...", xpRequired: 0 },
        { name: "Runner", description: "Chargé des petites courses...", xpRequired: 100 },
        { name: "Associate", description: "Reconnu comme membre...", xpRequired: 300 },
        { name: "Soldier", description: "Membre officiel...", xpRequired: 700 },
        { name: "Capo", description: "Lieutenant supervisant...", xpRequired: 1500 },
        { name: "Underboss", description: "Bras droit du boss...", xpRequired: 3000 },
        { name: "Boss", description: "Chef suprême...", xpRequired: 6000 }
    ],
    prisonTime: 0,
    crimeCooldown: 0,
    carTheftCooldown: 0,
    travelCooldown: 0,
    contraband: {
        [PRODUCTS.VIN]: 0,
        [PRODUCTS.COGNAC]: 0,
        [PRODUCTS.COCAINE]: 0
    },
    totalTransactions: 0,
    cities: [
        {
            name: "Paris",
            description: "La ville lumière...",
            police: 0.8,
            products: {
                [PRODUCTS.VIN]: { basePrice: 30, currentPrice: 30, lastPrice: 30, volatility: 0.2 },
                [PRODUCTS.COGNAC]: { basePrice: 50, currentPrice: 50, lastPrice: 50, volatility: 0.5 },
                [PRODUCTS.COCAINE]: { basePrice: 200, currentPrice: 200, lastPrice: 200, volatility: 0.5 } // Ajout de cette ligne
            }
        },
        {
            name: "Marseille",
            description: "Port méditerranéen...",
            police: 0.6,
            products: {
                [PRODUCTS.VIN]: { basePrice: 25, currentPrice: 25, lastPrice: 25, volatility: 0.2 },
                [PRODUCTS.COGNAC]: { basePrice: 60, currentPrice: 60, lastPrice: 60, volatility: 0.3 },
                [PRODUCTS.COCAINE]: { basePrice: 170, currentPrice: 170, lastPrice: 170, volatility: 0.5 }
            }
        },
        {
            name: "Lyon",
            description: "Carrefour commercial important...",
            police: 0.7,
            products: {
                [PRODUCTS.VIN]: { basePrice: 28, currentPrice: 28, lastPrice: 28, volatility: 0.2 },
                [PRODUCTS.COGNAC]: { basePrice: 45, currentPrice: 45, lastPrice: 45, volatility: 0.3 },
                [PRODUCTS.COCAINE]: { basePrice: 220, currentPrice: 220, lastPrice: 220, volatility: 0.5 }
            }
        },
        {
            name: "Nice",
            description: "Ville côtière...",
            police: 0.7,
            products: {
                [PRODUCTS.VIN]: { basePrice: 40, currentPrice: 40, lastPrice: 40, volatility: 0.2 },
                [PRODUCTS.COGNAC]: { basePrice: 70, currentPrice: 70, lastPrice: 70, volatility: 0.3 },
                [PRODUCTS.COCAINE]: { basePrice: 250, currentPrice: 250, lastPrice: 250, volatility: 0.5 }
            }
        },
        {
            name: "Bordeaux",
            description: "Capitale du vin...",
            police: 0.65,
            products: {
                [PRODUCTS.VIN]: { basePrice: 20, currentPrice: 20, lastPrice: 20, volatility: 0.2 },
                [PRODUCTS.COGNAC]: { basePrice: 35, currentPrice: 35, lastPrice: 35, volatility: 0.3 },
                [PRODUCTS.COCAINE]: { basePrice: 210, currentPrice: 210, lastPrice: 210, volatility: 0.5 }
            }
        }
    ],
    currentCity: "Paris",
    nextPriceUpdate: 0,

    toggleSection(sectionId) {
        const sections = ["crime-section", "contraband-section", "car-theft-section", "cities-section"];
        sections.forEach(section => {
            const element = document.getElementById(section);
            if (element) {
                element.style.display = section === sectionId ? "block" : "none";
            }
        });

        if (sectionId === "cities-section") {
            this.renderCities();
        } else if (sectionId === "contraband-section") {
            this.updateContrabandUI();
        }
    },

    checkPrisonStatus(message) {
        if (this.prisonTime > 0) {
            this.showMessage(message, true);
            return true;
        }
        return false;
    },

    handleCrime(crimeType, successChance, xpReward, crimeName, moneyReward) {
        if (this.checkPrisonStatus("Vous êtes en prison, vous ne pouvez pas commettre de crime.")) return;
        if (this.crimeCooldown > 0) {
            this.showMessage(`Tu dois attendre encore ${this.crimeCooldown} secondes avant de commettre un nouveau crime.`, true);
            return;
        }

        const adjustedSuccessChance = successChance * (1 + this.rankLevel * 0.05);

        if (Math.random() > adjustedSuccessChance) {
            this.prisonTime = 30;
            this.showMessage(`Les flics t'ont choppé lors de ${crimeName} !`, true);
            this.prisonCountdown();
            this.showPrisonIndicator();
        } else {
            this.argent += moneyReward;
            this.addXP(xpReward);
            this.showMessage(`${crimeName} réussi ! Vous avez gagné ${moneyReward}€ et ${xpReward} XP.`, false, true);
        }

        this.setCooldown("crime", 60);
        this.updateUI();
    },

    attemptCrime(crimeType, successChance, xpReward) {
        const crimeName = {
            [CRIME_TYPES.PETITS_LARCINS]: "petits larcins",
            [CRIME_TYPES.CAMBRIOLAGES_RESIDENCES]: "cambriolages-de-résidences",
            [CRIME_TYPES.BRAQUAGES_COMMERCES]: "braquages-de-commerces",
            [CRIME_TYPES.ATTAQUES_CONVOIS]: "attaques-de-convois"
        }[crimeType];

        const moneyReward = {
            [CRIME_TYPES.PETITS_LARCINS]: 30,
            [CRIME_TYPES.CAMBRIOLAGES_RESIDENCES]: 100,
            [CRIME_TYPES.BRAQUAGES_COMMERCES]: 200,
            [CRIME_TYPES.ATTAQUES_CONVOIS]: 300
        }[crimeType] || 0;

        this.handleCrime(crimeType, successChance, xpReward, crimeName, moneyReward);
    },

    attemptCarTheft(carTheftType, successChance, xpReward) {
        if (this.checkPrisonStatus("Vous êtes en prison, vous ne pouvez pas commettre de crime.")) return;
        if (this.carTheftCooldown > 0) {
            this.showMessage(`Tu dois attendre encore ${this.carTheftCooldown} secondes avant de voler une autre voiture.`, true);
            return;
        }

        const adjustedSuccessChance = successChance * (1 + this.rankLevel * 0.05);

        if (Math.random() > adjustedSuccessChance) {
            this.prisonTime = 30;
            this.showMessage(`Les flics t'ont choppé lors de ${carTheftType} !`, true);
            this.prisonCountdown();
            this.showPrisonIndicator();
        } else {
            const moneyReward = {
                [CAR_THEFT_TYPES.VOL_EXPRESS]: 50,
                [CAR_THEFT_TYPES.EFFRACTION_DISCRETE]: 150,
                [CAR_THEFT_TYPES.CARJACKING]: 300,
                [CAR_THEFT_TYPES.VOL_SOUS_HAUTE_SECURITE]: 500
            }[carTheftType] || 0;

            this.argent += moneyReward;
            this.addXP(xpReward);
            this.showMessage(`${carTheftType} réussi ! Vous avez gagné ${moneyReward}€ et ${xpReward} XP.`, false, true);
        }

        this.setCooldown("car-theft", 300);
        this.updateUI();
    },
    handleContraband(product, quantityInputId, isBuying, xpRewardMultiplier) {
        const isPrison = this.checkPrisonStatus("Vous êtes en prison, vous ne pouvez pas faire de contrebande.");
        if (isPrison) return;

        const quantityInput = document.getElementById(quantityInputId);
        if (!quantityInput) return;

        const quantity = parseInt(quantityInput.value) || 1;
        if (isNaN(quantity) || quantity <= 0) {
            this.showMessage("Veuillez entrer une quantité valide.", true);
            return;
        }

        const city = this.cities.find(city => city.name === this.currentCity);
        if (!city) return;

        const productData = city.products[product];
        if (!productData) return;

        const price = productData.currentPrice;
        const totalCost = price * quantity;

        if (isBuying) {
            if (this.argent >= totalCost) {
                this.argent -= totalCost;
                this.contraband[product] = (this.contraband[product] || 0) + quantity;
                this.totalTransactions += 1;
                const xpReward = xpRewardMultiplier * quantity;
                this.addXP(xpReward);
                this.showMessage(`Vous avez acheté ${quantity} ${product} pour ${totalCost}€ et gagné ${xpReward} XP.`, false, true);

                const policeChance = Math.min(city.police * 0.05 * quantity, 0.4);
                if (Math.random() < policeChance) {
                    this.prisonTime = 45;
                    this.showMessage("Les flics ont repéré votre activité de contrebande ! Vous êtes en prison.", true);
                    this.prisonCountdown();
                    this.showPrisonIndicator();
                }
            } else {
                this.showMessage(`Pas assez de fric pour acheter ${quantity} ${product}.`, true);
            }
        } else {
            if ((this.contraband[product] || 0) >= quantity) {
                const totalRevenue = productData.currentPrice * quantity;
                this.argent += totalRevenue;
                this.contraband[product] -= quantity;
                this.totalTransactions += 1;
                const xpReward = xpRewardMultiplier * quantity;
                this.addXP(xpReward);
                this.showMessage(`Vous avez vendu ${quantity} ${product} pour ${totalRevenue}€ et gagné ${xpReward} XP.`, false, true);

                const policeChance = Math.min(city.police * 0.04 * quantity, 0.35);
                if (Math.random() < policeChance) {
                    this.prisonTime = 45;
                    this.showMessage("Les flics ont repéré votre activité de contrebande ! Vous êtes en prison.", true);
                    this.prisonCountdown();
                    this.showPrisonIndicator();
                }
            } else {
                this.showMessage(`Vous n'avez pas assez de ${product} à vendre.`, true);
            }
        }

        this.updateUI();
        this.saveGame();
    },

    buyCityContraband(product, xpRewardMultiplier) {
        this.handleContraband(product, `${product.toLowerCase()}-quantity`, true, xpRewardMultiplier);
    },

    sellCityContraband(product, xpRewardMultiplier) {
        this.handleContraband(product, `${product.toLowerCase()}-sell-quantity`, false, xpRewardMultiplier);
    },
    renderCities() {
        const cityListElement = document.getElementById("city-list");
        cityListElement.innerHTML = "";

        this.cities.forEach(city => {
            const cityCard = document.createElement("div");
            cityCard.className = "city-card";

            if (city.name === this.currentCity) {
                const currentCityIndicator = document.createElement("div");
                currentCityIndicator.className = "current-city-indicator";
                currentCityIndicator.textContent = "Tu es ici";
                cityCard.appendChild(currentCityIndicator);
            }

            cityCard.innerHTML = `
                <h4>${city.name}</h4>
                <div class="description">${city.description}</div>
                <div class="status">Présence policière: ${Math.round(city.police * 100)}%</div>
                <div class="city-prices">
                    <div>${PRODUCTS.VIN}: ${city.products[PRODUCTS.VIN].currentPrice}€ 
                        ${this.getPriceTrendHTML(city.products[PRODUCTS.VIN].currentPrice, city.products[PRODUCTS.VIN].lastPrice)}</div>
                    <div>${PRODUCTS.COGNAC}: ${city.products[PRODUCTS.COGNAC].currentPrice}€ 
                        ${this.getPriceTrendHTML(city.products[PRODUCTS.COGNAC].currentPrice, city.products[PRODUCTS.COGNAC].lastPrice)}</div>
                    <div>${PRODUCTS.COCAINE}: ${city.products[PRODUCTS.COCAINE].currentPrice}€ 
                        ${this.getPriceTrendHTML(city.products[PRODUCTS.COCAINE].currentPrice, city.products[PRODUCTS.COCAINE].lastPrice)}</div>
                </div>
            `;

            if (city.name !== this.currentCity) {
                const travelButton = document.createElement("button");
                travelButton.className = "icon-button";
                travelButton.textContent = "Voyager";
                travelButton.onclick = () => this.travelToCity(city.name);
                cityCard.appendChild(travelButton);
            }

            cityListElement.appendChild(cityCard);
        });
    },
    getPriceTrendHTML(currentPrice, lastPrice) {
        if (currentPrice > lastPrice) {
            return '<span class="price-up">↑</span>';
        } else if (currentPrice < lastPrice) {
            return '<span class="price-down">↓</span>';
        } else {
            return "";
        }
    },
    travelToCity(cityName) {
        if (this.checkPrisonStatus("Tu ne peux pas voyager pendant que tu es en prison!")) return;
        if (this.travelCooldown > 0) {
            this.showMessage(`Tu dois attendre encore ${this.travelCooldown} secondes avant de pouvoir voyager à nouveau.`, true);
            return;
        }

        this.currentCity = cityName;
        document.getElementById("current-city-name").textContent = cityName;
        this.updateContrabandUI();
        this.showMessage(`Tu as voyagé à ${cityName}!`, false, true);
        this.setCooldown("travel", 120);
        this.renderCities();
        this.saveGame();
    },
    updatePrices() {
        const now = new Date().getTime();
        if (now >= this.nextPriceUpdate) {
            this.cities.forEach(city => {
                Object.keys(city.products).forEach(product => {
                    const productData = city.products[product];
                    productData.lastPrice = productData.currentPrice;
                    const volatility = productData.volatility;
                    const priceChange = (Math.random() * 2 - 1) * volatility;
                    productData.currentPrice = Math.max(
                        Math.round(productData.basePrice * 0.5),
                        Math.round(productData.basePrice * (1 + priceChange))
                    );
                });
            });

            this.nextPriceUpdate = now + 3600000; // 1 hour
            localStorage.setItem("nextPriceUpdate", this.nextPriceUpdate);
            this.updateContrabandUI();
            this.renderCities();
        }
        this.updatePriceTimer();
    },
    updatePriceTimer() {
        const timeLeft = this.nextPriceUpdate - new Date().getTime();
        if (timeLeft > 0) {
            const hours = Math.floor(timeLeft / 3600000);
            const minutes = Math.floor((timeLeft % 3600000) / 60000);
            const seconds = Math.floor((timeLeft % 60000) / 1000);
            document.getElementById("price-update-timer").textContent = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
        } else {
            document.getElementById("price-update-timer").textContent = "00:00:00";
        }
    },
    updateContrabandUI() {
        const city = this.cities.find(city => city.name === this.currentCity);
        if (!city) return;

        document.getElementById("vin-price").textContent = city.products[PRODUCTS.VIN].currentPrice;
        document.getElementById("cognac-price").textContent = city.products[PRODUCTS.COGNAC].currentPrice;
        document.getElementById("cocaine-price").textContent = city.products[PRODUCTS.COCAINE].currentPrice;

        document.getElementById("vin-trend").innerHTML = this.getPriceTrendHTML(city.products[PRODUCTS.VIN].currentPrice, city.products[PRODUCTS.VIN].lastPrice);
        document.getElementById("cognac-trend").innerHTML = this.getPriceTrendHTML(city.products[PRODUCTS.COGNAC].currentPrice, city.products[PRODUCTS.COGNAC].lastPrice);
        document.getElementById("cocaine-trend").innerHTML = this.getPriceTrendHTML(city.products[PRODUCTS.COCAINE].currentPrice, city.products[PRODUCTS.COCAINE].lastPrice);

        document.getElementById("vin-sell-price").textContent = city.products[PRODUCTS.VIN].currentPrice;
        document.getElementById("cognac-sell-price").textContent = city.products[PRODUCTS.COGNAC].currentPrice;
        document.getElementById("cocaine-sell-price").textContent = city.products[PRODUCTS.COCAINE].currentPrice;
    },
    updateCooldownUI(cooldownType) {
        let cooldown = 0;
        let button = null;
        let section = null;
        let cooldownUpdateText = null;

        if (cooldownType === "crime") {
            cooldown = this.crimeCooldown;
            button = document.getElementById("crime-button");
            section = document.querySelector('[data-section="crime-section"]');
        } else if (cooldownType === "car-theft") {
            cooldown = this.carTheftCooldown;
            button = document.getElementById("car-theft-button");
            section = document.querySelector('[data-section="car-theft-section"]');
        } else if (cooldownType === "travel") {
            cooldown = this.travelCooldown;
        }

        if (cooldownType !== "travel") {
            button.disabled = cooldown > 0;
        }

        let elementId = "";
        if (cooldownType === "travel") {
            elementId = "travel-cooldown";
        } else {
            elementId = `[data-section="${cooldownType}-section"] .cooldown`;
        }

        const element = document.getElementById(elementId);

        if (cooldownType === "travel") {
            if (cooldown <= 0) {
                document.getElementById("travel-cooldown").style.display = "none";
            } else {
                document.getElementById("travel-cooldown").style.display = "block";
                document.getElementById("travel-time").textContent = cooldown + "s";
            }
        } else {
            if (cooldown <= 0) {
                button.disabled = false;
                if (element) {
                    element.remove();
                }
            } else {
                button.disabled = true;
                cooldownUpdateText = document.querySelector(elementId) || document.createElement("span");
                cooldownUpdateText.className = "cooldown";
                cooldownUpdateText.textContent = `Prochain ${cooldownType} possible dans ${cooldown}s`;

                if (section) {
                    section.insertBefore(cooldownUpdateText, section.firstChild);
                }
            }
        }
    },
    addXP(xp) {
        this.xp += xp;
        let currentRank = this.ranks[this.rankLevel];

        while (this.ranks[this.rankLevel + 1] && this.xp >= this.ranks[this.rankLevel + 1].xpRequired) {
            this.rankLevel++;
            this.levelUp();
            currentRank = this.ranks[this.rankLevel];
        }

        this.updateUI();
    },
    levelUp() {
        document.getElementById("level-up").style.display = "block";
        document.getElementById("new-rank").textContent = this.ranks[this.rankLevel].name;
        setTimeout(() => {
            document.getElementById("level-up").style.display = "none";
        }, 3000);
    },
    prisonCountdown() {
        if (this.prisonTime > 0) {
            document.getElementById("prison-timer").style.display = "block";
            document.getElementById("prison-time").textContent = this.prisonTime + "s";
        } else {
            document.getElementById("prison-timer").style.display = "none";
            document.getElementById("prison-time").textContent = "0s";
        }
    },
    showPrisonIndicator() {
        document.getElementById("prison-indicator").style.display = "block";
    },
    hidePrisonIndicator() {
        document.getElementById("prison-indicator").style.display = "none";
    },
    setCooldown(cooldownType, time) {
        if (cooldownType === "crime") {
            this.crimeCooldown = time;
        } else if (cooldownType === "car-theft") {
            this.carTheftCooldown = time;
        } else if (cooldownType === "travel") {
            this.travelCooldown = time;
        }
        this.updateCooldownUI(cooldownType);
    },
    updateUI() {
        document.getElementById("argent").textContent = this.argent;
        document.getElementById("rank").textContent = this.ranks[this.rankLevel]?.name || "Inconnu"; // Ajout de la vérification
        document.getElementById("rank-description").textContent = this.ranks[this.rankLevel]?.description || ""; // Ajout de la vérification

        const currentRankXp = this.ranks[this.rankLevel].xpRequired;
        const nextRankXp = this.ranks[this.rankLevel + 1]?.xpRequired || Number.MAX_SAFE_INTEGER;

        document.getElementById("xp-current").textContent = this.xp;
        document.getElementById("xp-next").textContent = nextRankXp;

        const progress = (this.xp - currentRankXp) / (nextRankXp - currentRankXp) * 100;
        document.getElementById("rank-progress").style.width = progress + "%";

        document.getElementById("next-rank-name").textContent = this.ranks[this.rankLevel + 1]?.name || "Dernier Rang";

        localStorage.setItem(GAME_STORAGE_KEY, JSON.stringify(this));
    },
    showMessage(message, isError, isImportant) {
        const messageElement = document.getElementById("message");
        messageElement.textContent = message;
        messageElement.className = isError ? "error" : "success";
        messageElement.style.display = "block";

        setTimeout(() => {
            messageElement.style.display = "none";
        }, 3000);
    },
    saveGame() {
        localStorage.setItem(GAME_STORAGE_KEY, JSON.stringify(this));
    },
    loadGame() {
        const savedGame = localStorage.getItem(GAME_STORAGE_KEY);
        if (savedGame) {
            const parsedGame = JSON.parse(savedGame);
            this.prisonTime = parsedGame.prisonTime || 0;
            this.crimeCooldown = parsedGame.crimeCooldown || 0;
            this.carTheftCooldown = parsedGame.carTheftCooldown || 0;
            this.travelCooldown = parsedGame.travelCooldown || 0;
            this.argent = parsedGame.argent;
            this.xp = parsedGame.xp;
            this.rankLevel = parsedGame.rankLevel;
            this.contraband = parsedGame.contraband;
            this.totalTransactions = parsedGame.totalTransactions;
            this.currentCity = parsedGame.currentCity;
            this.nextPriceUpdate = parsedGame.nextPriceUpdate;

        }
    },
    init() {
        document.querySelectorAll(".icon-button[data-section]").forEach(button => {
            button.addEventListener("click", () => {
                this.toggleSection(button.dataset.section);
            });
        });

        this.loadGame();
        this.updateUI();
        this.renderCities();
        this.updatePrices();

        setInterval(() => {
            this.updatePrices();
            this.updatePriceTimer();
        }, 1000);

        setInterval(() => {
            if (this.prisonTime > 0) {
                this.prisonTime--;
                this.prisonCountdown();
                if (this.prisonTime === 0) {
                    this.hidePrisonIndicator();
                }
            }

            if (this.crimeCooldown > 0) {
                this.crimeCooldown--;
            }
            this.updateCooldownUI("crime");

            if (this.carTheftCooldown > 0) {
                this.carTheftCooldown--;
            }
            this.updateCooldownUI("car-theft");

            if (this.travelCooldown > 0) {
                this.travelCooldown--;
            }
            this.updateCooldownUI("travel");

            this.saveGame();
        }, 1000);

        this.toggleSection("crime-section");

        if (this.prisonTime > 0) {
            this.prisonCountdown();
            this.showPrisonIndicator();
        }

        else {
            this.hidePrisonIndicator();
        }

        this.updateCooldownUI("crime");
        this.updateCooldownUI("car-theft");
        this.updateCooldownUI("travel");
    }
};

game.init();