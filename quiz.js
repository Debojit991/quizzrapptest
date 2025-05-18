let isReviewMode = false;
let currentQuestion = 0;
let questions = [];
let score = 0;
let answers = [];
let markedForReview = new Set();
let timer;
let timeLeft = 0;
let quizDetails = {}; // Store details for use in localStorage
let currentDifficulty = "medium"; // Default difficulty level
async function generateQuestions(topic, num) {
  // 🔁 Adaptive difficulty based on last score
const lastScore = parseFloat(localStorage.getItem("lastScorePercentage"));

if (!isNaN(lastScore)) {
  if (lastScore < 40) {
    currentDifficulty = "easy";
  } else if (lastScore > 75) {
    currentDifficulty = "hard";
  } else {
    currentDifficulty = "medium";
  }
} else {
  currentDifficulty = "medium"; // default for first time
}

  const apiKey = "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"; // Replace with your actual API key
  const model = "llama-3.3-70b-versatile"; // Replace with your model name if different

  const prompt = `Generate ${num} multiple-choice questions with 4 options each on the topic "${topic}".
Each question should be of ${currentDifficulty} difficulty level.
Provide the correct answer index (0-3) for each question in JSON format like this:
[
  {
    "question": "Question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 1
  }
]`;


  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 1000,
        n: 1,
      }),
    });

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    try {
      const startIndex = aiResponse.indexOf('[');
      const endIndex = aiResponse.lastIndexOf(']') + 1;
      const jsonString = aiResponse.slice(startIndex, endIndex);
      const questions = JSON.parse(jsonString);
      return questions;
    } catch (error) {
      console.error("Error parsing AI response JSON: ", error);
      return [];
    }

  } catch (err) {
    console.error("Error fetching questions: ", err);
    return [];
  }
}


function startTimer(duration) {
  timeLeft = duration * 60;
  updateTimerDisplay();
  timer = setInterval(() => {
    timeLeft--;
    if (timeLeft < 0) {
      clearInterval(timer);
      submitQuiz();
      return;
    }
    updateTimerDisplay();
  }, 1000);
}

function updateTimerDisplay() {
  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const seconds = (timeLeft % 60).toString().padStart(2, '0');
  document.getElementById("quiz-timer").textContent = `Time: ${minutes}:${seconds}`;
}

function generateDummyQuestions(topic, num) {
  const dummy = [];
  for (let i = 1; i <= num; i++) {
    dummy.push({
      question: `Q${i}. What is related to ${topic}?`,
      options: [
        `Option A ${i}`,
        `Option B ${i}`,
        `Option C ${i}`,
        `Option D ${i}`
      ],
      correctAnswer: Math.floor(Math.random() * 4)
    });
  }
  return dummy;
}

function renderQuestion(index) {
  const q = questions[index];
  document.getElementById("question-text").textContent = q.question;

  const optionsList = document.getElementById("options-list");
  optionsList.innerHTML = "";

  q.options.forEach((opt, i) => {
    const li = document.createElement("li");
    li.textContent = opt;
    li.style.cursor = isReviewMode ? "default" : "pointer";

    if (isReviewMode) {
      // Highlight correct answer in green
      if (i === q.correctAnswer) {
        li.style.backgroundColor = "#d4edda"; // light green
        li.style.fontWeight = "bold";
      }
      // Highlight user's wrong selected answer in red with line-through
      if (answers[index] === i && i !== q.correctAnswer) {
        li.style.backgroundColor = "#f8d7da"; // light red
        li.style.textDecoration = "line-through";
      }
    } else {
      // Normal quiz mode: highlight selected option in blue and make clickable
      if (answers[index] === i) {
        li.classList.add("selected-option");
      }
      li.addEventListener("click", () => {
        answers[index] = i;
        renderQuestion(index);
      });
    }
    optionsList.appendChild(li);
  });

  updateQuestionNav();
}


function updateQuestionNav() {
  const nav = document.getElementById("question-nav");
  nav.innerHTML = "";

  questions.forEach((_, i) => {
    const btn = document.createElement("button");
    btn.textContent = i + 1;

    if (answers[i] !== undefined) {
      btn.style.backgroundColor = "#4caf50";
      btn.style.color = "white";
    }

    if (markedForReview.has(i)) {
      btn.style.border = "2px solid orange";
    }

    if (i === currentQuestion) {
      btn.style.border = "2px solid blue";
      btn.style.fontWeight = "bold";
    }

    btn.addEventListener("click", () => {
      currentQuestion = i;
      renderQuestion(currentQuestion);
    });

    nav.appendChild(btn);
  });
}

