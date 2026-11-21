// Chess Kids — Interactive Chess Puzzles

const boardElement = document.getElementById("chessboard");
const languageButton = document.getElementById("language-button");
const messageElement = document.getElementById("message");

let currentLanguage = localStorage.getItem("chessLanguage") || "en";

let puzzles = [];

let allPuzzles = [];
let examPuzzles = [];
let examScore = 0;
let examAttempts = 0;
let examActive = false;
const SELECTED_GROUP_KEY = "chessKidsSelectedGroup";

let selectedGroup =
    localStorage.getItem(SELECTED_GROUP_KEY) || "all";
let currentPuzzleIndex = 0;
let game = new Chess();
let selectedSquare = null;let possibleMoves = [];// Dragging state
let dragStartSquare = null;
let dragStartX = 0;
let dragStartY = 0;
let dragMoved = false;// Visual dragging
let draggedPieceElement = null;
let puzzleCompleted = false;

// Chess pieces
const pieces = {
    K: "♔", Q: "♕", R: "♖",
    B: "♗", N: "♘", P: "♙",
    k: "♚", q: "♛", r: "♜",
    b: "♝", n: "♞", p: "♟"
};

// Languages
const translations = {
    he: {
        title: "בעיות שחמט למתחילים!",
        instruction: "מצא מט במהלך אחד",
        progress: "תרגיל",
        of: "מתוך",
        success: "כל הכבוד!",
        retry: "נסה שוב!",
        finished: "אלוף השחמט!",
        loadError: "לא ניתן לטעון את התרגילים",
        button: "English",
        groupButton: "בחירת קבוצת תרגילים",
        completionTitle: "כל הכבוד! 🏆",
completionDescription: "השלמתם בהצלחה את כל 90 התרגילים!",
completionGroupsButton: "חזרה לבחירת קבוצות",
completionNextStage: "השלב הבא: מט בשני מהלכים!",
},completionTitle: "כל הכבוד! 🏆",
completionDescription: "השלמתם בהצלחה את כל 90 התרגילים!",
completionGroupsButton: "חזרה לבחירת קבוצות",
    en: {
        title: "Chess Puzzles for Beginners!",
        instruction: "Find Mate in One",
        progress: "Puzzle",
        of: "of",
        success: "Great Job!",
        retry: "Try Again!",
        finished: "Chess Champion!",
        loadError: "Unable to load puzzles",
     button: "עברית",
groupButton: "Choose Puzzle Group",
completionTitle: "Congratulations! 🏆",
completionDescription: "You have successfully completed all 90 puzzles!",
completionGroupsButton: "Back to Puzzle Groups",
completionNextStage: "Next stage: Mate in Two Moves!"
  }
};

function updateLanguage() {
    const t = translations[currentLanguage];
const isHebrew = currentLanguage === "he";

document.getElementById("welcome-title").textContent =
    isHebrew ? "לומדים שחמט" : "Learn Chess";

document.getElementById("welcome-subtitle").textContent =
    isHebrew ? "תרגילי מט" : "Checkmate Puzzles";

document.getElementById("welcome-start-button").textContent =
    isHebrew ? "התחל" : "Start";
    document.getElementById("welcome-language-button").textContent =
    isHebrew ? "English" : "עברית";
    document.documentElement.lang = currentLanguage;
    document.documentElement.dir =
        currentLanguage === "he" ? "rtl" : "ltr";

    document.getElementById("app-title").textContent = t.title;
    document.getElementById("instruction").textContent = t.instruction;

    languageButton.textContent = t.button;
document.getElementById("group-button").textContent = t.groupButton;
document.getElementById("completion-title").textContent = t.completionTitle;
document.getElementById("completion-description").textContent = t.completionDescription;
document.getElementById("completion-groups-button").textContent = t.completionGroupsButton;
document.getElementById("completion-next-stage").textContent = t.completionNextStage;
    // Exam introduction — Hebrew / English
    document.getElementById("exam-intro-title").textContent =
        isHebrew
            ? "אבחון מסכם — מט במסע אחד"
            : "Final Exam — Mate in One";

    document.getElementById("exam-intro-description").innerHTML =
        isHebrew
            ? "<strong>סיימתם את 90 תרגילי הלימוד!<br>כעת הגיע הזמן לבדוק את הידע שלכם.</strong>"
            : "<strong>You have completed all 90 practice puzzles!<br>Now it's time to test your knowledge.</strong>";

    document.getElementById("exam-intro-rules").innerHTML =
        isHebrew
            ? "במבחן 20 תרגילים.<br>לכל תרגיל יש שני ניסיונות.<br>לאחר שני ניסיונות שגויים עוברים לתרגיל הבא.<br>כדי לעבור יש לפתור לפחות 19 מתוך 20 התרגילים."
            : "The exam has 20 puzzles.<br>You have two attempts for each puzzle.<br>After two incorrect attempts, you move to the next puzzle.<br>To pass, you must solve at least 19 out of 20 puzzles.";

    document.getElementById("exam-start-button").textContent =
        isHebrew ? "התחלת המבחן" : "Start Exam";   
updateProgress();
// Update exam results when switching language
if (!document.getElementById("exam-result-screen").hidden) {
    showExamResults();
}
}

