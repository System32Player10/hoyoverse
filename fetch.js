const DATA = {
    path: ["Destruction", "The Hunt", "Erudition", "Harmony", "Nihility", "Preservation", "Abundance", "Remembrance", "Elation"],
    type: ["Physical", "Fire", "Ice", "Lightning", "Wind", "Quantum", "Imaginary"],
    faction: ["???", "Collaboration", "Astral Express", "Stellaron Hunters", "Herta Space Station", "Jarilo-VI", "Xianzhou Alliance", "Penacony", "IPC", "Cosmic", "Amphoreus", "Planarcadia"],
    cmChapters: ["Stellaron Hunters", "Slices of Life Before the Furnace"],
    items: [["Credit", 3], ["Stellar Jade", 5], ["Trailblaze EXP", 3], ["Traveler's Guide", 4], ["Refined Aether", 4], ["Lost Crystal", 4], ["Obsidian of Desolation", 4], ["Phonograph Record", 4]]
};
const KEYS = ["path", "type", "faction", "items"];
let DOM = {};
let CACHE = null;
let HonkaiStarRail, debug;

// function getColorPalette(img, count = 4) {
//     count = Math.min(4, Math.max(2, count));

//     const canvas = document.createElement("canvas");
//     const ctx = canvas.getContext("2d");

//     canvas.width = img.width;
//     canvas.height = img.height;
//     ctx.drawImage(img, 0, 0);

//     const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
//     const colorMap = {};
//     const step = 10;

//     for (let i = 0; i < data.length; i += 4 * step) {
//         let [r, g, b, a] = data.slice(i, i + 4);
//         if (a < 128 || (r < 20 && g < 20 && b < 20) || (r > 240 && r > 240 && b > 240)) continue;
//         [r, g, b] = [r, g, b].map(val => Math.round(val / 32) * 32);
//         const key = `${r},${g},${b}`;
//         colorMap[key] = (colorMap[key] || 0) + 1;
//     }

//     return Object.entries(colorMap).sort((a, b) => b[1] - a[1]).slice(0, count).map(e => e[0].split(",").map(Number));
// }

class HonkaiStarRailGame {
    constructor(DOM, debug) {
        this.DOM = DOM;
        this.debug = debug;
        this.CACHE, this.char, this.PATH, this.VARIANT, this.codename = null;
    }

    async fetchData() {
        try {
            if (!this.CACHE) {
                const response = await fetch("./data.json");
                if (!response.ok) {
                    this.debug.showError(0);
                    this.DOM.errorcode.textContent = `Failed to load data: ${response.statusText}`;
                    console.error(`HTTP error; status: ${response.status}`);
                    return;
                }
                this.CACHE = await response.json();
            }
            const params = new URLSearchParams(window.location.search);
            const id = parseInt(params.get("characterId")) || "";
            this.PATH = params.get("path") || "";
            this.VARIANT = params.get("variant") || "";
            this.char = this.CACHE.characterList.find(c => c.id === id);
            if (!this.char) {
                this.debug.showError(0);
                this.DOM.errorcode.textContent = `Page not found`;
                return;
            }
            this.codename = this.char.pronounce;
            if (!this.PATH && this.char.path) {
                debug.showError(1, this.char, this.CACHE);
                return;
            }

            this.loadHomePage();
            if (this.char.companion_mission) this.loadCompanionMission();
            else this.DOM.cm.hidden = true;
        } catch (e) {
            this.debug.showError(0);
            this.DOM.errorcode.textContent = `Error: ${e.message}`;
            console.error(`Error: ${e}`);
        }
    }

