import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import {
  getDatabase,
  ref,
  onValue,
  set
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";

document.addEventListener("DOMContentLoaded", function() {
  const firebaseConfig = {
    apiKey: "AIzaSyBC2idiTTcEgViXqRCSt0WwqeLEtkNChKg",
    authDomain: "countdown-hackathon.firebaseapp.com",
    databaseURL: "https://countdown-hackathon-default-rtdb.firebaseio.com",
    projectId: "countdown-hackathon",
    storageBucket: "countdown-hackathon.appspot.com",
    messagingSenderId: "531025729951",
    appId: "1:531025729951:web:bb9044329e055355b145aa",
    measurementId: "G-BZFMGS6MLF"
  };

  const app = initializeApp(firebaseConfig);
  const database = getDatabase(app);
  const countdownRef = ref(database, "countdown");

  const countdownDuration = 50 * 60 * 60; // 50 horas em segundos
  let countdownInterval;
  let countupInterval;

  const countdownEl = document.querySelector(".countdown");
  const countupEl = document.querySelector(".countup");
  const description = document.querySelector(".description");

  // Elementos countdown
  const hoursEl = document.querySelector(".countdown #hours");
  const minutesEl = document.querySelector(".countdown #minutes");
  const secondsEl = document.querySelector(".countdown #seconds");

  // Elementos countup
  const daysUpEl = document.querySelector(".countup #days");
  const hoursUpEl = document.querySelector(".countup #hours");
  const minutesUpEl = document.querySelector(".countup #minutes");
  const secondsUpEl = document.querySelector(".countup #seconds");

  // Data do evento
  const eventStart = new Date("2025-07-05T09:00:00").getTime();

  startCountUp();

  onValue(countdownRef, snapshot => {
    const data = snapshot.val();
    if (data && data.startTime > 0) {
      startCountDown(data.startTime);
    }
  });

  function startCountUp() {
    clearInterval(countupInterval);
    countupInterval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.floor((eventStart - now) / 1000);

      if (remaining <= 0) {
        clearInterval(countupInterval);
        countupEl.style.display = "none";
        countdownEl.style.display = "flex";
        description.innerText = "Contagem regressiva em andamento...";

        // Verifica se já existe startTime no banco ANTES de criar um novo
        onValue(
          countdownRef,
          snapshot => {
            const data = snapshot.val();

            if (data && data.startTime > 0) {
              // Se já existir startTime, apenas começa o countdown
              startCountDown(data.startTime);
            } else {
              // Se não existir, cria um novo startTime
              const startTime = Date.now();
              set(countdownRef, { startTime });
            }
          },
          { onlyOnce: true }
        ); // Escuta uma vez, não mantém ativo
      } else {
        const days = Math.floor(remaining / (3600 * 24));
        const hours = Math.floor(remaining % (3600 * 24) / 3600);
        const minutes = Math.floor(remaining % 3600 / 60);
        const seconds = remaining % 60;

        daysUpEl.innerText = String(days).padStart(2, "0");
        hoursUpEl.innerText = String(hours).padStart(2, "0");
        minutesUpEl.innerText = String(minutes).padStart(2, "0");
        secondsUpEl.innerText = String(seconds).padStart(2, "0");

        description.innerText = "Faltam...";
      }
    }, 1000);
  }

  function startCountDown(startTime) {
    clearInterval(countdownInterval);

    let alertOn = false; // para 1h30m
    let alertEndOn = false; // para 1 min
    let audioTimeout;

    const alertOnRef = ref(database, "alertOn");
    const alertEndOnRef = ref(database, "alertEndOn");

    // Ler flags do Firebase só uma vez ao iniciar
    onValue(
      alertOnRef,
      snapshot => {
        alertOn = snapshot.val() === true;
      },
      { onlyOnce: true }
    );

    onValue(
      alertEndOnRef,
      snapshot => {
        alertEndOn = snapshot.val() === true;
      },
      { onlyOnce: true }
    );

    countdownInterval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      const remaining = countdownDuration - elapsed;

      if (remaining <= 0) {
        description.innerText = "Tempo Esgotado!";
        hoursEl.innerText = "00";
        minutesEl.innerText = "00";
        secondsEl.innerText = "00";
        clearInterval(countdownInterval);

        clearTimeout(audioTimeout);
        return;
      }

      const hours = Math.floor(remaining / 3600);
      const minutes = Math.floor(remaining % 3600 / 60);
      const seconds = remaining % 60;

      hoursEl.innerText = String(hours).padStart(2, "0");
      minutesEl.innerText = String(minutes).padStart(2, "0");
      secondsEl.innerText = String(seconds).padStart(2, "0");

      const alertThreshold = 5400; // 1h30 em segundos
      const alertEndThreshold = 60; // 1 minuto em segundos

      // Aplica cor vermelha quando dentro do tempo crítico
      if (remaining <= alertThreshold) {
        countdownEl.style.borderColor = "red";
        hoursEl.style.backgroundColor = "red";
        minutesEl.style.backgroundColor = "red";
        secondsEl.style.backgroundColor = "red";
      } else {
        countdownEl.style.borderColor = "#FFF";
        hoursEl.style.backgroundColor = "rgba(27, 27, 27, 0.425)";
        minutesEl.style.backgroundColor = "rgba(27, 27, 27, 0.425)";
        secondsEl.style.backgroundColor = "rgba(27, 27, 27, 0.425)";
      }

      // Função para tocar o som e ativar a animação por 15s
      function triggerAlert() {
        const alertAudio = new Audio("assets/sounds/alert.mp3");
        alertAudio.loop = true;

        // Tentativa de tocar o som (pode falhar sem interação do usuário)
        alertAudio.play().catch(err => {
          console.warn("Falha ao tocar som:", err);
        });

        hoursEl.classList.add("alertTimer");
        minutesEl.classList.add("alertTimer");
        secondsEl.classList.add("alertTimer");

        // Para som e remove animação após 15s
        audioTimeout = setTimeout(() => {
          alertAudio.pause();
          alertAudio.currentTime = 0;

          hoursEl.classList.remove("alertTimer");
          minutesEl.classList.remove("alertTimer");
          secondsEl.classList.remove("alertTimer");
        }, 15000);
      }

      // Alerta 1h30m - só dispara uma vez
      if (remaining <= alertThreshold && !alertOn) {
        alertOn = true;
        set(alertOnRef, true);
        triggerAlert();
      }

      // Alerta 1 min - só dispara uma vez
      if (remaining <= alertEndThreshold && !alertEndOn) {
        alertEndOn = true;
        set(alertEndOnRef, true);
        triggerAlert();
      }
    }, 1000);
  }
});