function updateProgress() {
    const t = translations[currentLanguage];

    const groupPrefix =
        selectedGroup && selectedGroup !== "all"
            ? (currentLanguage === "he"
                ? `קבוצה ${selectedGroup} — `
                : `Group ${selectedGroup} — `)
            : "";

    document.getElementById("progress").textContent =
        `${groupPrefix}${t.progress} ${currentPuzzleIndex + 1} ${t.of} ${puzzles.length}`;

    updateProgressBar();
}


function showMessage(type) {
    const t = translations[currentLanguage];

    // Restart message animation
    messageElement.className = "";
    void messageElement.offsetWidth;

    messageElement.textContent = t[type] || "";
    messageElement.className = type;

    // Play sound with the message
    if (type === "success") {
        playSuccessSound();
    }

    if (type === "retry") {
        playRetrySound();
    }
}



function drawBoard() {
    boardElement.innerHTML = "";

    boardElement.style.display = "grid";
    boardElement.style.gridTemplateColumns = "repeat(8, 1fr)";
    boardElement.style.gridTemplateRows = "repeat(8, 1fr)";

    const board = game.board();

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const square = document.createElement("div");

            const file = "abcdefgh"[col];
            const rank = 8 - row;
            const squareName = file + rank;

            square.classList.add("square");// Identify the square for mouse and touch interactions
square.dataset.square = squareName;// Show chess coordinates

if (row === 7) {
    const fileLabel = document.createElement("span");
    fileLabel.className = "file-label";
    fileLabel.textContent = file;
    square.appendChild(fileLabel);
}

if (col === 0) {
    const rankLabel = document.createElement("span");
    rankLabel.className = "rank-label";
    rankLabel.textContent = rank;
    square.appendChild(rankLabel);
}

           square.classList.add(
    (row + col) % 2 === 0 ? "light" : "dark"
);

         if (selectedSquare === squareName) {
    square.classList.add("selected");
}

// Highlight legal moves
if (possibleMoves.includes(squareName)) {
    square.classList.add("possible-move");
}

            const piece = board[row][col];

 if (piece) {
    const color = piece.color;
    const type = piece.type.toUpperCase();

    const pieceElement = document.createElement("img");

    pieceElement.className = "chess-piece";
    pieceElement.src = `./pieces/${color}${type}.svg`;
    pieceElement.alt = `${color}${type}`;
    pieceElement.draggable = false;

    square.appendChild(pieceElement);
}

            square.addEventListener("click", () => {
                handleSquareClick(squareName);
            });

            boardElement.appendChild(square);
        }
    }
}