    loadHomePage() {
        document.body.style.overflowY = "visible";
        let formatted, url, rawPath, availability;
        if (this.VARIANT) this.codename += `${this.VARIANT.charAt(0).toUpperCase() + this.VARIANT.slice(1)}`;
        if (!Array.isArray(this.char.pronounce)) {
            rawPath = (this.PATH || "").toLowerCase();
            availability = this.char.path && rawPath in this.char.path;
        }
        if (Array.isArray(this.char.pronounce)) this.codename = this.char.pronounce[0].replace(/\s+/g, "");

        this.DOM.imgDivs.forEach(el => { 
            if (Array.isArray(this.char.pronounce)) url = `./resources/Character_${this.codename}_SplashArt.webp`;
            else url = `./resources/Character_${this.codename.replace(/\s+/g, "")}_${rawPath.replace(/_/g, "").replace(/\b\w/g, c => c.toUpperCase())}_SplashArt.webp`;
            el.style.backgroundImage = `url(${url})`;
        });

        this.DOM.name.forEach((n, i) => { 
            if (Array.isArray(this.char.pronounce)) {
                n.textContent = this.char.pronounce[i] ?? "";
                document.title = `${this.char.pronounce[0]} - Honkai: Star Rail`;
            } else {
                if (availability) formatted = rawPath.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
                this.DOM.name[0].textContent = this.char.pronounce;
                this.DOM.name[1].textContent = formatted;
                document.title = `${this.char.pronounce}: ${formatted} - Honkai: Star Rail`;
            }
        });

        this.DOM.quote.textContent = `"${this.char.quote ?? "No quote available."}"`;
        this.DOM.additionalSpans.forEach((s, i) => {
            if (Array.isArray(this.char.pronounce)) s.textContent = DATA[KEYS[i]][this.char.array[i]] ?? "FAILED";
            else {
                s.textContent = DATA[KEYS[i]][this.char.path[this.PATH].array[i]] ?? "FAILED";
                return;
            }
        });

        this.DOM.screencover.hidden = true;
        this.DOM.imgDivs[1].hidden = false;
        this.DOM.imgDivs[1].classList.add("show");
    }

