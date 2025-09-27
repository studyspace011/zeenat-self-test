class MCQTestApp {
    constructor() {
        this.questions = [];
        this.currentTest = null;
        this.currentQuestionIndex = 0;
        this.userAnswers = [];
        this.startTime = null;
        this.endTime = null;
        this.totalTimeLimitInSeconds = 0;
        this.timeLeft = 0;
        this.timerInterval = null;
        this.subjectName = '';
        this.chapterNumber = '';
        
        this.initializeElements();
        this.bindEvents();
        this.loadStoredData();
        // Removed Service Worker for simplicity, you can add it back if needed
    }

    initializeElements() {
        // Screen elements
        this.screens = {
            home: document.getElementById('home-screen'),
            test: document.getElementById('test-screen'),
            results: document.getElementById('results-screen'),
            history: document.getElementById('history-screen')
        };
        
        // Celebration element
        this.celebrationContainer = document.getElementById('celebration-animation');

        // Home screen elements
        this.csvFileInput = document.getElementById('csv-file');
        this.questionCount = document.getElementById('question-count');
        this.testSetup = document.getElementById('test-setup');
        this.subjectNameInput = document.getElementById('subject-name');
        this.chapterNumberInput = document.getElementById('chapter-number');
        this.numQuestions = document.getElementById('num-questions');
        this.totalTimeLimitInput = document.getElementById('total-time-limit');
        this.shuffleQuestions = document.getElementById('shuffle-questions');
        this.shuffleOptions = document.getElementById('shuffle-options');
        this.startTestBtn = document.getElementById('start-test');
        this.viewHistoryBtn = document.getElementById('view-history');
        
        // Test screen elements
        this.timeLeftElement = document.getElementById('time-left');
        this.currentQuestion = document.getElementById('current-question');
        this.totalQuestions = document.getElementById('total-questions');
        this.questionText = document.getElementById('question-text');
        this.optionsContainer = document.getElementById('options-container');
        this.prevBtn = document.getElementById('prev-btn');
        this.nextBtn = document.getElementById('next-btn');
        this.submitTestBtn = document.getElementById('submit-test');

        // Results screen elements
        this.scoreElement = document.getElementById('score');
        this.totalScoreElement = document.getElementById('total-score');
        this.percentageElement = document.getElementById('percentage');
        this.timeTakenElement = document.getElementById('time-taken');
        this.resultSubject = document.getElementById('result-subject');
        this.resultChapter = document.getElementById('result-chapter');
        this.questionsReview = document.getElementById('questions-review');
        this.newTestBtn = document.getElementById('new-test');
        this.exportResultsBtn = document.getElementById('export-results');

        // History screen elements
        this.historyList = document.getElementById('history-list');
        this.backToHomeBtn = document.getElementById('back-to-home');
        this.clearHistoryBtn = document.getElementById('clear-history');
    }

    bindEvents() {
        this.csvFileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        this.startTestBtn.addEventListener('click', () => this.startTest());
        this.prevBtn.addEventListener('click', () => this.previousQuestion());
        this.nextBtn.addEventListener('click', () => this.nextQuestion());
        this.submitTestBtn.addEventListener('click', () => this.submitTest());
        this.newTestBtn.addEventListener('click', () => this.showHomeScreen());
        this.viewHistoryBtn.addEventListener('click', () => this.showHistoryScreen());
        this.backToHomeBtn.addEventListener('click', () => this.showHomeScreen());
        this.clearHistoryBtn.addEventListener('click', () => this.clearHistory());
        this.exportResultsBtn.addEventListener('click', () => this.exportResults());
    }

    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            this.parseCSV(text);
            this.saveQuestionsToStorage();
            this.updateQuestionCount();
            this.showTestSetup();
        } catch (error) {
            alert('फ़ाइल पढ़ने में त्रुटि: ' + error.message);
        }
    }
    
    parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        this.questions = lines.slice(1).map(line => {
            const values = line.split('|');
            if (values.length < 7) return null;
            return {
                id: values[0]?.trim(),
                question: values[1]?.trim(),
                options: [values[2]?.trim(), values[3]?.trim(), values[4]?.trim(), values[5]?.trim()].filter(opt => opt),
                answer: values[6]?.trim(),
                tags: values[7]?.trim() || '',
                timeLimit: parseInt(values[8]?.trim()) || 30
            };
        }).filter(q => q && q.question);

        if (this.questions.length === 0) {
            throw new Error('कोई मान्य प्रश्न नहीं मिले।');
        }
    }

    saveQuestionsToStorage() {
        localStorage.setItem('mcq_questions', JSON.stringify(this.questions));
    }

    loadStoredData() {
        const stored = localStorage.getItem('mcq_questions');
        if (stored) {
            this.questions = JSON.parse(stored);
            this.updateQuestionCount();
            this.showTestSetup();
        }
    }

    updateQuestionCount() {
        this.questionCount.textContent = this.questions.length;
        this.numQuestions.max = this.questions.length;
        if (!this.numQuestions.value || parseInt(this.numQuestions.value) > this.questions.length) {
            this.numQuestions.value = Math.min(10, this.questions.length);
        }
    }

    showTestSetup() {
        this.testSetup.classList.remove('hidden');
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    startTest() {
        const numQs = parseInt(this.numQuestions.value);
        if (isNaN(numQs) || numQs < 1 || numQs > this.questions.length) {
            alert('कृपया प्रश्नों की एक वैध संख्या चुनें।');
            return;
        }

        this.subjectName = this.subjectNameInput.value || 'General';
        this.chapterNumber = this.chapterNumberInput.value || '-';
        this.totalTimeLimitInSeconds = parseInt(this.totalTimeLimitInput.value) * 60;
        this.timeLeft = this.totalTimeLimitInSeconds;

        let selectedQuestions = [...this.questions];
        if (this.shuffleQuestions.checked) {
            selectedQuestions = this.shuffleArray(selectedQuestions);
        }
        this.currentTest = selectedQuestions.slice(0, numQs);

        if (this.shuffleOptions.checked) {
            this.currentTest.forEach(q => {
                q.options = this.shuffleArray([...q.options]);
            });
        }

        this.userAnswers = new Array(this.currentTest.length).fill(null);
        this.currentQuestionIndex = 0;
        this.startTime = new Date();

        this.showScreen('test');
        this.displayQuestion();
        this.updateProgress();
        this.startTimer();
    }
    
    startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.updateTimerDisplay();
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.updateTimerDisplay();
            if (this.timeLeft <= 0) {
                this.submitTest();
            }
        }, 1000);
    }

    updateTimerDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        this.timeLeftElement.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    displayQuestion() {
        const question = this.currentTest[this.currentQuestionIndex];
        this.questionText.textContent = `प्रश्न ${this.currentQuestionIndex + 1}: ${question.question}`;
        
        this.optionsContainer.innerHTML = '';
        question.options.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'option';
            optionElement.textContent = option;
            
            if (this.userAnswers[this.currentQuestionIndex] === option) {
                optionElement.classList.add('selected');
            }
            
            optionElement.addEventListener('click', () => this.selectOption(option));
            this.optionsContainer.appendChild(optionElement);
        });

        this.updateNavigationButtons();
    }

    selectOption(selectedOption) {
        this.userAnswers[this.currentQuestionIndex] = selectedOption;
        this.displayQuestion(); // Re-render to show selection
    }

    updateProgress() {
        this.currentQuestion.textContent = this.currentQuestionIndex + 1;
        this.totalQuestions.textContent = this.currentTest.length;
    }

    updateNavigationButtons() {
        this.prevBtn.disabled = this.currentQuestionIndex === 0;
        this.nextBtn.style.display = this.currentQuestionIndex === this.currentTest.length - 1 ? 'none' : 'inline-block';
        this.submitTestBtn.style.display = this.currentQuestionIndex === this.currentTest.length - 1 ? 'inline-block' : 'none';
    }

    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.displayQuestion();
            this.updateProgress();
        }
    }

    nextQuestion() {
        if (this.currentQuestionIndex < this.currentTest.length - 1) {
            this.currentQuestionIndex++;
            this.displayQuestion();
            this.updateProgress();
        }
    }

    submitTest() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        
        this.endTime = new Date();
        this.calculateResults();
        this.saveTestResult();
        this.showResultsScreen();
    }

    calculateResults() {
        let correct = 0;
        this.currentTest.forEach((question, index) => {
            if (this.userAnswers[index] && this.userAnswers[index].toLowerCase() === question.answer.toLowerCase()) {
                correct++;
            }
        });

        const total = this.currentTest.length;
        const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
        const timeTaken = Math.floor((this.endTime - this.startTime) / 1000);

        this.currentResult = {
            score: correct,
            total: total,
            percentage: percentage,
            timeTaken: timeTaken,
            questions: this.currentTest,
            answers: this.userAnswers,
            date: new Date().toISOString(),
            subject: this.subjectName,
            chapter: this.chapterNumber,
            totalTimeLimit: this.totalTimeLimitInSeconds
        };
    }
    
    saveTestResult() {
        let history = JSON.parse(localStorage.getItem('test_history') || '[]');
        history.unshift(this.currentResult); // Add to the beginning
        if (history.length > 50) history.pop(); // Keep last 50
        localStorage.setItem('test_history', JSON.stringify(history));
    }

    showResultsScreen() {
        this.showScreen('results');
        const result = this.currentResult;
        this.scoreElement.textContent = result.score;
        this.totalScoreElement.textContent = result.total;
        this.percentageElement.textContent = result.percentage;
        this.timeTakenElement.textContent = this.formatTime(result.timeTaken);
        this.resultSubject.textContent = result.subject;
        this.resultChapter.textContent = result.chapter;

        this.displayQuestionsReview();

        if (result.percentage >= 80) {
            this.triggerCelebration();
        }
    }
    
    triggerCelebration() {
        this.celebrationContainer.innerHTML = '';
        const colors = ['#e84393', '#a29bfe', '#55efc4', '#ffeaa7', '#74b9ff'];
        for (let i = 0; i < 100; i++) {
            const confetti = document.createElement('div');
            confetti.classList.add('confetti');
            confetti.style.left = `${Math.random() * 100}vw`;
            confetti.style.top = `${Math.random() * -100}vh`;
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = `${Math.random() * 2}s`;
            confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
            this.celebrationContainer.appendChild(confetti);
        }
        setTimeout(() => this.celebrationContainer.innerHTML = '', 5000); // Clean up
    }

    displayQuestionsReview() {
        this.questionsReview.innerHTML = '';
        this.currentResult.questions.forEach((question, index) => {
            const userAnswer = this.currentResult.answers[index] || 'उत्तर नहीं दिया';
            const isCorrect = userAnswer.toLowerCase() === question.answer.toLowerCase();

            const reviewElement = document.createElement('div');
            reviewElement.className = `question-review ${isCorrect ? 'correct' : 'incorrect'}`;
            reviewElement.innerHTML = `
                <h4>${question.question}</h4>
                <div class="user-answer">तुम्हारा उत्तर: ${userAnswer}</div>
                ${!isCorrect ? `<div class="correct-answer">सही उत्तर: ${question.answer}</div>` : ''}
            `;
            this.questionsReview.appendChild(reviewElement);
        });
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    showHistoryScreen() {
        this.showScreen('history');
        this.displayHistory();
    }

    displayHistory() {
        const history = JSON.parse(localStorage.getItem('test_history') || '[]');
        this.historyList.innerHTML = history.length === 0 ? '<p>अभी तक कोई प्रयास नहीं हुआ है।</p>' : '';
        
        history.forEach((result, index) => {
            const date = new Date(result.date);
            const formattedDate = date.toLocaleDateString('hi-IN', { day: 'numeric', month: 'long', year: 'numeric' }) + ' ' + date.toLocaleTimeString('hi-IN');
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <h4>${result.subject || 'Test'} - Chapter ${result.chapter || '-'}</h4>
                <div class="history-stats">
                    <span>स्कोर: ${result.score}/${result.total} (${result.percentage}%)</span>
                    <span>समय: ${this.formatTime(result.timeTaken)}</span>
                </div>
                <div class="history-date">${formattedDate}</div>
                <div class="history-item-actions">
                    <button class="danger-btn delete-test-btn" data-index="${index}">🗑️ हटाएं</button>
                </div>`;
            this.historyList.appendChild(historyItem);
        });

        document.querySelectorAll('.delete-test-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.deleteTest(index);
            });
        });
    }

    deleteTest(index) {
        if (confirm('क्या आप वाकई इस टेस्ट परिणाम को हटाना चाहती हैं?')) {
            let history = JSON.parse(localStorage.getItem('test_history') || '[]');
            history.splice(index, 1);
            localStorage.setItem('test_history', JSON.stringify(history));
            this.displayHistory();
        }
    }

    clearHistory() {
        if (confirm('क्या आप वाकई सभी टेस्ट इतिहास हटाना चाहती हैं? यह वापस नहीं लाया जा सकेगा।')) {
            localStorage.setItem('test_history', '[]');
            this.displayHistory();
        }
    }

    showHomeScreen() {
        this.showScreen('home');
    }

    showScreen(screenName) {
        Object.values(this.screens).forEach(screen => screen.classList.remove('active'));
        this.screens[screenName].classList.add('active');
    }

    exportResults() {
        const result = this.currentResult;
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += `Zeenat's Test Result\n`;
        csvContent += `Subject,${result.subject}\n`;
        csvContent += `Chapter,${result.chapter}\n`;
        csvContent += `Score,${result.score}/${result.total}\n`;
        csvContent += `Percentage,${result.percentage}%\n`;
        csvContent += `Time Taken,${this.formatTime(result.timeTaken)}\n\n`;
        csvContent += `Question,Your Answer,Correct Answer,Status\n`;
        result.questions.forEach((q, i) => {
            const userAnswer = result.answers[i] || 'Not Answered';
            const isCorrect = userAnswer.toLowerCase() === q.answer.toLowerCase();
            csvContent += `"${q.question.replace(/"/g, '""')}","${userAnswer.replace(/"/g, '""')}","${q.answer.replace(/"/g, '""')}","${isCorrect ? 'Correct' : 'Incorrect'}"\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `zeenat_test_result_${new Date().getTime()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new MCQTestApp();
});