function handleSquareClick(squareName) {
    if (puzzleCompleted || !puzzles.length) {
        return;
    }

    const piece = game.get(squareName);

   if (!selectedSquare) {
    if (piece && piece.color === "w") {
        selectedSquare = squareName;

        possibleMoves = game.moves({
            square: squareName,
            verbose: true
        }).map(move => move.to);

        drawBoard();
    }
    return;
}

   if (selectedSquare === squareName) {
    selectedSquare = null;
    possibleMoves = [];
    drawBoard();
    return;
}

   if (piece && piece.color === "w") {
    selectedSquare = squareName;

    possibleMoves = game.moves({
        square: squareName,
        verbose: true
    }).map(move => move.to);

    drawBoard();
    return;
}

    const from = selectedSquare;
    selectedSquare = null;possibleMoves = [];

    const puzzle = puzzles[currentPuzzleIndex];

    // Find all legal moves to the selected destination.
    const legalMoves = game.moves({
        square: from,
        verbose: true
    }).filter(move => move.to === squareName);

    if (legalMoves.length === 0) {
        showMessage("retry");
        drawBoard();
        return;
    }
// Check whether the move is a pawn promotion
const promotionMoves = legalMoves.filter(
    move => move.promotion
);

if (promotionMoves.length > 0) {
    openPromotionDialog(from, squareName);
    return;
}
    // Handle promotions, including multiple mating promotions.
    let successfulMove = null;

    for (const candidate of legalMoves) {
        const testGame = new Chess(puzzle.fen);

        const testMove = testGame.move({
            from: candidate.from,
            to: candidate.to,
            promotion: candidate.promotion || "q"
        });

        if (testMove && testGame.in_checkmate()) {
            successfulMove = candidate;
            break;
        }
    }

    if (successfulMove) {
        if (examActive) {
    examScore++;
}
        game.move({
            from: successfulMove.from,
            to: successfulMove.to,
            promotion: successfulMove.promotion || "q"
        });

        puzzleCompleted = true;
        drawBoard();
        showMessage("success");

       setTimeout(() => {
    advanceToNextPuzzle();
}, 1500);

    } else {
        showMessage("retry");
        drawBoard();
        registerExamMistake();
    }
}function areAllGroupsCompleted() {
    const groups = ["1", "2", "3", "4", "5"];

    return groups.every(group => {
        const key = `${PROGRESS_KEY}_${group}`;
        const completed = Number(localStorage.getItem(key) || 0);
        const total = getPuzzlesByGroup(group).length;

        return total > 0 && completed >= total;
    });
}
function advanceToNextPuzzle() {
    currentPuzzleIndex++;
    saveProgress();

    // Save exam score and current position
if (selectedGroup === "exam" && examActive) {
    examAttempts = 0;
    saveExamState();
}
   if (currentPuzzleIndex >= puzzles.length) {
        if (selectedGroup === "exam") {
        showExamResults();
        return;
    }
    if (areAllGroupsCompleted()) {
        showMessage("finished");
        console.log("All 90 puzzles completed!");
        showCompletionScreen();
    } else {
        showMessage("finished");
        console.log("Current puzzle group completed.");
    }
    return;
}

    loadPuzzle();
}
function showCompletionScreen() {
    const completionScreen =
        document.getElementById("completion-screen");

    const chessboard =
        document.getElementById("chessboard");

    if (!completionScreen || !chessboard) {
        return;
    }

    chessboard.hidden = true;
    completionScreen.hidden = true;
document.getElementById("exam-intro-screen").hidden = false;
}
function loadPuzzle() {
        // Restore exam safely after page refresh
    if (selectedGroup === "exam" && !examActive) {
        document.getElementById("welcome-screen").hidden = true;
        document.getElementById("completion-screen").hidden = true;
        document.getElementById("exam-result-screen").hidden = true;
        boardElement.hidden = true;
        messageElement.textContent = "";
        document.getElementById("exam-intro-screen").hidden = false;
        return;
    }
       
        if (currentPuzzleIndex >= puzzles.length) {
        showMessage("finished");

        if (areAllGroupsCompleted()) {
            showCompletionScreen();
        }

        return;
    }
    const puzzle = puzzles[currentPuzzleIndex];

    if (!puzzle || !puzzle.fen) {
        showMessage("loadError");
        return;
    }

    const loaded = game.load(puzzle.fen);

    if (!loaded) {
        showMessage("loadError");
        return;
    }

    selectedSquare = null;
possibleMoves = [];
puzzleCompleted = false;

    messageElement.className = "";
    messageElement.textContent = "";

    updateProgress();
    drawBoard();
}// Get puzzle groups from the database
 function getPuzzleGroups() {
    return ["1", "2", "3", "4", "5", "exam"];
}

