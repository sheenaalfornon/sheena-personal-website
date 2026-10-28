'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  // Existing website interactions
  let timerInterval;
  function runTimer() {
    const time = $('#time');
    if (!time) return;
    clearInterval(timerInterval);
    let seconds = 45;
    time.textContent = seconds;
    timerInterval = setInterval(() => {
      seconds = Math.max(0, seconds - 1);
      time.textContent = seconds;
      if (seconds === 0) clearInterval(timerInterval);
    }, 1000);
  }
  const startButton = $('#start');
  if (startButton) startButton.addEventListener('click', () => {
    $('#intro')?.classList.add('hidden');
    $('#timerBox')?.classList.remove('hidden');
    runTimer();
    $('#home')?.scrollIntoView({ behavior: 'smooth' });
  });
  $('#reset')?.addEventListener('click', runTimer);

  $$('.expand').forEach(card => {
    const toggle = () => card.classList.toggle('open');
    card.addEventListener('click', toggle);
    card.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault(); toggle();
      }
    });
  });
  $$('.flip').forEach(card => {
    const toggle = () => card.classList.toggle('open');
    card.addEventListener('click', toggle);
    card.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault(); toggle();
      }
    });
  });
  addEventListener('scroll', () => {
    const track = document.documentElement.scrollHeight - innerHeight;
    const percent = track ? Math.round(scrollY / track * 100) : 0;
    if ($('#bar')) $('#bar').style.width = `${percent}%`;
    if ($('#pct')) $('#pct').textContent = `${percent}% seen`;
  }, { passive: true });
  const modal = $('#modal');
  $('#scan')?.addEventListener('click', () => modal?.classList.remove('hidden'));
  $('#close')?.addEventListener('click', () => modal?.classList.add('hidden'));
  modal?.addEventListener('click', event => { if (event.target === modal) modal.classList.add('hidden'); });
  const glow = $('#cursorGlow');
  if (glow) addEventListener('pointermove', event => {
    glow.style.left = `${event.clientX}px`; glow.style.top = `${event.clientY}px`;
  }, { passive: true });

  // Shared completion status
  const completedGames = new Set();
  function completeGame(game) {
    completedGames.add(game);
    const progress = $('#gameProgress');
    if (progress) progress.textContent = `${completedGames.size}/3 COMPLETE`;
    if (completedGames.size === 3) $('#allGamesBadge')?.classList.remove('hidden');
  }

  // Tabs
  const tabs = $$('.game-tab');
  tabs.forEach(tab => tab.addEventListener('click', () => {
    tabs.forEach(item => {
      const active = item === tab;
      item.classList.toggle('active', active);
      item.setAttribute('aria-selected', String(active));
    });
    $$('.game-panel').forEach(panel => {
      const active = panel.id === `game-${tab.dataset.game}`;
      panel.hidden = !active;
      panel.classList.toggle('active', active);
    });
  }));

  // Wordle
  const wordData = [
    ['GRASS','Something simple and green that makes an ordinary place feel peaceful.','Grass represents the calm, ordinary details I genuinely notice.'],
    ['BOOKS','Stories I can disappear into, especially when the real world feels too loud.','Books connect to my love of stories with depth.'],
    ['WALKS','A quiet activity that gives me space to observe and think.','Long walks give me both clarity and connection.'],
    ['AURORA','A natural light display I witnessed in Canada.','Seeing the Northern Lights turned a dream into a real memory.'],
    ['SNOW','A first-time experience I had in Canada.','My first snowfall is a memory I will always keep.'],
    ['DREAM','Something that can become a memory when life surprises you.','Dreams connect my memories to future destinations.'],
    ['QUIET','A softer part of me underneath the laughter people first notice.','Quiet reflects the introverted and observant side of my personality.'],
    ['SCOTLAND','A place of landscapes, castles, and long walks that I hope to visit.','Scotland is my next dream destination.'],
    ['CANADA','A former dream destination that became a meaningful memory.','Canada is where I experienced the aurora and my first snowfall.'],
    ['CURIOUS','A word that represents the way I observe and understand things.','Curiosity shapes the way I learn and explore.']
  ].map(([word,hint,meaning]) => ({word,hint,meaning}));
  let currentWord;
  let wordRow = 0;
  const maximumWordRows = 6;

  function createWordle() {
    const board = $('#wordBoard');
    const input = $('#wordInput');
    if (!board || !input) return;
    currentWord = wordData[Math.floor(Math.random() * wordData.length)];
    wordRow = 0;
    board.innerHTML = '';
    for (let row = 0; row < maximumWordRows; row++) {
      const rowElement = document.createElement('div');
      rowElement.className = 'word-row';
      for (let column = 0; column < currentWord.word.length; column++) {
        const tile = document.createElement('span');
        tile.className = 'letter-tile';
        tile.setAttribute('aria-hidden', 'true');
        rowElement.appendChild(tile);
      }
      board.appendChild(rowElement);
    }
    $('#wordHint').textContent = `${currentWord.hint} (${currentWord.word.length} letters)`;
    $('#wordMessage').textContent = '';
    input.value = '';
    input.maxLength = currentWord.word.length;
    input.placeholder = `${currentWord.word.length}-letter word`;
    input.disabled = false;
    $('#submitGuess').disabled = false;
  }

  function scoreWord(guess, answer) {
    const result = Array(answer.length).fill('absent');
    const counts = {};
    [...answer].forEach(letter => counts[letter] = (counts[letter] || 0) + 1);
    [...guess].forEach((letter, index) => {
      if (letter === answer[index]) { result[index] = 'correct'; counts[letter]--; }
    });
    [...guess].forEach((letter, index) => {
      if (result[index] !== 'correct' && counts[letter] > 0) {
        result[index] = 'present'; counts[letter]--;
      }
    });
    return result;
  }

  function submitWordleGuess() {
    const input = $('#wordInput');
    if (!input || !currentWord || wordRow >= maximumWordRows) return;
    const guess = input.value.trim().toUpperCase();
    if (!/^[A-Z]+$/.test(guess) || guess.length !== currentWord.word.length) {
      $('#wordMessage').textContent = `Enter exactly ${currentWord.word.length} letters.`;
      return;
    }
    const row = $$('.word-row')[wordRow];
    const scores = scoreWord(guess, currentWord.word);
    [...guess].forEach((letter, index) => {
      const tile = row.children[index];
      tile.textContent = letter;
      setTimeout(() => tile.classList.add(scores[index]), index * 90);
    });
    wordRow++;
    input.value = '';
    if (guess === currentWord.word) {
      $('#wordMessage').textContent = `Correct: ${currentWord.word}. ${currentWord.meaning}`;
      input.disabled = true; $('#submitGuess').disabled = true; completeGame('wordle');
    } else if (wordRow === maximumWordRows) {
      $('#wordMessage').textContent = `The answer was ${currentWord.word}. ${currentWord.meaning}`;
      input.disabled = true; $('#submitGuess').disabled = true;
    } else {
      $('#wordMessage').textContent = `${maximumWordRows - wordRow} attempt${maximumWordRows - wordRow === 1 ? '' : 's'} remaining.`;
    }
  }
  $('#submitGuess')?.addEventListener('click', submitWordleGuess);
  $('#wordInput')?.addEventListener('keydown', event => { if (event.key === 'Enter') submitWordleGuess(); });
  $('#restartWord')?.addEventListener('click', createWordle);

  // Mini Sudoku
  const sudokuPuzzles = [
    { puzzle:[1,0,0,4,0,4,1,0,0,1,4,0,4,0,0,1], solution:[1,2,3,4,3,4,1,2,2,1,4,3,4,3,2,1] },
    { puzzle:[0,2,0,4,3,0,1,0,0,1,0,3,4,0,2,0], solution:[1,2,3,4,3,4,1,2,2,1,4,3,4,3,2,1] }
  ];
  let sudoku;
  function createSudoku() {
    const grid = $('#sudokuGrid');
    if (!grid) return;
    sudoku = sudokuPuzzles[Math.floor(Math.random() * sudokuPuzzles.length)];
    grid.innerHTML = '';
    sudoku.puzzle.forEach((value, index) => {
      const cell = document.createElement('input');
      cell.className = 'sudoku-cell';
      cell.inputMode = 'numeric'; cell.maxLength = 1;
      cell.setAttribute('aria-label', `Row ${Math.floor(index/4)+1}, column ${index%4+1}`);
      if (value) { cell.value = value; cell.disabled = true; }
      else cell.addEventListener('input', () => {
        cell.value = cell.value.replace(/[^1-4]/g, '').slice(0,1);
        cell.classList.remove('invalid');
      });
      grid.appendChild(cell);
    });
    $('#sudokuMessage').textContent = '';
  }
  $('#checkSudoku')?.addEventListener('click', () => {
    const cells = $$('.sudoku-cell');
    let empty = false, incorrect = false;
    cells.forEach((cell,index) => {
      cell.classList.remove('invalid');
      if (!cell.value) empty = true;
      else if (+cell.value !== sudoku.solution[index]) { incorrect = true; cell.classList.add('invalid'); }
    });
    if (empty) $('#sudokuMessage').textContent = 'Complete every empty square first.';
    else if (incorrect) $('#sudokuMessage').textContent = 'Check the highlighted squares and try again.';
    else { $('#sudokuMessage').textContent = 'Puzzle complete. Every detail found its place.'; completeGame('sudoku'); }
  });
  $('#hintSudoku')?.addEventListener('click', () => {
    const cells = $$('.sudoku-cell');
    const empty = cells.map((cell,index) => cell.value ? -1 : index).filter(index => index >= 0);
    if (!empty.length) { $('#sudokuMessage').textContent = 'The grid is already filled.'; return; }
    const index = empty[Math.floor(Math.random() * empty.length)];
    cells[index].value = sudoku.solution[index]; cells[index].classList.remove('invalid');
    $('#sudokuMessage').textContent = 'One piece has been placed for you.';
  });
  $('#restartSudoku')?.addEventListener('click', createSudoku);

  // Word Connection
  const groups = [
    {name:'Quiet Comforts',words:['Grass','Books','Walks','Rain'],description:'Small comforts that create room for peace, stories, and reflection.'},
    {name:'Places and Dreams',words:['Scotland','Canada','Aurora','Snow'],description:'Memories already lived and places still waiting.'},
    {name:'Personal Qualities',words:['Curious','Observant','Open','Thoughtful'],description:'Traits that shape how I connect, notice, and understand.'},
    {name:'Things That Matter',words:['Connection','Growth','Memories','Living'],description:'Ideas that sit beneath the hobbies and details.'}
  ];
  let remainingWords = [], selectedWords = [], mistakes = 4, connectionHintLevel = 0;
  const shuffle = list => [...list].sort(() => Math.random() - 0.5);
  function drawConnections() {
    const grid = $('#connectionGrid');
    if (!grid) return;
    grid.innerHTML = '';
    remainingWords.forEach(word => {
      const button = document.createElement('button');
      button.className = `connection-word${selectedWords.includes(word) ? ' selected' : ''}`;
      button.textContent = word;
      button.addEventListener('click', () => {
        if (selectedWords.includes(word)) selectedWords = selectedWords.filter(item => item !== word);
        else if (selectedWords.length < 4) selectedWords.push(word);
        drawConnections();
      });
      grid.appendChild(button);
    });
    $('#connectionLives').textContent = `Mistakes remaining: ${mistakes}`;
  }
  function createConnections() {
    remainingWords = shuffle(groups.flatMap(group => group.words)); selectedWords = []; mistakes = 4; connectionHintLevel = 0;
    $('#solvedConnections').innerHTML = ''; $('#connectionMessage').textContent = ''; drawConnections();
  }
  $('#submitConnection')?.addEventListener('click', () => {
    if (selectedWords.length !== 4) { $('#connectionMessage').textContent = 'Select exactly four words first.'; return; }
    const group = groups.find(item => item.words.every(word => selectedWords.includes(word)));
    if (group) {
      remainingWords = remainingWords.filter(word => !selectedWords.includes(word));
      const solved = document.createElement('div'); solved.className = 'solved-group';
      solved.innerHTML = `<b>${group.name}</b><span>${group.words.join(' · ')}</span><small>${group.description}</small>`;
      $('#solvedConnections').appendChild(solved); selectedWords = []; drawConnections();
      $('#connectionMessage').textContent = remainingWords.length ? 'Connection found.' : 'All four connections found. You pieced together my little world.';
      if (!remainingWords.length) completeGame('connections');
    } else {
      mistakes--; selectedWords = []; drawConnections();
      $('#connectionMessage').textContent = mistakes ? 'Not that connection. Try another combination.' : 'No mistakes left. Restart to try again.';
      if (!mistakes) $$('.connection-word').forEach(button => button.disabled = true);
    }
  });
  $('#hintConnections')?.addEventListener('click', () => {
    const unsolvedGroups = groups.filter(group => group.words.some(word => remainingWords.includes(word)));
    if (!unsolvedGroups.length) { $('#connectionMessage').textContent = 'All connections are already solved.'; return; }
    const target = unsolvedGroups[0];
    connectionHintLevel = Math.min(connectionHintLevel + 1, 3);
    if (connectionHintLevel === 1) {
      $('#connectionMessage').textContent = `Hint: One remaining category is “${target.name}.”`;
    } else if (connectionHintLevel === 2) {
      const clueWord = target.words.find(word => remainingWords.includes(word));
      $('#connectionMessage').textContent = `Hint: “${target.name}” contains ${clueWord}.`;
    } else {
      const clueWord = target.words.find(word => remainingWords.includes(word));
      const clueTile = $$('.connection-word').find(button => button.textContent === clueWord);
      if (clueTile) {
        clueTile.classList.add('hint-flash');
        setTimeout(() => clueTile.classList.remove('hint-flash'), 2200);
      }
      $('#connectionMessage').textContent = 'Hint: One correct tile is glowing briefly.';
      connectionHintLevel = 0;
    }
  });
  $('#restartConnections')?.addEventListener('click', createConnections);

  // Quiz
  const quiz = [
    {question:'Which phrase describes my social personality?',options:['An extrovert avoiding people','An introvert disguised as an extrovert','A person who dislikes communication','A performer who loves crowds'],correct:1},
    {question:'What is my current class label?',options:['Database Guardian','Curious Observer','Story Collector','Quiet Explorer'],correct:1},
    {question:'Where did my story begin?',options:['Canada','Scotland','Balamban, Cebu','Cebu City proper'],correct:2},
    {question:'What career am I interested in pursuing?',options:['Game Developer','Database Administrator','Football Analyst','Travel Writer'],correct:1},
    {question:'Which activity gives me clarity and connection?',options:['Long walks','Competitive racing','Public speaking','Mountain climbing'],correct:0},
    {question:'Which novels are especially mentioned in my interests?',options:['Danmei novels','Cookbooks','Only textbooks','Comic strips'],correct:0},
    {question:'Which two firsts became memories in Canada?',options:['A concert and a match','Northern Lights and first snowfall','A database project and graduation','A castle and a long walk'],correct:1},
    {question:'What is my next dream destination?',options:['Japan','Scotland','Spain','Iceland'],correct:1},
    {question:'Which value appears in “What Matters to Me”?',options:['Perfection','Meaningful connection','Competition','Popularity'],correct:1},
    {question:'What mission is stated near the beginning?',options:['To travel everywhere','To live, and not just to exist','To finish every game','To become famous'],correct:1}
  ];
  let quizIndex = 0;
  let quizAnswers = Array(quiz.length).fill(null);

  function renderQuiz() {
    const stage = $('#quizStage');
    if (!stage) return;
    const item = quiz[quizIndex];
    $('#quizProgress').textContent = `Question ${quizIndex + 1} of ${quiz.length}`;
    $('.quiz-top')?.style.setProperty('--quiz-progress', `${Math.round((quizIndex + 1) / quiz.length * 100)}%`);
    stage.innerHTML = `<div class="quiz-question"><h3>${item.question}</h3><div class="quiz-options">${item.options.map((option,index) => `<label class="quiz-option"><input type="radio" name="quizOption" value="${index}" ${quizAnswers[quizIndex] === index ? 'checked' : ''}><span>${option}</span></label>`).join('')}</div></div>`;
    $$('input[name="quizOption"]', stage).forEach(input => input.addEventListener('change', () => {
      quizAnswers[quizIndex] = Number(input.value); $('#quizMessage').textContent = '';
    }));
    $('#prevQuestion').disabled = quizIndex === 0;
    $('#nextQuestion').classList.toggle('hidden', quizIndex === quiz.length - 1);
    $('#submitQuiz').classList.toggle('hidden', quizIndex !== quiz.length - 1);
  }
  $('#prevQuestion')?.addEventListener('click', () => { if (quizIndex > 0) { quizIndex--; renderQuiz(); } });
  $('#nextQuestion')?.addEventListener('click', () => {
    if (quizAnswers[quizIndex] === null) { $('#quizMessage').textContent = 'Choose an answer before continuing.'; return; }
    if (quizIndex < quiz.length - 1) { quizIndex++; renderQuiz(); }
  });
  $('#submitQuiz')?.addEventListener('click', () => {
    if (quizAnswers[quizIndex] === null) { $('#quizMessage').textContent = 'Choose an answer before submitting.'; return; }
    const score = quiz.reduce((total,item,index) => total + (quizAnswers[index] === item.correct ? 1 : 0), 0);
    const message = score >= 9 ? 'You really paid attention. You might understand my little world better than expected.' : score >= 6 ? 'Pretty good. You caught more details than most visitors would.' : score >= 3 ? 'Not bad, but a few chapters might deserve another look.' : 'The story is still here if you want to explore it again.';
    const incorrect = quiz.length - score;
    const accuracy = Math.round(score / quiz.length * 100);
    $('#quizProgress').textContent = 'QUIZ COMPLETE'; $('#quizScoreMini').textContent = `${score}/10`;
    if ($('#quizWindowStatus')) $('#quizWindowStatus').textContent = 'COMPLETE';
    const reviewItems = quiz.map((item,index) => `<div class="review-item ${quizAnswers[index] === item.correct ? 'correct' : 'wrong'}"><b>${index+1}. ${item.question}</b><span>Your answer: ${item.options[quizAnswers[index]]}</span><br><span>Correct answer: ${item.options[item.correct]}</span></div>`).join('');
    $('#quizStage').innerHTML = `<div class="quiz-result compact-result"><div class="completion-badge">✦ CHECKPOINT COMPLETE</div><h3>${score} out of ${quiz.length}</h3><p>${message}</p><div class="quiz-stats"><article><small>CORRECT</small><b>${score}</b></article><article><small>INCORRECT</small><b>${incorrect}</b></article><article><small>ACCURACY</small><b>${accuracy}%</b></article></div><div class="quiz-result-controls"><button id="toggleReview" class="secondary" aria-expanded="false">Review Answers</button><button id="showMissed" class="secondary">See What I Missed</button></div><div id="quizReviewPanel" class="quiz-review hidden">${reviewItems}</div></div>`;
    let reviewState = 'closed';
    const reviewPanel = $('#quizReviewPanel');
    const reviewButton = $('#toggleReview');
    const missedButton = $('#showMissed');

    function applyReviewState(nextState) {
      reviewState = nextState;
      const reviewItems = $$('.review-item', reviewPanel);

      if (reviewState === 'closed') {
        reviewPanel.classList.add('hidden');
        reviewItems.forEach(item => item.classList.remove('review-filtered'));
        reviewButton.textContent = 'Review Answers';
        missedButton.textContent = 'See What I Missed';
        reviewButton.setAttribute('aria-expanded', 'false');
        missedButton.setAttribute('aria-expanded', 'false');
        return;
      }

      reviewPanel.classList.remove('hidden');

      if (reviewState === 'all') {
        reviewItems.forEach(item => item.classList.remove('review-filtered'));
        reviewButton.textContent = 'Hide Answer Review';
        missedButton.textContent = 'See What I Missed';
        reviewButton.setAttribute('aria-expanded', 'true');
        missedButton.setAttribute('aria-expanded', 'false');
        return;
      }

      reviewItems.forEach(item => item.classList.toggle('review-filtered', item.classList.contains('correct')));
      reviewButton.textContent = 'Review Answers';
      missedButton.textContent = 'Hide Missed Answers';
      reviewButton.setAttribute('aria-expanded', 'false');
      missedButton.setAttribute('aria-expanded', 'true');
    }

    reviewButton?.addEventListener('click', () => {
      applyReviewState(reviewState === 'all' ? 'closed' : 'all');
    });

    missedButton?.addEventListener('click', () => {
      applyReviewState(reviewState === 'missed' ? 'closed' : 'missed');
    });

    applyReviewState('closed');
    $('#prevQuestion').classList.add('hidden'); $('#submitQuiz').classList.add('hidden'); $('#restartQuiz').classList.remove('hidden'); $('#quizMessage').textContent = '';
  });
  $('#restartQuiz')?.addEventListener('click', () => {
    quizIndex = 0; quizAnswers = Array(quiz.length).fill(null); $('#quizScoreMini').textContent = 'ANSWER EVERY QUESTION';
    $('#prevQuestion').classList.remove('hidden'); $('#restartQuiz').classList.add('hidden'); if ($('#quizWindowStatus')) $('#quizWindowStatus').textContent = 'IN PROGRESS'; renderQuiz();
  });

  // Initialize all dynamic content after DOM is ready
  createWordle();
  createSudoku();
  createConnections();
  renderQuiz();
});