    loadCompanionMission() {
        this.DOM.cm.style.backgroundImage = `linear-gradient(to right, rgba(0,0,0,0.6), rgba(0,0,0,0.2) 15%, transparent 45%), url("./resources/Banner_${this.codename}_CompanionMission.webp")`;
        this.DOM.cmChapter.textContent = `Companion Mission / ${DATA.cmChapters[this.char.companion_mission.chapter]}`;
        this.DOM.cmTitle.textContent = this.char.companion_mission.title;

        const cmReq = this.char.companion_mission.requirements[1];
        switch (this.char.companion_mission.requirements[0]) {
            case 1: this.DOM.cmRequirements.innerHTML = `Reach <span>Trailblazer Level</span> ${cmReq}`; break;
            case 2: this.DOM.cmRequirements.innerHTML = `<span>Trailblazer Mission ${cmReq}</span> completed`; break;
            default: this.DOM.cmRequirements.innerHTML = "Unspecified"; break;
        }

        for (let i = 0; i < Array.from(this.char.companion_mission.rewards).length; i++) {
            const [itemId, amount] = this.char.companion_mission.rewards[i];
            const item = document.createElement("div");
            const itemBox = document.createElement("div");
            const qty = document.createElement("p");

            item.setAttribute("rarity", DATA.items[itemId][1]);
            itemBox.style.backgroundImage = `url("./resources/Item_${DATA.items[itemId][0].replace(/ /g, "").replace(/'/g, "")}.webp")`;
            qty.textContent = `${amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;

            item.append(itemBox, qty);
            this.DOM.cmRewards.appendChild(item);
        }
    }
}

class BrowserDebug {
    constructor(DOM) {
        this.DOM = DOM;
    }

    async callback() {
        try {
            const url = new URL(window.location);
            url.searchParams.set("path", this.DOM.pathOptions.value);
            if (!this.DOM.variantOptions.hidden) url.searchParams.set("variant", this.DOM.variantOptions.value);
            window.history.pushState({}, "", url);
            await HonkaiStarRail.fetchData();
        } catch (e) {
            console.error(`Error: ${e}`);
        }
    }

    showError(type, char = null, CACHE = null) {
        document.body.style.overflowY = "hidden";
        const params = new URLSearchParams(window.location.search);
        document.title = "Honkai: Star Rail";
        
        switch (type) {
            case 0:
                this.DOM.sadface.hidden = false;
                this.DOM.errorcode.style.textAlign = "left";
                this.DOM.pathOptions.innerHTML = "";
                this.DOM.variantOptions.innerHTML = "";
                break;
            case 1:
                if (!char || !char.path) return;

                Object.keys(char.path).forEach(key => {
                    const option = document.createElement("option");
                    option.value = key;
                    option.textContent = key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
                    this.DOM.pathOptions.appendChild(option);
                });

                this.DOM.sadface.hidden = false;
                this.DOM.sadface.innerHTML = "<i class='fas fa-circle-exclamation'></i>";
                
                if (params.get("characterId") == "4") this.DOM.errorcode.textContent = `Please choose the following path and variant selections for ${char.pronounce}.`;
                else {
                    this.DOM.errorcode.textContent = `Please choose the following path selections for ${char.pronounce}.`;
                    this.DOM.variantOptions.hidden = true;
                }
                break;
            case 2:
                sadface.hidden = false;
                sadface.innerHTML = "<i class='fas fa-circle-exclamation'></i>";
                sadface.style.textAlign = "center";
                break;
            case 4:
                if (!CACHE) return;

                sadface.hidden = false;
                sadface.innerHTML = "Character Selection";
                this.DOM.sadface.style.textAlign = "left";
                sadface.style.fontSize = "2.6vw";
                sadface.style.left = "10vw";
                
                error.style.width = "80vw";
                error.style.height = "50vh";
                error.style.left = "10vw";
                error.style.bottom = "0vh";
                error.style.top = "12.5vh";
                error.style.textAlign = "left";
                error.style.fontSize = "1.5vw";
                error.style.overflowY = "scroll";
                error.innerHTML = "Please select a character to continue.<br><ol>";
                
                let name;
                CACHE.characterList.forEach(c => {
                    if (!Array.isArray(c.pronounce)) name = c.pronounce;
                    else name = c.pronounce[0];
                    error.innerHTML += `<li><a href="?characterId=${c.id}" style="color: white; text-decoration: none;">${c.id} : ${name}</a><br></li>`;
                });
                error.innerHTML += "</ol>";
                this.DOM.optionsButton.replaceChildren();
                break;
            default: break;
        }
    }

    getParams() {
        return new URLSearchParams(window.location.search);
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    DOM = {
        screencover: document.getElementById("screencover"),
        backBtn: document.getElementById("undo"),
        errorcode: document.getElementById("error"),
        sadface: document.getElementById("sadface"),
        optionsButton: document.getElementById("options-button"),
        pathOptions: document.getElementById("path"),
        variantOptions: document.getElementById("variant"),
        submit: document.getElementById("submit"),
        relatedContents: document.querySelectorAll(".related-content"),
        imgDivs: document.querySelectorAll("div.imgDiv"),
        name: document.querySelectorAll("#name span"),
        quote: document.getElementById("quote"),
        additionalSpans: document.querySelectorAll(".otherinfo"),
        search: document.getElementById("searchbox"),
        empty: document.getElementById("empty"),
        description: document.getElementById("description"),
        cm: document.getElementById("companion-mission"),
        cmChapter: document.getElementById("chapter"),
        cmTitle: document.getElementById("title"),
        cmRequirements: document.getElementById("cm-req"),
        cmRewards: document.getElementById("cm-rewards")
    }

    debug = new BrowserDebug(DOM);
    HonkaiStarRail = new HonkaiStarRailGame(DOM, debug);
    
    document.querySelectorAll(".faction-dropdowns").forEach(dropdown => {
        dropdown.addEventListener("change", (e) => {
            const url = new URL(window.location);
            url.searchParams.set("characterId", e.target.value);
            window.history.pushState({}, "", url);
            HonkaiStarRail.fetchData();
        });
    });
    DOM.backBtn.addEventListener("click", (e) => {
        window.history.replaceState(null, '', window.location.origin + window.location.pathname);
        debug.showError(4, null, HonkaiStarRail.CACHE);
    });
    DOM.submit.addEventListener("click", (e) => debug.callback());
    DOM.search.addEventListener("focus", (e) => {
        e.target.placeholder = "";
        DOM.empty.hidden = false;
    });
    DOM.search.addEventListener("blur", (e) => {
        e.target.placeholder = "Search";
        if (!e.target.value) DOM.empty.hidden = true;
    });
    DOM.empty.addEventListener("click", () => {
        DOM.search.value = "";
        DOM.empty.hidden = true;
    });

    await HonkaiStarRail.fetchData();
    const urlParams = new URLSearchParams(window.location.search);
    if (!urlParams.get("characterId")) {
        debug.showError(4, null, HonkaiStarRail.CACHE); 
        return;
    } 
    // if (urlParams.get("characterId") === "4" && Array.from(urlParams.entries()).length === 2) {
    //     debug.showError(4);
    //     return;
    // }
    window.addEventListener("popstate", () => HonkaiStarRail.fetchData());
});