function getPuzzlesByGroup(group) {
        if (group === "exam") {
        return examPuzzles;
    }
    if (group === "all") {
        return allPuzzles;
    }

    return allPuzzles.filter(puzzle => {
        const source = (puzzle.source_file || "").toLowerCase();
        const match = source.match(/\d+-\d+/);
        const number = match ? match[0] : "";

        switch (group) {
            case "1":
                return number === "1-1" || number === "1-2";

            case "2":
                return number === "1-3" || number === "1-4";

            case "3":
                return number === "1-5" || number === "1-6";

            case "4":
                return source === "discovered check.pdf" ||
                       source === "double check.pdf";

            case "5":
                return source === "pin.pdf" ||
                       source === "mix.pdf";

            default:
                return false;
        }
    });
}
 

async function loadDatabase() {
    try {
        const response = await fetch("chess_app_database.json");

        if (!response.ok) {
            throw new Error("Database not found");
        }

        const data = await response.json();
        // Load the 20 exam puzzles separately
const examResponse = await fetch("mate1_exam_20_preliminary.json");

if (!examResponse.ok) {
    throw new Error("Exam database not found");
}

const examData = await examResponse.json();

examPuzzles = Array.isArray(examData)
    ? examData
    : examData.puzzles || [];
    console.log("Exam puzzles loaded:", examPuzzles.length);
allPuzzles = data.puzzles.filter(     
            puzzle =>
                puzzle.app_status === "READY" &&
                puzzle.fen
        );
const validGroups = ["all", ...getPuzzleGroups()];

if (!validGroups.includes(selectedGroup)) {
    selectedGroup = "all";
    localStorage.setItem(SELECTED_GROUP_KEY, selectedGroup);
}

puzzles = getPuzzlesByGroup(selectedGroup);
        if (puzzles.length === 0) {
            throw new Error("No puzzles available");
        }

      // Restore saved progress
currentPuzzleIndex = restoreProgress();

// Restore exam state separately
if (selectedGroup === "exam") {
    const savedExam = restoreExamState();
    // Restore completed exam results
if (savedExam &&
    !savedExam.active &&
    savedExam.puzzleIndex === examPuzzles.length) {

    currentPuzzleIndex = savedExam.puzzleIndex;
    examScore = savedExam.score;
    examAttempts = savedExam.attempts;
    examActive = false;

    document.getElementById("welcome-screen").hidden = true;
    showExamResults();
    return;
}

    if (savedExam && savedExam.active &&
        savedExam.puzzleIndex < examPuzzles.length) {

        currentPuzzleIndex = savedExam.puzzleIndex;
        examScore = savedExam.score;
        examAttempts = savedExam.attempts;
        examActive = true;

        document.getElementById("welcome-screen").hidden = true;
        document.getElementById("exam-intro-screen").hidden = true;
        document.getElementById("exam-result-screen").hidden = true;
        boardElement.hidden = false;
    }
}

loadPuzzle();

    } catch (error) {
        console.error(error);
        showMessage("loadError");
    }
}

languageButton.addEventListener("click", () => {
    currentLanguage =
        currentLanguage === "he" ? "en" : "he";

    localStorage.setItem("chessLanguage", currentLanguage);

    updateLanguage();
});
// Welcome screen language button
document.getElementById("welcome-language-button")
    .addEventListener("click", () => {
        languageButton.click();
    });
// Start application
updateLanguage();
loadDatabase();// Chess piece dragging — mouse and touch

boardElement.addEventListener("pointerdown", (event) => {
    if (puzzleCompleted || !puzzles.length) return;

    const squareElement = event.target.closest(".square");
    if (!squareElement) return;

    const squareName = squareElement.dataset.square;
    const piece = game.get(squareName);

    if (!piece || piece.color !== "w") return;

    dragStartSquare = squareName;
    dragStartX = event.clientX;
    dragStartY = event.clientY;
    dragMoved = false;
});

boardElement.addEventListener("pointermove", (event) => {
    if (!dragStartSquare) return;

    const distance = Math.hypot(
        event.clientX - dragStartX,
        event.clientY - dragStartY
    );

    if (distance > 10 && !dragMoved) {
        dragMoved = true;

        const piece = game.get(dragStartSquare);

        if (piece) {
            createDraggedPiece(
                piece,
                event.clientX,
                event.clientY
            );
        }
    }

    if (dragMoved) {
        moveDraggedPiece(event.clientX, event.clientY);
    }
});

