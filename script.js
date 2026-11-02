/* =========================================
   ELEMENTOS PRINCIPAIS
========================================= */

const scenes = [...document.querySelectorAll(".scene")];

const music = document.getElementById("music");
const musicButton = document.getElementById("musicButton");

const voiceAudio = document.getElementById("voiceAudio");
const voiceButton = document.getElementById("voiceButton");
const voiceStatus = document.getElementById("voiceStatus");
const voiceOrb = document.getElementById("voiceOrb");
const narrationText = document.getElementById("narrationText");

const revelationAudio = document.getElementById("revelationAudio");
const revelationButton = document.getElementById("revelationButton");
const revelationStatus = document.getElementById("revelationStatus");
const revelationOrb = document.getElementById("revelationOrb");
const revelationText = document.getElementById("revelationText");

const answerInput = document.getElementById("answerInput");
const answerButton = document.getElementById("answerButton");

let musicWanted = false;
let voiceActive = false;
let revelationActive = false;

let currentRiddle = 0;
let answerLocked = false;

let typingFrame = null;
let revelationTypingFrame = null;

const NORMAL_MUSIC_VOLUME = 0.35;
const LOW_MUSIC_VOLUME = 0.10;


/* =========================================
   OS SETE ENIGMAS
========================================= */

const riddles = [

    {
        question: "Sou o único número que, quando multiplicado por qualquer outro, não altera a minha natureza: continuo a ser eu. Represento o vazio, mas também posso multiplicar o valor de quem me acompanha. Quem sou eu?",
        answers: ["zero", "0"],
        hint: "Represento o vazio e posso mudar o valor de um número."
    },

    {
        question: "Não tenho mãos, mas atraio. Não tenho voz, mas faço sentir a minha presença. Na física, posso aproximar corpos sem que precisem de se tocar. Que fenómeno sou eu?",
        answers: ["forca magnetica", "magnetismo"],
        hint: "É um fenómeno estudado na física."
    },

    {
        question: "Percorro o corpo inteiro, transportando aquilo de que cada célula necessita. Sou recolhida através de uma pequena agulha para revelar informações que os olhos não conseguem descobrir. Quem sou eu?",
        answers: ["sangue"],
        hint: "Pode ser analisado num laboratório."
    },

    {
        question: "Sou um símbolo matemático que procura aquilo que, multiplicado por si mesmo, produz determinado valor. Mas há sentimentos que parecem não ter raiz, até encontrarem alguém que lhes dê sentido. Que símbolo sou eu?",
        answers: ["raiz quadrada", "raiz", "radical", "√"],
        hint: "O seu símbolo parece um pequeno gancho."
    },

    {
        question: "Na física, represento o estado em que as forças se compensam. Nas relações, sou aquilo que duas pessoas procuram quando nenhuma quer perder a outra. Como me chamam?",
        answers: ["equilibrio"],
        hint: "É aquilo que procuramos quando tudo está em harmonia."
    },

    {
        question: "Comecei com uma simples conversa, cresci através de pequenas brincadeiras e sobrevivi a momentos de silêncio. Não fui planeado, muito menos anunciado. Mas, em algum momento, deixei de ser apenas aquilo que era. O que me tornei?",
        answers: ["amor"],
        hint: "É um sentimento."
    },

    {
        question: "Na matemática, sou representada por uma letra cujo valor ainda não conhecemos. Na vida, posso ser alguém que entrou sem fazer promessas, tornou-se importante e agora ocupa pensamentos que talvez nunca venha a conhecer. Quem sou eu?",
        answers: ["tu", "voce"],
        hint: "A resposta está mais perto do que imaginas."
    }

];


/* =========================================
   NORMALIZAR RESPOSTAS
========================================= */

function normalizeAnswer(value) {

    return value
        .trim()
        .toLocaleLowerCase("pt")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[.,!?;:]/g, "")
        .replace(/\s+/g, " ");

}


/* =========================================
   NAVEGAÇÃO ENTRE CENAS
========================================= */

