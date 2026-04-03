const DATA = {
    path: ["Destruction", "The Hunt", "Erudition", "Harmony", "Nihility", "Preservation", "Abundance", "Remembrance", "Elation"],
    type: ["Physical", "Fire", "Ice", "Lightning", "Wind", "Quantum", "Imaginary"],
    faction: ["???", "Collaboration", "Astral Express", "Stellaron Hunters", "Herta Space Station", "Jarilo-VI", "Xianzhou Alliance", "Penacony", "IPC", "Cosmic", "Amphoreus", "Planarcadia"]
};
const KEYS = ["path", "type", "faction"];
let DOM = {};
let CACHE = null;
let PATH;

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
        const id = parseInt(params.get("characterId")) || -1;
        PATH = params.get("path") || "";
        const char = CACHE.characterList.find(c => c.id === id);
        if (!char) {
            toggleErrorScreen();
            DOM.errorcode.textContent = `Page not found`;
            console.error(`Page not found`);
            return;
        }
        // if (!PATH) {
        //     toggleErrorScreen();
        //     DOM.errorcode.textContent = `No path specified`;
        //     console.error(`No path specified`);
        //     return;
        // }
        loadData(char);
    } catch (e) {
        DOM.errorcode.textContent = `Error: ${e.message}`;
        console.error(`Error: ${e.message}`);
    }
};

function loadData(char) {
    let formatted, url, rawPath, availability;
    let codename = char.pronounce;
    if (!Array.isArray(char.pronounce)) {
        rawPath = (PATH || "").toLowerCase();
        availability = char.path && rawPath in char.path;
    }
    if (Array.isArray(char.pronounce)) codename = char.pronounce[0].replace(/\s+/g, "");
    DOM.imgDivs.forEach(el => { 
        if (Array.isArray(char.pronounce)) url = `(./resources/Character_${codename}_SplashArt.webp)`;
        else url = `(./resources/Character_${codename.replace(/\s+/g, "")}_${rawPath.replace(/_/g, "").replace(/\b\w/g, c => c.toUpperCase())}_SplashArt.webp)`;
        el.style.backgroundImage = `url${url}`;
        console.log(url);
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

function setRelatedContents() {
    // const related = CACHE.characterList.filter(c => c.id !== char.id && c.array.some((val, i) => val === char.array[i]));
    // console.log(related);
}

function toggleErrorScreen(type) {
    document.title = "Honkai: Star Rail";
    switch (type) {
        case 0:
            sadface.hidden = false;
            DOM.errorcode.style.textAlign = "left";
            break;
        default: break;
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    DOM = {
        screencover: document.getElementById("screencover"),
        errorcode: document.getElementById("error"),
        sadface: document.getElementById("sadface"),
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

    window.addEventListener("popstate", fetchData);
    await fetchData();
    setRelatedContents();
});