function clearResponse() {
  answers[currentQuestion] = undefined;
  markedForReview.delete(currentQuestion);
  renderQuestion(currentQuestion);
}

function markForReview() {
  markedForReview.add(currentQuestion);
  goNext();
}

function goPrev() {
  if (currentQuestion > 0) {
    currentQuestion--;
    renderQuestion(currentQuestion);
  }
}

function goNext() {
  if (currentQuestion < questions.length - 1) {
    currentQuestion++;
    renderQuestion(currentQuestion);
  }
}

// ------------------ MODALS ---------------------
function showSubmitPreviewModal() {
  document.getElementById("submitPreviewModal").style.display = "flex";
  document.body.classList.add("modal-open");
}

function hideSubmitPreviewModal() {
  document.getElementById("submitPreviewModal").style.display = "none";
  document.body.classList.remove("modal-open");
}
function showScoreAnalysis() {
  calculateScore();
  hideSubmitPreviewModal();

  const totalQuestions = questions.length;
  const attempted = answers.filter(ans => ans !== undefined).length;
  const correct = questions.filter((q, i) => answers[i] === q.correctAnswer).length;
  const wrong = attempted - correct;
  const unattempted = totalQuestions - attempted;
  const percentage = ((correct / totalQuestions) * 100).toFixed(2);

  // Store data in localStorage
  localStorage.setItem("quiz_data", JSON.stringify({
    questions,
    answers,
    score,
    markedForReview: Array.from(markedForReview),
    totalQuestions,
    timeTaken: (quizDetails.time * 60) - timeLeft,
    metadata: quizDetails
  }));

  // Update result text
  const resultModal = document.getElementById("resultModal");
  const finalScoreText = document.getElementById("finalScoreText");
  finalScoreText.textContent = `Your Score: ${score} / ${totalQuestions}`;

  // Populate score-details
  document.getElementById("totalQ").textContent = totalQuestions;
  document.getElementById("attemptedQ").textContent = attempted;
  document.getElementById("correctQ").textContent = correct;
  document.getElementById("wrongQ").textContent = wrong;
  document.getElementById("unattemptedQ").textContent = unattempted;
  document.getElementById("percentageQ").textContent = percentage;

  // Show result modal
  resultModal.style.display = "flex";
  document.body.classList.add("modal-open");
}

function calculateScore() {
  score = 0;
  questions.forEach((q, i) => {
    if (answers[i] === q.correctAnswer) score++;
  });

  // ✅ Save score percentage for difficulty adjustment
  const percentage = (score / questions.length) * 100;
  localStorage.setItem("lastScorePercentage", percentage);

  // ✅ Save current difficulty so it can be shown on the start modal
  localStorage.setItem("currentDifficulty", currentDifficulty);
}


function getQueryParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    subject: params.get("subject"),
    topic: params.get("topic"),
    category: params.get("category"),
    classLevel: params.get("class"),
    questionsCount: parseInt(params.get("questions")) || 10,
    time: parseInt(params.get("time")) || 20
  };
}

function showStartModal(details) {
  const modal = document.getElementById("startModal");
  const quizDetailsEl = document.getElementById("quizDetails");

  // ✅ Load difficulty from localStorage
  let difficulty = localStorage.getItem("currentDifficulty");
  if (!difficulty) {
    difficulty = "medium"; // default fallback
  }

  // ✅ Add difficulty info to modal content
  quizDetailsEl.innerHTML =
    `Subject: ${details.subject}<br>` +
    `Topic: ${details.topic}<br>` +
    `Category: ${details.category}<br>` +
    `Class: ${details.classLevel}<br>` +
    `Questions: ${details.questionsCount}<br>` +
    `Time: ${details.time} minutes<br>` ;


  modal.style.display = "flex";

  document.getElementById("startQuizBtn").onclick = async () => {
    modal.style.display = "none";
    await initQuiz(details);
  };
}


async function initQuiz(details) {
  quizDetails = details;

  document.getElementById("quiz-title").textContent = `${details.topic} Quiz`;
  document.getElementById("quiz-subject").textContent = details.subject;

  // Use AI-generated questions:
  questions = await generateQuestions(details.topic, details.questionsCount);

  // Or use dummy questions if AI fails or for testing:
  // questions = generateDummyQuestions(details.topic, details.questionsCount);

  if (!questions.length) {
    alert("Failed to load questions.");
    return;
  }
  answers = new Array(questions.length);

  document.querySelector(".quiz-container").style.display = "block";

  startTimer(details.time);
  renderQuestion(0);
}