function goTo(id) {

    const target = document.getElementById(id);

    if (!target) {
        console.error("Cena não encontrada:", id);
        return;
    }

    // Parar a primeira narração quando saímos da cena.
    if (
        document.getElementById("narration").classList.contains("active") &&
        id !== "narration"
    ) {

        if (!voiceAudio.paused) {
            voiceAudio.pause();
        }

        voiceActive = false;

        cancelAnimationFrame(typingFrame);

        voiceOrb.classList.remove("playing");

        updateMusicVolume();

    }

    // Parar a segunda narração quando saímos da cena.
    if (
        document.getElementById("revelation").classList.contains("active") &&
        id !== "revelation"
    ) {

        if (!revelationAudio.paused) {
            revelationAudio.pause();
        }

        revelationActive = false;

        cancelAnimationFrame(revelationTypingFrame);

        revelationOrb.classList.remove("playing");

        updateMusicVolume();

    }

    // Parar vídeos quando saímos da cena.
    const activeVideo = document.querySelector(
        ".scene.active .scene-video"
    );

    if (activeVideo && !activeVideo.ended) {
        activeVideo.pause();
        activeVideo.dataset.resumeMusic = "no";
    }

    if (id !== "possibilities") {
        clearPossibilityTimers();
    }

    scenes.forEach(scene => {
        scene.classList.remove("active");
    });

    target.classList.add("active");

    document.body.dataset.scene = id;

    if (id === "psychologistVideo") {
        playSceneVideo("psychologistVideoPlayer");
    }

    if (id === "no") {
        playSceneVideo("noVideo");
    }

    if (id === "dramaticEntry") {
        buildTunnel();
    }

}


/* =========================================
   COMEÇAR EXPERIÊNCIA
========================================= */

function startExperience() {

    currentRiddle = 0;
    answerLocked = false;

    answerInput.disabled = false;

    musicWanted = true;
    voiceActive = false;
    revelationActive = false;

    updateMusicVolume();

    music.play()
        .then(updateMusicButton)
        .catch(error => {
            console.log("A música não iniciou:", error);
        });

    loadRiddle();

    goTo("riddles");

}


/* =========================================
   CARREGAR ENIGMA
========================================= */

function loadRiddle() {

    const riddle = riddles[currentRiddle];

    document.getElementById("counter").textContent =
        `ENIGMA ${currentRiddle + 1} DE ${riddles.length}`;

    document.getElementById("riddleQuestion").textContent =
        riddle.question;

    document.getElementById("riddleHint").textContent =
        riddle.hint;

    answerInput.value = "";
    answerInput.disabled = false;

    answerButton.disabled = false;

    document.getElementById("feedback").textContent = "";

    document.getElementById("progressBar").style.width =
        (currentRiddle / riddles.length * 100) + "%";

}


/* =========================================
   VERIFICAR RESPOSTAS
========================================= */

function checkAnswer() {

    if (answerLocked) return;

    const feedback = document.getElementById("feedback");

    const userAnswer = normalizeAnswer(answerInput.value);

    const acceptedAnswers =
        riddles[currentRiddle].answers.map(normalizeAnswer);

    if (!userAnswer) {
        feedback.textContent = "Escreve uma resposta primeiro.";
        return;
    }

    if (acceptedAnswers.includes(userAnswer)) {

        answerLocked = true;

        answerInput.disabled = true;
        answerButton.disabled = true;

        feedback.textContent = "Muito bem! ❤️";
        feedback.style.color = "#ffffff";

        currentRiddle++;

        document.getElementById("progressBar").style.width =
            (currentRiddle / riddles.length * 100) + "%";

        setTimeout(() => {

            if (currentRiddle >= riddles.length) {

                goTo("revelation");

            } else {

                answerLocked = false;

                loadRiddle();

                answerInput.focus();

            }

        }, 1100);

    } else {

        feedback.textContent = "Ainda não. Tenta novamente.";
        feedback.style.color = "#ffd3e9";

    }

}

answerInput.addEventListener("keydown", event => {

    if (event.key === "Enter") {
        checkAnswer();
    }

});


/* =========================================
   PRIMEIRA NARRAÇÃO
========================================= */