boardElement.addEventListener("pointerup", (event) => {
    if (!dragStartSquare) return;

   const from = dragStartSquare;
dragStartSquare = null;

removeDraggedPiece();

if (!dragMoved) return;

    // Find the square under the pointer
    const element = document.elementFromPoint(
        event.clientX,
        event.clientY
    );

    const targetSquare = element?.closest(".square");
    if (!targetSquare) return;

    const to = targetSquare.dataset.square;

    if (from === to) return;

    // Select the piece and use the existing move handler
    selectedSquare = from;

    possibleMoves = game.moves({
        square: from,
        verbose: true
    }).map(move => move.to);

    handleSquareClick(to);
});

boardElement.addEventListener("pointercancel", () => {
    dragStartSquare = null;
    dragMoved = false;
    removeDraggedPiece();
});
function createDraggedPiece(piece, x, y) {
    removeDraggedPiece();

    const symbol = piece.color === "w"
        ? piece.type.toUpperCase()
        : piece.type;

    const squareSize = boardElement.clientWidth / 8;

    draggedPieceElement = document.createElement("div");

    draggedPieceElement.className = "dragged-piece";
    draggedPieceElement.textContent = pieces[symbol];

    draggedPieceElement.style.width = squareSize + "px";
    draggedPieceElement.style.height = squareSize + "px";

    document.body.appendChild(draggedPieceElement);

    moveDraggedPiece(x, y);
}

function moveDraggedPiece(x, y) {
    if (!draggedPieceElement) return;

    draggedPieceElement.style.left = x + "px";
    draggedPieceElement.style.top = y + "px";
}

function removeDraggedPiece() {
    if (draggedPieceElement) {
        draggedPieceElement.remove();
        draggedPieceElement = null;
    }
}// Pawn promotion dialog

const promotionDialog =
    document.getElementById("promotion-dialog");

const promotionTitle =
    document.getElementById("promotion-title");

const promotionCancel =
    document.getElementById("promotion-cancel");

let pendingPromotion = null;

// Open promotion dialog
function openPromotionDialog(from, to) {
    pendingPromotion = { from, to };

    updatePromotionLanguage();

    promotionDialog.hidden = false;
}

// Update promotion dialog language
function updatePromotionLanguage() {
    if (currentLanguage === "he") {
        promotionTitle.textContent = "בחר כלי להכתרה";
        promotionCancel.textContent = "ביטול";
    } else {
        promotionTitle.textContent = "Choose a piece";
        promotionCancel.textContent = "Cancel";
    }

    const names = {
        he: {
            q: "מלכה",
            r: "צריח",
            b: "רץ",
            n: "פרש"
        },
        en: {
            q: "Queen",
            r: "Rook",
            b: "Bishop",
            n: "Knight"
        }
    };

    document.querySelectorAll(".promotion-choice")
        .forEach(button => {
            const type = button.dataset.promotion;
            button.setAttribute(
                "aria-label",
                names[currentLanguage][type]
            );
        });
}

// Handle promotion choice
document.querySelectorAll(".promotion-choice")
    .forEach(button => {
        button.addEventListener("click", () => {
            if (!pendingPromotion) return;

            const { from, to } = pendingPromotion;
            const promotion = button.dataset.promotion;

            pendingPromotion = null;
            promotionDialog.hidden = true;

            const testGame = new Chess(
                puzzles[currentPuzzleIndex].fen
            );

            const move = testGame.move({
                from: from,
                to: to,
                promotion: promotion
            });

            if (move && testGame.in_checkmate()) {

                game.move({
                    from: from,
                    to: to,
                    promotion: promotion
                });

                puzzleCompleted = true;
                if (examActive) {
    examScore++;
}
                drawBoard();
                showMessage("success");
                setTimeout(() => {
    advanceToNextPuzzle();
}, 1500);

                   

            } else {
                showMessage("retry");
                drawBoard();
                registerExamMistake();
            }
        });
    });