// ------------------ EVENT LISTENERS ---------------------

window.onload = () => {
  const details = getQueryParams();
  if (
    !details.subject || !details.topic || !details.category ||
    !details.classLevel || !details.questionsCount || !details.time
  ) {
    alert("Missing quiz parameters in URL");
    return;
  }
  showStartModal(details);
};

document.getElementById("clear-btn").addEventListener("click", clearResponse);
document.getElementById("mark-btn").addEventListener("click", markForReview);
document.getElementById("prev-btn").addEventListener("click", goPrev);
document.getElementById("next-btn").addEventListener("click", goNext);
document.getElementById("submit-btn").addEventListener("click", showSubmitPreviewModal);

document.getElementById("confirmSubmitBtn").addEventListener("click", showScoreAnalysis);
document.getElementById("cancelSubmitBtn").addEventListener("click", hideSubmitPreviewModal);


document.addEventListener("DOMContentLoaded", () => {
    const cancelBtn = document.getElementById("cancelAnalysisBtn");
    cancelBtn.addEventListener("click", () => {
      // Hide the modal
      document.getElementById("resultModal").style.display = "none";
      // Remove modal-open class from body (if added for disabling scroll)
      document.body.classList.remove("modal-open");
    });
  });

 document.getElementById("reviewBtn").addEventListener("click", () => {
  if (!isReviewMode) {
    isReviewMode = true;
    currentQuestion = 0;

    // Stop the timer and reset timeLeft to 0
    clearInterval(timer);
    timeLeft = 0;
    updateTimerDisplay(); // Show 00:00

    renderQuestion(currentQuestion);
    document.getElementById("reviewBtn").textContent = "Exit Review";

    // Close any open modals
    hideSubmitPreviewModal();
    document.getElementById("resultModal").style.display = "none";
    document.body.classList.remove("modal-open");
  } else {
    isReviewMode = false;
    renderQuestion(currentQuestion);
    document.getElementById("reviewBtn").textContent = "Review Answers";
  }
});
document.getElementById("retestBtn").addEventListener("click", () => {
  const savedQuiz = JSON.parse(localStorage.getItem("quiz_data"));

  if (!savedQuiz) {
    alert("No previous quiz found for retest.");
    return;
  }

  // Reset variables
  isReviewMode = false;
  currentQuestion = 0;
  questions = savedQuiz.questions;
  answers = new Array(questions.length);
  markedForReview = new Set();
  score = 0;

  // Clear and restart timer
  clearInterval(timer);
  startTimer(savedQuiz.metadata.time); // `time` in minutes

  // Update UI
  document.getElementById("resultModal").style.display = "none";
  document.body.classList.remove("modal-open");

  document.querySelector(".quiz-container").style.display = "block";
  document.getElementById("reviewBtn").textContent = "Review Answers";

  renderQuestion(0);
});
document.getElementById("backBtn").addEventListener("click", () => {
  window.location.href = "index.html"; // Change this to your quiz settings page
});

 const countdownEl = document.getElementById('countdown');
  const loader = document.getElementById('loader');
  const mainContent = document.getElementById('main-content');

  const sounds = {
    3: new Audio('https://www.soundjay.com/button/beep-07.wav'),
    2: new Audio('https://www.soundjay.com/button/beep-07.wav'),
    1: new Audio('https://www.soundjay.com/button/beep-07.wav'),
    go: new Audio('https://www.soundjay.com/button/beep-08b.wav')
  };

  let count = 3;

  const countdown = setInterval(() => {
    if (count > 0) {
      countdownEl.textContent = count;
      countdownEl.style.animation = 'pop 0.5s ease-in-out';
      countdownEl.style.color = '#2196f3';
      countdownEl.style.textShadow = '0 0 20px rgba(33, 150, 243, 0.7)';
      sounds[count].play();
      count--;
    } else if (count === 0) {
      countdownEl.textContent = 'GO!';
      countdownEl.style.color = '#2196f3';
      countdownEl.style.textShadow = '0 0 30px rgba(33, 150, 243, 0.9)';
      sounds.go.play();
      count--;
    } else {
      clearInterval(countdown);
      loader.style.display = 'none';
      mainContent.style.display = 'block';
    }
  }, 1000);