const narrationParagraphs = [

    "De todos os números reais, zero é o meu favorito.",

    "E sabes uma coisa? Vejo em ti algo da natureza desse número. Normalmente, o zero é utilizado para representar a ausência de quantidade, como se significasse que não existe nada. Mas o seu verdadeiro poder vai muito além disso: dependendo da posição em que se encontra, pode transformar completamente o valor de um número.",

    "Pensa no dinheiro. Muitas vezes, aquilo que faz uma quantia crescer não é apenas o número que aparece primeiro, mas também os zeros que vêm depois dele. Às vezes, são precisamente os pequenos detalhes que fazem toda a diferença.",

    "Na matemática, um número que se encontra dentro de uma raiz quadrada parece estar preso a uma expressão que precisa de ser compreendida. E, de certa forma, há sentimentos que também nos deixam assim: sem saber exactamente como chegámos ali, nem como sair.",

    "Tu estás muitas vezes ocupada e, por vezes, parece que não reparas muito em mim. Quando te peço para ires até à padaria, por exemplo, dizes que sim, mas acabas por nunca aparecer. E eu fico sem saber o que realmente pensas. Talvez seja por isso que, tantas vezes, me faltam forças e coragem para dizer aquilo que guardo.",

    "Mas está tudo bem. Não te digo isto como uma cobrança. Digo porque, apesar de todas essas dúvidas, continuas a ser muito mais incrível do que eu alguma vez imaginei. E, de alguma maneira, acabaste por te tornar aquela incógnita que continuo a tentar compreender."

];


/* =========================================
   SEGUNDA NARRAÇÃO
========================================= */

const revelationParagraphs = [

    "Curioso como algumas das coisas mais bonitas começam sem qualquer intenção.",

    "Primeiro, fomos apenas duas pessoas que conversavam, partilhavam momentos e construíam uma amizade. Não existia nenhuma equação capaz de prever o resultado, nenhuma lei da física que explicasse a aproximação e nenhum exame que identificasse aquilo que estava a acontecer.",

    "Mas, algures entre conversas, brincadeiras e pequenos detalhes, a amizade começou a transformar-se em algo diferente.",

    "Talvez não exista uma fórmula para explicar o que sinto. E talvez nem todas as incógnitas precisem de ser resolvidas.",

    "Só queria que soubesses que, para mim, aquilo que começou como amizade acabou por adquirir um significado que guardo em silêncio."

];


/* =========================================
   PREPARAR OS PARÁGRAFOS
========================================= */

function prepareTypedText(container, paragraphs) {

    container.innerHTML = "";

    return paragraphs.map(() => {

        const paragraph = document.createElement("p");

        paragraph.className = "typed-paragraph";

        paragraph.textContent = "";

        container.appendChild(paragraph);

        return paragraph;

    });

}

const paragraphElements =
    prepareTypedText(narrationText, narrationParagraphs);

const revelationElements =
    prepareTypedText(revelationText, revelationParagraphs);


/* =========================================
   TEXTO SINCRONIZADO COM O ÁUDIO
========================================= */

function renderSyncedText(audio, paragraphs, elements, container) {

    const duration = audio.duration;

    if (!Number.isFinite(duration) || duration <= 0) {
        return;
    }

    const totalCharacters = paragraphs.reduce(
        (total, paragraph) => total + paragraph.length,
        0
    );

    const progress = Math.min(audio.currentTime / duration, 1);

    const targetCharacters = Math.floor(
        totalCharacters * progress
    );

    let charactersLeft = targetCharacters;
    let activeFound = false;

    elements.forEach((element, index) => {

        const fullText = paragraphs[index];

        const visibleCharacters = Math.min(
            fullText.length,
            Math.max(0, charactersLeft)
        );

        element.textContent = fullText.slice(0, visibleCharacters);

        charactersLeft -= visibleCharacters;

        element.classList.remove("active-line");

        if (!activeFound && visibleCharacters < fullText.length) {

            element.classList.add("active-line");

            activeFound = true;

        }

    });

    container.scrollTop = container.scrollHeight;

}


function renderNarration() {

    renderSyncedText(
        voiceAudio,
        narrationParagraphs,
        paragraphElements,
        narrationText
    );

}


function renderRevelation() {

    renderSyncedText(
        revelationAudio,
        revelationParagraphs,
        revelationElements,
        revelationText
    );

}


/* =========================================
   ANIMAÇÕES DE ESCRITA
========================================= */

function animateNarration() {

    if (voiceAudio.paused || voiceAudio.ended) return;

    renderNarration();

    typingFrame = requestAnimationFrame(animateNarration);

}


function animateRevelation() {

    if (revelationAudio.paused || revelationAudio.ended) return;

    renderRevelation();

    revelationTypingFrame =
        requestAnimationFrame(animateRevelation);

}


/* =========================================
   VOLUME DA MÚSICA
========================================= */

function updateMusicVolume() {

    if (!music) return;

    music.volume = (voiceActive || revelationActive)
        ? LOW_MUSIC_VOLUME
        : NORMAL_MUSIC_VOLUME;

}


