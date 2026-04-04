const DATA = {
    path: ["Destruction", "The Hunt", "Erudition", "Harmony", "Nihility", "Preservation", "Abundance", "Remembrance", "Elation"],
    type: ["Physical", "Fire", "Ice", "Lightning", "Wind", "Quantum", "Imaginary"],
    faction: ["???", "Collaboration", "Astral Express", "Stellaron Hunters", "Herta Space Station", "Jarilo-VI", "Xianzhou Alliance", "Penacony", "IPC", "Cosmic", "Amphoreus", "Planarcadia"]
};
const KEYS = ["path", "type", "faction"];
let DOM = {};
let CACHE = null;
let PATH, VARIANT, char;

const fetchData = async() => {
    try {
        if (!CACHE) {
            const response = await fetch("./data.json");
            if (!response.ok) {
                toggleErrorScreen(0);
                DOM.errorcode.textContent = `Failed to load data: ${response.statusText}`;
                console.error(`HTTP error; status: ${response.status}`);
            }
            CACHE = await response.json();
        }
        const params = new URLSearchParams(window.location.search);
        const id = parseInt(params.get("characterId")) || "";
        PATH = params.get("path") || "";
        VARIANT = params.get("variant") || "";
        char = CACHE.characterList.find(c => c.id === id);
        if (!char) {
            toggleErrorScreen();
            DOM.errorcode.textContent = `Page not found`;
            console.error(`Page not found`);
            return;
        }
        if (!PATH && char.path) {
            const url = new URL(window.location);
            if (url.searchParams.get("characterId") == "4") {
                toggleErrorScreen(2);
                DOM.errorcode.textContent = `Please choose the following path and variant selections for ${char.pronounce}.`;
            } else {
                toggleErrorScreen(1);
                DOM.errorcode.textContent = `Please choose the following path selections for ${char.pronounce}.`;
            }
            return;
        }
        loadData();
    } catch (e) {
        toggleErrorScreen(0);
        DOM.errorcode.textContent = `Error: ${e.message}`;
        console.error(`Error: ${e.message}`);
    }
};

function loadData() {
    let formatted, url, rawPath, availability;
    let codename = char.pronounce;
    if (VARIANT) codename += `${VARIANT.charAt(0).toUpperCase() + VARIANT.slice(1)}`;
    if (!Array.isArray(char.pronounce)) {
        rawPath = (PATH || "").toLowerCase();
        availability = char.path && rawPath in char.path;
    }
    if (Array.isArray(char.pronounce)) codename = char.pronounce[0].replace(/\s+/g, "");
    DOM.imgDivs.forEach(el => { 
        if (Array.isArray(char.pronounce)) url = `(./resources/Character_${codename}_SplashArt.webp)`;
        else url = `(./resources/Character_${codename.replace(/\s+/g, "")}_${rawPath.replace(/_/g, "").replace(/\b\w/g, c => c.toUpperCase())}_SplashArt.webp)`;
        el.style.backgroundImage = `url${url}`;
    });
    DOM.name.forEach((n, i) => { 
        if (Array.isArray(char.pronounce)) {
            n.textContent = char.pronounce[i] ?? "";
            document.title = `${char.pronounce[0]} - Honkai: Star Rail`;
        } else {
            if (availability) formatted = rawPath.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
            DOM.name[0].textContent = char.pronounce;
            DOM.name[1].textContent = formatted;
            document.title = `${char.pronounce}: ${formatted} - Honkai: Star Rail`;
        }
    });
    DOM.quote.textContent = `"${char.quote ?? "No quote available."}"`;
    DOM.additionalSpans.forEach((s, i) => {
        if (Array.isArray(char.pronounce)) {
            s.textContent = DATA[KEYS[i]][char.array[i]] ?? "FAILED";
            if (i === 2) s.textContent = `${s.textContent}`;
        } else {
            s.textContent = DATA[KEYS[i]][char.path[PATH].array[i]] ?? "FAILED";
            if (i === 2) s.textContent = `${s.textContent}`;
            return;
        }
    });
    DOM.screencover.hidden = true;
    DOM.imgDivs[1].hidden = false;
    DOM.imgDivs[1].classList.add("show");
}

function fixQuery() {
    const url = new URL(window.location);
    url.searchParams.set("path", DOM.pathOptions.value);
    if (!DOM.variantOptions.hidden) url.searchParams.set("variant", DOM.variantOptions.value);
    window.history.pushState({}, "", url);
    fetchData();
}

function setRelatedContents() {
    // const related = CACHE.characterList.filter(c => c.id !== char.id && c.array.some((val, i) => val === char.array[i]));
    // console.log(related);
}

function toggleErrorScreen(type) {
    document.title = "Honkai: Star Rail";
    // document.body.style.overflow = "hidden";
    switch (type) {
        case 0:
            sadface.hidden = false;
            DOM.errorcode.style.textAlign = "left";
            DOM.pathOptions.innerHTML = "";
            DOM.variantOptions.innerHTML = "";
            break;
        case 1:
            DOM.variantOptions.innerHTML = "";
            DOM.variantOptions.hidden = true;
            sadface.hidden = false;
            sadface.innerHTML = "<i class='fas fa-circle-exclamation'></i>";
            sadface.style.textAlign = "center";
            break;
        case 2:
            sadface.hidden = false;
            sadface.innerHTML = "<i class='fas fa-circle-exclamation'></i>";
            sadface.style.textAlign = "center";
            break;
        case 4:
            sadface.hidden = false;
            sadface.innerHTML = "Character Selection";
            sadface.style.fontSize = "2.5vw";
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

            CACHE.characterList.forEach(c => {
                error.innerHTML += `<li><a href="?characterId=${c.id}" style="color: white; text-decoration: none;">${c.pronounce}</a><br></li>`;
            });
            error.innerHTML += "</ol>";
            DOM.optionsButton.replaceChildren();
            break;
        default: break;
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    DOM = {
        screencover: document.getElementById("screencover"),
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
        empty: document.getElementById("empty")
    }
    document.querySelectorAll(".faction-dropdowns").forEach(dropdown => {
        dropdown.addEventListener("change", (e) => {
            const url = new URL(window.location);
            url.searchParams.set("characterId", e.target.value);
            window.history.pushState({}, "", url);
            fetchData();
        });
    });
    DOM.submit.addEventListener("click", (e) => fixQuery());
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

    await fetchData();
    const urlParams = new URLSearchParams(window.location.search);
    if (!urlParams.get("characterId")) {
        toggleErrorScreen(4); 
        return;
    } 
    // if (urlParams.get("characterId") === "4" && Array.from(urlParams.entries()).length === 2) {
    //     toggleErrorScreen(4);
    //     return;
    // }
    window.addEventListener("popstate", fetchData);
    setRelatedContents();
});