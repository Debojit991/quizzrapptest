document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("startBtn");
  const subject = document.getElementById("subject");
  const topic = document.getElementById("topic");
  const numQuestions = document.getElementById("numQuestions");
  const customTime = document.getElementById("customTime");
  const classSelect = document.getElementById("classSelect");
  const categorySelect = document.getElementById("categorySelect");

  // Update placeholder with recommended time (1.5 min per question)
  function updateRecommendedTime() {
    const numQ = parseInt(numQuestions.value);
    if (numQ && numQ > 0) {
      const recommended = (numQ * 1.5).toFixed(0); // Round off to nearest whole number
      customTime.placeholder = recommended;
    } else {
      customTime.placeholder = "e.g. 20";
    }
  }

  numQuestions.addEventListener("input", () => {
    updateRecommendedTime();
    customTime.value = ""; // optional: clear user input
  });

  // Initial placeholder update when page loads
  updateRecommendedTime();

  startBtn.addEventListener("click", () => {
    if (!subject.value) {
      alert("Please select a subject.");
      subject.focus();
      return;
    }
    if (!topic.value.trim()) {
      alert("Please enter a topic.");
      topic.focus();
      return;
    }
    if (!numQuestions.value) {
      alert("Please select number of questions.");
      numQuestions.focus();
      return;
    }
    if (!classSelect.value) {
      alert("Please select a class.");
      classSelect.focus();
      return;
    }

    // Use custom time if entered, else fallback to recommended placeholder
    let finalTime = parseFloat(customTime.value) || parseFloat(customTime.placeholder);

    if (!finalTime || finalTime <= 0) {
      alert("Please enter a valid test time.");
      customTime.focus();
      return;
    }

   

    // TODO: Start quiz logic here
  });
});
document.addEventListener("DOMContentLoaded", function () {
  const startBtn = document.getElementById("startBtn");
  const popup = document.getElementById("testPreviewPopup");
  const closeBtn = document.getElementById("closePreviewBtn");
  const confirmStartBtn = document.getElementById("confirmStartBtn");

  startBtn.addEventListener("click", function () {
    const subject = document.getElementById("subject").value;
    const topic = document.getElementById("topic").value.trim();
    const numQuestions = document.getElementById("numQuestions").value;
    const customTime = document.getElementById("customTime").value;
    const classSelect = document.getElementById("classSelect").value;
    const category = document.getElementById("categorySelect").value;
const difficulty = document.getElementById("difficulty").value;

    if (!subject || !topic || !customTime || !classSelect||!difficulty) {
      alert("Please fill all the fields before proceeding.");
      return;
    }

    // Set preview text
    document.getElementById("previewSubject").textContent = subject;
    document.getElementById("previewTopic").textContent = topic;
    document.getElementById("previewQuestions").textContent = numQuestions;
    document.getElementById("previewTime").textContent = customTime;
    document.getElementById("previewClass").textContent = classSelect;
    document.getElementById("previewCategory").textContent = category;
document.getElementById("previewDifficulty").textContent = difficulty;

    popup.classList.remove("hidden");
  });

  closeBtn.addEventListener("click", function () {
    popup.classList.add("hidden");
  });

  confirmStartBtn.addEventListener("click", function () {
    // Replace this with actual quiz page redirect
    
    popup.classList.add("hidden");
    // Example: window.location.href = 'quiz.html';
  });
});




document.getElementById("confirmStartBtn").addEventListener("click", function () {
  const subject = document.getElementById("previewSubject").innerText;
  const topic = document.getElementById("previewTopic").innerText;
  const category = document.getElementById("previewCategory").innerText;
  const classLevel = document.getElementById("previewClass").innerText;
  const questions = document.getElementById("previewQuestions").innerText;
  const time = document.getElementById("previewTime").innerText;

  // Encode URL parameters safely
  const queryParams = new URLSearchParams({
    subject: subject,
    topic: topic,
    category: category,
    class: classLevel,
    questions: questions,
    time: time
  });

  // Redirect to quiz.html with all data
  window.location.href = "quiz.html?" + queryParams.toString();
});


  