/* =========================================
   REPRODUZIR PRIMEIRA NARRAÇÃO
========================================= */

function playNarration() {

    if (!voiceAudio.paused) {

        voiceAudio.pause();

        return;

    }

    if (voiceAudio.ended) {

        voiceAudio.currentTime = 0;

        paragraphElements.forEach(element => {
            element.textContent = "";
            element.classList.remove("active-line");
        });

    }

    voiceActive = true;

    updateMusicVolume();

    voiceAudio.play()
        .then(() => {

            voiceButton.textContent = "PAUSAR NARRAÇÃO";

            voiceStatus.textContent =
                "A tua voz está a acompanhar cada palavra.";

            voiceOrb.classList.add("playing");

            cancelAnimationFrame(typingFrame);

            animateNarration();

        })
        .catch(error => {

            voiceActive = false;

            updateMusicVolume();

            voiceStatus.textContent =
                "Não foi possível reproduzir minha-voz.mp3. Verifica o ficheiro.";

            console.error("Erro na narração:", error);

        });

}


/* =========================================
   REPRODUZIR SEGUNDA NARRAÇÃO
========================================= */

function playRevelation() {

    if (!revelationAudio.paused) {

        revelationAudio.pause();

        return;

    }

    if (revelationAudio.ended) {

        revelationAudio.currentTime = 0;

        revelationElements.forEach(element => {
            element.textContent = "";
            element.classList.remove("active-line");
        });

    }

    revelationActive = true;

    updateMusicVolume();

    revelationAudio.play()
        .then(() => {

            revelationButton.textContent = "PAUSAR MENSAGEM";

            revelationStatus.textContent =
                "A mensagem está a acompanhar cada palavra.";

            revelationOrb.classList.add("playing");

            cancelAnimationFrame(revelationTypingFrame);

            animateRevelation();

        })
        .catch(error => {

            revelationActive = false;

            updateMusicVolume();

            revelationStatus.textContent =
                "Não foi possível reproduzir revelacao.mp3. Verifica o ficheiro.";

            console.error("Erro na segunda narração:", error);

        });

}


/* =========================================
   EVENTOS DA PRIMEIRA VOZ
========================================= */

voiceAudio.addEventListener("timeupdate", renderNarration);
voiceAudio.addEventListener("loadedmetadata", renderNarration);

voiceAudio.addEventListener("pause", () => {

    if (!voiceAudio.ended) {

        voiceActive = false;

        updateMusicVolume();

        cancelAnimationFrame(typingFrame);

        voiceOrb.classList.remove("playing");

        voiceButton.textContent = "CONTINUAR A OUVIR ♫";

        voiceStatus.textContent = "Narração em pausa.";

    }

});

voiceAudio.addEventListener("ended", () => {

    voiceActive = false;

    cancelAnimationFrame(typingFrame);

    paragraphElements.forEach((element, index) => {

        element.textContent = narrationParagraphs[index];

        element.classList.remove("active-line");

    });

    voiceOrb.classList.remove("playing");

    voiceButton.textContent = "OUVIR NOVAMENTE ♫";

    voiceStatus.textContent = "A mensagem terminou. ❤️";

    updateMusicVolume();

});


/* =========================================
   EVENTOS DA SEGUNDA VOZ
========================================= */

revelationAudio.addEventListener("timeupdate", renderRevelation);
revelationAudio.addEventListener("loadedmetadata", renderRevelation);

revelationAudio.addEventListener("pause", () => {

    if (!revelationAudio.ended) {

        revelationActive = false;

        updateMusicVolume();

        cancelAnimationFrame(revelationTypingFrame);

        revelationOrb.classList.remove("playing");

        revelationButton.textContent = "CONTINUAR A OUVIR ♫";

        revelationStatus.textContent = "Mensagem em pausa.";

    }

});

revelationAudio.addEventListener("ended", () => {

    revelationActive = false;

    cancelAnimationFrame(revelationTypingFrame);

    revelationElements.forEach((element, index) => {

        element.textContent = revelationParagraphs[index];

        element.classList.remove("active-line");

    });

    revelationOrb.classList.remove("playing");

    revelationButton.textContent = "OUVIR NOVAMENTE ♫";

    revelationStatus.textContent = "A mensagem terminou. ❤️";

    updateMusicVolume();

});

revelationAudio.addEventListener("error", () => {

    revelationStatus.textContent =
        "Não encontrei revelacao.mp3. Confirma o nome e a localização do ficheiro.";

});


