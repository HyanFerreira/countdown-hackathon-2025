// Countdown Hackathon IFSP 2025 - Estrutura Reorganizada e Melhorada

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import {
  getDatabase,
  ref,
  onValue,
  set
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";

// Firebase Config
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

// Global Variables
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const countdownRef = ref(database, "countdown");
const startedCountdownRef = ref(database, "Startedcountdown");

const countdownDuration = 50 * 60 * 60; // 50 hours in seconds
const eventStart = new Date("2025-07-05T09:00:00").getTime();

let countdownInterval;
let countupInterval;

// Elements
const countdownEl = document.querySelector(".countdown");
const countupEl = document.querySelector(".countup");
const description = document.querySelector(".description");

const hoursEl = document.querySelector(".countdown #hours");
const minutesEl = document.querySelector(".countdown #minutes");
const secondsEl = document.querySelector(".countdown #seconds");

const hoursUpEl = document.querySelector(".countup #hours");
const minutesUpEl = document.querySelector(".countup #minutes");
const secondsUpEl = document.querySelector(".countup #seconds");

const alertThreshold = 5400; // 1h30m
const alertEndThreshold = 300; // 5 min

// Event Listeners
document.addEventListener("DOMContentLoaded", () => {
  startCountUp();

  // Checar se countdown já começou e aplicar a cor correta
  onValue(startedCountdownRef, snapshot => {
    const started = snapshot.val() === true;
    if (started) {
      setTimerColor("green");
    } else {
      setTimerColor("default");
    }
  });

  onValue(countdownRef, snapshot => {
    const data = snapshot.val();

    if (data && data.startTime > 0) {
      const now = Date.now();
      const elapsed = Math.floor((now - data.startTime) / 1000);
      const remaining = countdownDuration - elapsed;

      if (remaining <= alertThreshold) {
        // 1h30m em segundos
        setTimerColor("red");
      } else if (remaining > alertThreshold) {
        setTimerColor("green");
      }
    } else {
      // Countdown ainda não começou
      onValue(
        startedCountdownRef,
        snap => {
          const started = snap.val() === true;
          setTimerColor(started ? "green" : "default");
        },
        { onlyOnce: true }
      );
    }
  });
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

      onValue(
        countdownRef,
        snapshot => {
          const data = snapshot.val();
          if (data && data.startTime > 0) {
            startCountDown(data.startTime);
          } else {
            const startTime = Date.now();
            set(countdownRef, { startTime });
            set(startedCountdownRef, true); // Marcar que o countdown começou
            startCountDown(startTime); // 👉 iniciar imediatamente o countdown
          }
        },
        { onlyOnce: true }
      );
    } else {
      const totalHours = Math.floor(remaining / 3600);
      const minutes = Math.floor(remaining % 3600 / 60);
      const seconds = remaining % 60;

      hoursUpEl.innerText = String(totalHours).padStart(2, "0");
      minutesUpEl.innerText = String(minutes).padStart(2, "0");
      secondsUpEl.innerText = String(seconds).padStart(2, "0");

      description.innerText = "Faltam...";

      // Mudar para verde faltando 15 segundos
      if (remaining <= 15) {
        setTimerColor("green");
      }
    }
  }, 1000);
}

function startCountDown(startTime) {
  clearInterval(countdownInterval);

  let alertOn = false;
  let alertEndOn = false;
  let audioTimeout;

  const alertOnRef = ref(database, "alertOn");
  const alertEndOnRef = ref(database, "alertEndOn");

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
      updateDisplay(0, 0, 0);
      clearInterval(countdownInterval);
      clearTimeout(audioTimeout);
      return;
    }

    const hours = Math.floor(remaining / 3600);
    const minutes = Math.floor(remaining % 3600 / 60);
    const seconds = remaining % 60;

    updateDisplay(hours, minutes, seconds);

    // Alerta de 1h30m
    if (remaining <= alertThreshold && !alertOn) {
      alertOn = true;
      set(alertOnRef, true);
      setTimerColor("red");
      triggerAlert("extreme"); // 🔔 usa o som EXTREME
    }

    // Alerta de 1 min
    if (remaining <= alertEndThreshold && !alertEndOn) {
      alertEndOn = true;
      set(alertEndOnRef, true);
      triggerAlert("extreme"); // 🔔 usa o som EXTREME
    }

    // Alerta para cada virada de hora
    if (remaining % 3600 === 15) {
      triggerAlert();
    }
  }, 1000);
}

function updateDisplay(hours, minutes, seconds) {
  hoursEl.innerText = String(hours).padStart(2, "0");
  minutesEl.innerText = String(minutes).padStart(2, "0");
  secondsEl.innerText = String(seconds).padStart(2, "0");
}

function setTimerColor(color) {
  if (color === "red") {
    countdownEl.style.borderColor = "red";
    hoursEl.style.backgroundColor = "red";
    minutesEl.style.backgroundColor = "red";
    secondsEl.style.backgroundColor = "red";
  } else if (color === "green") {
    countdownEl.style.borderColor = "green";
    hoursEl.style.backgroundColor = "green";
    minutesEl.style.backgroundColor = "green";
    secondsEl.style.backgroundColor = "green";

    countupEl.style.borderColor = "green";
    hoursUpEl.style.backgroundColor = "green";
    minutesUpEl.style.backgroundColor = "green";
    secondsUpEl.style.backgroundColor = "green";
  } else {
    countdownEl.style.borderColor = "#FFF";
    hoursEl.style.backgroundColor = "rgba(27, 27, 27, 0.425)";
    minutesEl.style.backgroundColor = "rgba(27, 27, 27, 0.425)";
    secondsEl.style.backgroundColor = "rgba(27, 27, 27, 0.425)";
  }
}

function triggerAlert(soundType = "normal") {
  let audioSrc;

  if (soundType === "extreme") {
    audioSrc = "assets/sounds/alert_extreme.mp3";
  } else {
    audioSrc = "assets/sounds/alert_clean.mp3";
  }

  const alertAudio = new Audio(audioSrc);
  alertAudio.loop = true;

  alertAudio.play().catch(err => {
    console.warn("Falha ao tocar som:", err);
  });

  hoursEl.classList.add("alertTimer");
  minutesEl.classList.add("alertTimer");
  secondsEl.classList.add("alertTimer");

  setTimeout(() => {
    alertAudio.pause();
    alertAudio.currentTime = 0;
    hoursEl.classList.remove("alertTimer");
    minutesEl.classList.remove("alertTimer");
    secondsEl.classList.remove("alertTimer");
  }, 16000);
}