// Cancel promotion
promotionCancel.addEventListener("click", () => {
    pendingPromotion = null;
    promotionDialog.hidden = true;

    selectedSquare = null;
    possibleMoves = [];

    drawBoard();
});// Save and restore puzzle progress

const PROGRESS_KEY = "chessKidsProgress";
function getProgressKey() {
    return selectedGroup === "all"
        ? PROGRESS_KEY
        : `${PROGRESS_KEY}_${selectedGroup}`;
}
function saveProgress() {
    localStorage.setItem(
        getProgressKey(),
        String(currentPuzzleIndex)
    );
}

function restoreProgress() {
   const saved = localStorage.getItem(getProgressKey());

    if (saved === null) {
        return 0;
    }

    const index = Number(saved);

    if (!Number.isInteger(index) ||
        index < 0 ||
      index > puzzles.length) {
        return 0;
    }

    return index;
}// Restart puzzles from the beginning

const restartButton =
    document.getElementById("restart-button");

function updateRestartLanguage() {
    restartButton.textContent =
        currentLanguage === "he"
            ? "התחל מחדש"
            : "Start Over";
}

restartButton.addEventListener("click", () => {
    const question =
        currentLanguage === "he"
            ? "האם להתחיל מחדש מתרגיל 1? ההתקדמות הקודמת תימחק."
            : "Start again from puzzle 1? Previous progress will be lost.";

    if (!confirm(question)) {
        return;
    }

    currentPuzzleIndex = 0;
    saveProgress();

    selectedSquare = null;
    possibleMoves = [];
    puzzleCompleted = false;

    loadPuzzle();
});

// Update restart button when language changes
languageButton.addEventListener("click", updateRestartLanguage);

// Set initial button language
updateRestartLanguage();// Update the visual progress bar
function updateProgressBar() {
    const progressBar = document.getElementById("progress-bar");
    const progressContainer =
        document.querySelector(".progress-container");

    if (!progressBar || !progressContainer || puzzles.length === 0) {
        return;
    }

    const completed = Math.min(currentPuzzleIndex, puzzles.length);
    const percentage = (completed / puzzles.length) * 100;

    progressBar.style.width = percentage + "%";

    progressContainer.setAttribute(
        "aria-valuenow",
        String(completed)
    );

    progressContainer.setAttribute(
        "aria-valuemax",
        String(puzzles.length)
    );
}// Chess Kids - Sound effects

let audioContext = null;

function playTone(frequency, duration, delay = 0) {
    try {
        const AudioContextClass =
            window.AudioContext || window.webkitAudioContext;

        if (!AudioContextClass) return;

        if (!audioContext) {
            audioContext = new AudioContextClass();
        }

        if (audioContext.state === "suspended") {
            audioContext.resume().catch(() => {});
        }

        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();

        oscillator.type = "sine";
        oscillator.frequency.value = frequency;

        const startTime = audioContext.currentTime + delay;

        gain.gain.setValueAtTime(0.0001, startTime);
        gain.gain.exponentialRampToValueAtTime(
            0.12,
            startTime + 0.02
        );
        gain.gain.exponentialRampToValueAtTime(
            0.0001,
            startTime + duration
        );

        oscillator.connect(gain);
        gain.connect(audioContext.destination);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration + 0.01);

    } catch (error) {
        console.warn("Sound unavailable:", error);
    }
}

// Happy sound for a correct move
function playSuccessSound() {
    playTone(523.25, 0.18);
    playTone(659.25, 0.18, 0.16);
    playTone(783.99, 0.30, 0.32);
}

// Gentle sound for an incorrect move
function playRetrySound() {
    playTone(392, 0.16);
    playTone(329.63, 0.22, 0.15);
}// Register Service Worker for PWA

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker
            .register("./service-worker.js")
            .then(registration => {
                console.log(
                    "Service Worker registered:",
                    registration.scope
                );
            })
            .catch(error => {
                console.error(
                    "Service Worker registration failed:",
                    error
                );
            });
    });
}// Version 1.1 - Puzzle group selection