/* =========================================
   POSSIBILIDADES
========================================= */

let possibilityTimers = [];

function clearPossibilityTimers() {

    possibilityTimers.forEach(timer => {
        clearTimeout(timer);
    });

    possibilityTimers = [];

}


function startPossibilities() {

    goTo("possibilities");

    clearPossibilityTimers();

    const orb = document.getElementById("orb");
    const wave = document.getElementById("shockwave");
    const cloud = document.getElementById("possibilityCloud");
    const finalText = document.getElementById("possibilityFinal");

    cloud.innerHTML = "";

    finalText.classList.add("hidden");
    finalText.classList.remove("show");

    orb.classList.remove("explode");
    wave.classList.remove("burst");

    void orb.offsetWidth;

    const words = [

        "e se...",
        "uma conversa",
        "um sorriso",
        "um encontro",
        "uma mensagem",
        "um acaso",
        "uma escolha",
        "um começo",
        "uma história",
        "um futuro",
        "uma hipótese",
        "um talvez",
        "uma resposta",
        "um caminho",
        "uma oportunidade",
        "um momento",
        "uma memória",
        "um abraço",
        "uma descoberta",
        "um sentimento",
        "uma possibilidade",
        "uma coincidência",
        "uma surpresa",
        "um novo capítulo",
        "um pensamento",
        "uma esperança",
        "uma pergunta",
        "uma experiência",
        "uma eternidade",
        "algo diferente"

    ];

    const explosionTimer = setTimeout(() => {

        if (!document.getElementById("possibilities").classList.contains("active")) {
            return;
        }

        orb.classList.add("explode");
        wave.classList.add("burst");

        words.forEach(word => {

            const element = document.createElement("span");

            element.className = "possibility-word";
            element.textContent = word;

            element.style.left = (3 + Math.random() * 90) + "%";
            element.style.top = (8 + Math.random() * 82) + "%";

            element.style.animationDelay =
                (Math.random() * .9) + "s";

            cloud.appendChild(element);

        });

        [...cloud.children].forEach((element, index) => {

            const timer = setTimeout(() => {
                element.classList.add("vanish");
            }, 4200 + index * 300);

            possibilityTimers.push(timer);

        });

        const finalTimer = setTimeout(() => {

            if (!document.getElementById("possibilities").classList.contains("active")) {
                return;
            }

            finalText.classList.remove("hidden");

            requestAnimationFrame(() => {
                finalText.classList.add("show");
            });

        }, 4200 + words.length * 300);

        possibilityTimers.push(finalTimer);

    }, 1400);

    possibilityTimers.push(explosionTimer);

}


/* =========================================
   CONSTRUIR TÚNEL 3D
========================================= */

function buildTunnel() {

    const tunnel = document.getElementById("photoTunnel");

    tunnel.style.animation = "none";

    tunnel.innerHTML = '<div class="tunnel-end"></div>';

    void tunnel.offsetWidth;

    tunnel.style.animation = "";

    const photos = [
        "balbina1.jpg",
        "balbina2.jpg",
        "balbina3.jpg",
        "balbina4.jpg",
        "balbina5.jpg"
    ];

    const ringCount = 12;
    const photosPerRing = 8;

    for (let r = 0; r < ringCount; r++) {

        const diameter = 170 + r * 85;
        const depth = -r * 145;

        const ring = document.createElement("div");

        ring.className = "tunnel-ring";

        ring.style.setProperty("--diam", diameter + "px");
        ring.style.setProperty("--depth", depth + "px");

        tunnel.appendChild(ring);

        for (let i = 0; i < photosPerRing; i++) {

            const angle = i * (360 / photosPerRing) + (r % 2) * 22.5;

            const photo = document.createElement("img");

            photo.className = "tunnel-photo";

            photo.src = photos[
                (r * photosPerRing + i) % photos.length
            ];

            photo.alt = "Fotografia";
            photo.loading = "lazy";

            photo.style.setProperty("--angle", angle + "deg");
            photo.style.setProperty("--radius", (diameter / 2) + "px");
            photo.style.setProperty("--depth", depth + "px");

            tunnel.appendChild(photo);

        }

    }

}


/* =========================================
   RESPOSTAS SIM E NÃO
========================================= */

function answerYes() {
    goTo("dramaticEntry");
}

function answerNo() {
    goTo("no");
}


/* =========================================
   REPRODUZIR VÍDEOS
========================================= */

