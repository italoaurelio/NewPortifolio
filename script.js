const menu = document.querySelector("#menu");
const hoverBg = document.querySelector("#hover-bg");
const links = document.querySelectorAll("#menu a");
const buttonWS1 = document.querySelector('#buttonWS1');
const buttonWS2 = document.querySelector('#buttonWS2');

let isPlaying = false;
let audioPlayer = document.getElementById("audio-player");
let audioSource = document.getElementById("audio-source");
let photo = document.getElementById("photo");
let nameTitle = document.getElementById("name-title");
let musicTitle = document.getElementById("music-title");
let playIcon = document.getElementById("play-icon");
let brIcon = document.getElementById("br-icon");

const songs = [
    { name: "Mario Remix", file: "assets/music/marioremix.mp3" },
    { name: "Geruldo Valley", file: "assets/music/gereudovalley.mp3" },
    { name: "Plantera Remix", file: "assets/music/terraria.mp3" }
];

function playMusic() {
    if (isPlaying) {
        audioPlayer.pause();
        photo.classList.remove("clicked");
        playIcon.classList.remove("clicked");
        brIcon.style.display = 'block';
        playIcon.style.display = 'none';
        musicTitle.classList.remove("clicked");
        nameTitle.textContent = "Ítalo Aurélio.";
        musicTitle.textContent = "Based in Brazil";
        audioSource.src = "";
        isPlaying = false;
    } else {
        const randomSong = songs[Math.floor(Math.random() * songs.length)];
        audioSource.src = randomSong.file;
        audioPlayer.load();
        audioPlayer.play();
        photo.classList.add("clicked");
        playIcon.classList.add("clicked");
        brIcon.style.display = 'none';
        playIcon.style.display = 'block';
        musicTitle.classList.add("clicked");
        nameTitle.textContent = "Now Playing";
        musicTitle.textContent = randomSong.name;
        isPlaying = true;
    }
}

// Add event listener to toggle play/pause
photo.addEventListener("click", playMusic);


links.forEach((link) => {
    link.addEventListener("mouseenter", () => {
        hoverBg.classList.add("hover-color");

        const rect = link.getBoundingClientRect();
        const menuRect = menu.getBoundingClientRect();

        const offsetX = rect.left - menuRect.left + rect.width / 2 - hoverBg.offsetWidth/2;

        hoverBg.style.transform = `translateX(${offsetX}px)`;
    });
});

menu.addEventListener("mouseleave", () => {
    hoverBg.style.transition = "transform 0.3s ease, background 0.5s ease";
    hoverBg.style.transform = "translateX(0)";
    hoverBg.classList.remove("hover-color");
});

function toggleClass(clickedButton, otherButton) {
    clickedButton.classList.add('active');
    otherButton.classList.remove('active');
}

async function loadAndRenderJSON(filePath) {
    try {
        const response = await fetch(filePath);
        const data = await response.json();

        let container = document.querySelector("#container");
        container.innerHTML = '';

        data.forEach(item => {
            const div = document.createElement('div');
            div.classList.add('card');
            div.innerHTML = `
                <div id="work">
                    <img src="${item.photo}" alt="">
                    <div id="workText">
                        <div class="t2">${item.date}</div>
                        <div class="t1">${item.name}</div>
                        <div class="t2">${item.ocupation}</div>
                        ${item.description ? `<p>${item.description}</p>` : ''}
                    </div>
                </div>
            `;
            container.appendChild(div);
        });
    } catch (error) {
        console.log('Erro ao carregar JSON:', error);
    }
}

async function loadAndRenderProjectsJSON() {
    try {
        const response = await fetch("/assets/dados/projects.json");
        const data = await response.json();

        let container = document.querySelector("#projectContainer");
        container.innerHTML = '';

        data.forEach(item => {
            const div = document.createElement('div');
            div.classList.add('projectBox');
            div.innerHTML = `
                <img src="${item.photo}" alt="">
                <div class="projectText">
                    <div class="t1">${item.name}</div>
                    <div class="t2">${item.date}</div>
                    <div class="t2">${item.ocupation}</div>
                    <div class="languagues">
                        ${item.descricao.map(desc => `
                                <p>${desc.text}</p>
                        `).join('')}
                    </div>
                </div>
            `;
            container.appendChild(div);
        });
    } catch (error) {
        console.log('Erro ao carregar JSON:', error);
    }
}

loadAndRenderJSON('assets/dados/work.json');

buttonWS1.addEventListener('click', () =>{
    toggleClass(buttonWS1,buttonWS2)
    loadAndRenderJSON('assets/dados/work.json');
});
buttonWS2.addEventListener('click', () =>{
    toggleClass(buttonWS2,buttonWS1)
    loadAndRenderJSON('assets/dados/studies.json');
});

loadAndRenderProjectsJSON();