const groupButton = document.getElementById("group-button");
const groupDialog = document.getElementById("group-dialog");
const groupList = document.getElementById("group-list");
const groupCancel = document.getElementById("group-cancel");
// Select a puzzle group
function selectPuzzleGroup(group) {
        if (group === "exam") {
        groupDialog.hidden = true;
        boardElement.hidden = true;

        document.getElementById("exam-result-screen").hidden = true;
        document.getElementById("completion-screen").hidden = true;
        examIntroScreen.hidden = false;

        return;
    }
    const selectedPuzzles = getPuzzlesByGroup(group);

    if (selectedPuzzles.length === 0) {
        console.error("No puzzles in group:", group);
        return;
    }

    selectedGroup = group;
    localStorage.setItem(SELECTED_GROUP_KEY, selectedGroup);
    puzzles = selectedPuzzles;

    currentPuzzleIndex = restoreProgress();
    groupDialog.hidden = true;

    loadPuzzle();
}
const groupNames = {
    he: {
        "1": "מט פשוט 1",
        "2": "מט פשוט 2",
        "3": "מט פשוט+",
        "4": "שח נגלה ושח כפול",
        "5": "ריתוק ותרגילים מעורבים",
"exam": "מבחן מסכם — מט במסע אחד"
    },
    en: {
        "1": "Simple Mate 1",
        "2": "Simple Mate 2",
        "3": "Simple Mate+",
        "4": "Discovered & Double Check",
       "5": "Pin & Mixed Puzzles",
"exam": "Final Exam — Mate in One"
    }
};
function openGroupDialog() {
    groupList.innerHTML = "";

    const groups = getPuzzleGroups();



    groups.forEach(group => {
       const count = getPuzzlesByGroup(group).length;

        const button = document.createElement("button");
        button.type = "button";

       const groupName = groupNames[currentLanguage][group];

button.textContent =
    currentLanguage === "he"
        ? `קבוצה ${group} — ${groupName} (${count})`
        : `Group ${group} — ${groupName} (${count})`;
button.addEventListener("click", () => {
    selectPuzzleGroup(group);
});
        groupList.appendChild(button);
    });

    document.getElementById("group-dialog-title").textContent =
        currentLanguage === "he"
            ? "בחירת קבוצת תרגילים"
            : "Choose Puzzle Group";

    groupCancel.textContent =
        currentLanguage === "he" ? "ביטול" : "Cancel";

    groupDialog.hidden = false;
}

groupButton.addEventListener("click", openGroupDialog);
document.getElementById("completion-groups-button")
    .addEventListener("click", () => {
        document.getElementById("completion-screen").hidden = true;
        document.getElementById("chessboard").hidden = false;
        openGroupDialog();
    });
groupCancel.addEventListener("click", () => {
    groupDialog.hidden = true;
});


// Welcome screen
const welcomeScreen = document.getElementById("welcome-screen");
const welcomeStartButton = document.getElementById("welcome-start-button");

welcomeScreen.hidden = false;

welcomeStartButton.addEventListener("click", () => {
    welcomeScreen.hidden = true;
});
// Exam — start button
const examIntroScreen = document.getElementById("exam-intro-screen");
const examStartButton = document.getElementById("exam-start-button");