function playSceneVideo(id) {

    const video = document.getElementById(id);

    if (!video) return;

    const musicWasPlaying = musicWanted && !music.paused;

    video.dataset.resumeMusic = musicWasPlaying ? "yes" : "no";

    if (!music.paused) {
        music.pause();
    }

    video.currentTime = 0;

    video.play().catch(error => {

        console.log(
            "O vídeo não iniciou automaticamente. Carrega no Play.",
            error
        );

    });

}


/* =========================================
   CONTINUAR DEPOIS DO VÍDEO
========================================= */

function continueFromPsychologistVideo() {

    const video = document.getElementById("psychologistVideoPlayer");

    video.pause();

    video.dataset.resumeMusic = "no";

    goTo("question");

}


/* =========================================
   EVENTOS DOS VÍDEOS
========================================= */

document.querySelectorAll(".scene-video").forEach(video => {

    video.addEventListener("ended", function() {

        const shouldResumeMusic =
            this.dataset.resumeMusic === "yes";

        this.dataset.resumeMusic = "no";

        if (shouldResumeMusic && musicWanted) {

            music.play()
                .then(updateMusicButton)
                .catch(error => console.log(error));

        }

        if (this.id === "psychologistVideoPlayer") {
            goTo("question");
        }

        if (this.id === "noVideo") {
            goTo("infinity");
        }

    });

});


/* =========================================
   CONTROLO DA MÚSICA
========================================= */

function toggleMusic() {

    const activeVideo = document.querySelector(
        ".scene.active .scene-video"
    );

    if (activeVideo && !activeVideo.ended) {
        return;
    }

    if (music.paused) {

        musicWanted = true;

        updateMusicVolume();

        music.play()
            .then(updateMusicButton)
            .catch(error => console.log(error));

    } else {

        musicWanted = false;

        music.pause();

        updateMusicButton();

    }

}


function updateMusicButton() {

    musicButton.textContent = music.paused ? "♫" : "Ⅱ";

}

music.addEventListener("play", updateMusicButton);
music.addEventListener("pause", updateMusicButton);


/* =========================================
   FUNDO ANIMADO COM PARTÍCULAS
========================================= */

const canvas = document.getElementById("backgroundCanvas");
const ctx = canvas.getContext("2d");

let particles = [];
let animationFrame = null;


function resizeCanvas() {

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;

    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const amount = window.innerWidth < 700 ? 65 : 110;

    particles = Array.from({ length: amount }, () => ({

        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,

        radius: Math.random() * 2 + .5,

        speedX: (Math.random() - .5) * .6,
        speedY: Math.random() * .5 + .1,

        alpha: Math.random() * .7 + .2

    }));

}


function drawBackground() {

    ctx.clearRect(
        0,
        0,
        window.innerWidth,
        window.innerHeight
    );

    const scene = document.body.dataset.scene || "intro";

    particles.forEach(particle => {

        particle.x += particle.speedX;
        particle.y += particle.speedY;

        if (particle.y > window.innerHeight) {

            particle.y = 0;
            particle.x = Math.random() * window.innerWidth;

        }

        if (particle.x < 0) {
            particle.x = window.innerWidth;
        }

        if (particle.x > window.innerWidth) {
            particle.x = 0;
        }

        ctx.beginPath();

        ctx.arc(
            particle.x,
            particle.y,
            particle.radius,
            0,
            Math.PI * 2
        );

        let color = "255,255,255";

        if (scene === "riddles" || scene === "zero") {
            color = "80,190,255";
        }

        if (scene === "revelation") {
            color = "255,130,210";
        }

        if (scene === "narration") {
            color = "255,150,220";
        }

        if (scene === "root") {
            color = "190,130,255";
        }

        if (scene === "possibilities") {
            color = "255,100,220";
        }

        if (scene === "infinity" || scene === "dramaticEntry") {
            color = "140,170,255";
        }

        ctx.fillStyle = `rgba(${color},${particle.alpha})`;

        ctx.shadowBlur = 12;
        ctx.shadowColor = `rgba(${color},.8)`;

        ctx.fill();

    });

    ctx.shadowBlur = 0;

    animationFrame = requestAnimationFrame(drawBackground);

}


window.addEventListener("resize", resizeCanvas);

resizeCanvas();
drawBackground();


/* =========================================
   CENA INICIAL
========================================= */

document.body.dataset.scene = "intro";

updateMusicVolume();
updateMusicButton();