examStartButton.addEventListener("click", () => {
    examIntroScreen.hidden = true;

    selectedGroup = "exam";
    localStorage.setItem(SELECTED_GROUP_KEY, selectedGroup);

    puzzles = examPuzzles;
    currentPuzzleIndex = 0;

    examScore = 0;
    examAttempts = 0;
    examActive = true;
    saveProgress();
saveExamState();

    boardElement.hidden = false;
    loadPuzzle();
});
// Exam — count incorrect attempts
function registerExamMistake() {
    if (!examActive) return;

    examAttempts++;
    saveExamState();

    if (examAttempts >= 2) {
        puzzleCompleted = true;

        setTimeout(() => {
            advanceToNextPuzzle();
        }, 1500);
    }
}
// Exam — display final results
function showExamResults() {
    examActive = false;
    // Save completed exam state
saveExamState();
    // Clear the last puzzle message
messageElement.textContent = "";
messageElement.className = "";
    // Hide welcome screen
document.getElementById("welcome-screen").hidden = true;
    // Display exam completion instead of Puzzle 21 of 20
document.getElementById("progress").textContent =
    currentLanguage === "he"
        ? "המבחן הסתיים"
        : "Exam Completed";


    const passed = examScore >= 19;
    const isHebrew = currentLanguage === "he";

    document.getElementById("chessboard").hidden = true;
    document.getElementById("exam-intro-screen").hidden = true;
    document.getElementById("completion-screen").hidden = true;

    const resultScreen =
        document.getElementById("exam-result-screen");

    document.getElementById("exam-result-title").textContent =
        passed
            ? (isHebrew ? "כל הכבוד! 🏆" : "Congratulations! 🏆")
            : (isHebrew ? "כדאי להמשיך להתאמן" : "Keep Practicing!");

    document.getElementById("exam-result-score").textContent =
        isHebrew
            ? `הציון שלך: ${examScore} מתוך 20`
            : `Your score: ${examScore} out of 20`;

    document.getElementById("exam-result-message").textContent =
        passed
            ? (isHebrew
                ? "עברת את המבחן! אפשר להתקדם למט בשני מהלכים."
                : "You passed! You can advance to Mate in Two.")
            : (isHebrew
                ? "מומלץ לחזור לתרגול ולנסות שוב את המבחן."
                : "Practice some more and try the exam again.");

    document.getElementById("exam-retry-button").hidden = passed;
    document.getElementById("exam-next-stage-button").hidden = !passed;

// Exam result buttons — Hebrew / English
document.getElementById("exam-retry-button").textContent =
    isHebrew ? "נסה את המבחן שוב" : "Try Exam Again";

document.getElementById("exam-practice-button").textContent =
    isHebrew ? "חזרה לתרגול" : "Back to Practice";

document.getElementById("exam-next-stage-button").textContent =
    isHebrew ? "מעבר למט בשני מהלכים" : "Continue to Mate in Two";
    resultScreen.hidden = false;
}
// Exam — retry
document.getElementById("exam-retry-button")
    .addEventListener("click", () => {
        document.getElementById("exam-result-screen").hidden = true;

        selectedGroup = "exam";
        localStorage.setItem(SELECTED_GROUP_KEY, selectedGroup);

        puzzles = examPuzzles;
        currentPuzzleIndex = 0;

        examScore = 0;
        examAttempts = 0;
        examActive = true;

        saveProgress();
        saveExamState();

        boardElement.hidden = false;
        loadPuzzle();
    });
    // Exam — return to practice
document.getElementById("exam-practice-button")
    .addEventListener("click", () => {
        document.getElementById("exam-result-screen").hidden = true;

        examActive = false;

        selectedGroup = "1";
        localStorage.setItem(SELECTED_GROUP_KEY, selectedGroup);

        puzzles = getPuzzlesByGroup(selectedGroup);
        currentPuzzleIndex = restoreProgress();

        boardElement.hidden = false;

        if (currentPuzzleIndex >= puzzles.length) {
            currentPuzzleIndex = 0;
            saveProgress();
        }

        loadPuzzle();
        openGroupDialog();
    });
    // Exam — advance to Mate in Two
document.getElementById("exam-next-stage-button")
    .addEventListener("click", () => {
        window.location.href = "./mate2/";
    });
    // Save exam state separately from practice progress
function saveExamState() {
    const examState = {
        puzzleIndex: currentPuzzleIndex,
        score: examScore,
        attempts: examAttempts,
        active: examActive
    };

    localStorage.setItem(
        "chessKidsExamState",
        JSON.stringify(examState)
    );
}
// Restore saved exam state
function restoreExamState() {
    const saved = localStorage.getItem("chessKidsExamState");

    if (!saved) {
        return null;
    }

    try {
        const state = JSON.parse(saved);

        if (
            !Number.isInteger(state.puzzleIndex) ||
            state.puzzleIndex < 0 ||
            state.puzzleIndex > examPuzzles.length ||
            !Number.isInteger(state.score) ||
            state.score < 0 ||
            state.score > 20 ||
            !Number.isInteger(state.attempts) ||
            state.attempts < 0 ||
            state.attempts > 2 ||
            typeof state.active !== "boolean"
        ) {
            return null;
        }

        return state;
    } catch (error) {
        console.error("Cannot restore exam state:", error);
        return null;
    }
}
