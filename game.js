const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#f0f8ff',
  parent: 'game-container',
  scene: {
    preload,
    create,
    update
  }
};

const game = new Phaser.Game(config);

let targetColor;
let options = [];
let timerText, scoreText, highScoreText, muteButton;
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let roundTime = 5;
let timeLeft = 5;
let timerEvent;
let isGameOver = false;
let isMuted = localStorage.getItem('isMuted') === 'true';

function preload() {
  this.load.audio('correct', 'assets/audio/correct.mp3');
  this.load.audio('wrong', 'assets/audio/wrong.mp3');
  this.load.audio('gameover', 'assets/audio/gameover.mp3');
  this.load.audio('celebration', 'assets/audio/celebration.mp3');
}

function create() {
  isGameOver = false;
  score = 0;
  roundTime = 5;
  timeLeft = 5;

  this.cameras.main.setBackgroundColor('#f0f8ff');

  scoreText = this.add.text(20, 20, 'Score: 0', { font: '24px Arial', fill: '#000' });
  highScoreText = this.add.text(20, 60, `High Score: ${highScore}`, { font: '24px Arial', fill: '#000' });
  timerText = this.add.text(this.cameras.main.centerX, 20, `Time: ${timeLeft}`, { font: '24px Arial', fill: '#000' }).setOrigin(0.5);

  // Add mute button
  muteButton = this.add.text(this.cameras.main.width - 20, 20, isMuted ? '🔇 Muted' : '🔊 Sound On', {
    font: '20px Arial',
    fill: '#fff',
    backgroundColor: '#333',
    padding: { x: 10, y: 5 }
  }).setOrigin(1, 0).setInteractive();

  muteButton.on('pointerdown', () => {
    isMuted = !isMuted;
    localStorage.setItem('isMuted', isMuted);
    muteButton.setText(isMuted ? '🔇 Muted' : '🔊 Sound On');
  });

  generateNewColors(this);

  timerEvent = this.time.addEvent({
    delay: 1000,
    callback: () => {
      if (!isGameOver) {
        timeLeft--;
        timerText.setText('Time: ' + timeLeft);
        if (timeLeft <= 0) {
          gameOver(this);
        }
      }
    },
    loop: true
  });
}

function generateNewColors(scene) {
  if (isGameOver) return;

  scene.children.list.forEach(obj => {
    if (![scoreText, highScoreText, timerText, muteButton].includes(obj)) {
      obj.destroy();
    }
  });

  const target = Phaser.Display.Color.RandomRGB();
  targetColor = target.color;

  scene.add.rectangle(scene.cameras.main.centerX, 150, 150, 150, targetColor).setStrokeStyle(4, 0x000000);

  options = [targetColor];
  while (options.length < 4) {
    const newColor = Phaser.Display.Color.RandomRGB().color;
    if (!options.includes(newColor)) {
      options.push(newColor);
    }
  }

  Phaser.Utils.Array.Shuffle(options);

  for (let i = 0; i < 4; i++) {
    const x = scene.cameras.main.centerX - 200 + i * 130;
    const y = 350;

    const box = scene.add.rectangle(x, y, 100, 100, options[i])
      .setInteractive()
      .setStrokeStyle(3, 0x000000);

    box.once('pointerdown', () => {
      if (options[i] === targetColor) {
        score++;
        if (score > highScore) {
          highScore = score;
          localStorage.setItem('highScore', highScore);
          highScoreText.setText('High Score: ' + highScore);
        }

        roundTime = adjustTimeBasedOnScore(score);
        timeLeft = roundTime;
        timerText.setText('Time: ' + timeLeft);
        scoreText.setText('Score: ' + score);

        if (!isMuted) scene.sound.play('correct');
        generateNewColors(scene);
      } else {
        if (!isMuted) scene.sound.play('wrong');
        gameOver(scene);
      }
    });
  }
}

function adjustTimeBasedOnScore(score) {
  if (score >= 100) return 2;
  if (score >= 70) return 3;
  if (score >= 30) return 4;
  return 5;
}

function update() {}

function gameOver(scene) {
  if (isGameOver) return;
  isGameOver = true;

  if (timerEvent) {
    timerEvent.remove(false);
    timerEvent = null;
  }

  const rt = scene.make.renderTexture({
    x: 0,
    y: 0,
    width: scene.sys.canvas.width,
    height: scene.sys.canvas.height,
    add: true
  });

  rt.draw(scene.children.list);
  rt.setAlpha(0.5);
  rt.setTint(0x999999);

  if (!isMuted) scene.sound.play('gameover');

  const centerX = scene.cameras.main.centerX;
  const centerY = scene.cameras.main.centerY;

  const titleStyle = {
    font: '64px Arial',
    fill: '#ff0033',
    stroke: '#000',
    strokeThickness: 8,
    fontStyle: 'bold'
  };

  const infoStyle = {
    font: '32px Arial',
    fill: '#ffffff',
    stroke: '#000',
    strokeThickness: 5
  };

  scene.add.text(centerX, centerY - 100, 'GAME OVER', titleStyle).setOrigin(0.5);
  scene.add.text(centerX, centerY - 30, `Score: ${score}`, infoStyle).setOrigin(0.5);
  scene.add.text(centerX, centerY + 20, `High Score: ${highScore}`, infoStyle).setOrigin(0.5);

  if (score === parseInt(localStorage.getItem('highScore'))) {
    scene.time.delayedCall(300, () => {
      if (!isMuted) scene.sound.play('celebration');
      scene.add.text(centerX, centerY - 170, '🎉 NEW HIGH SCORE! 🎉', {
        font: '40px Arial',
        fill: '#00ff00',
        stroke: '#000',
        strokeThickness: 6
      }).setOrigin(0.5);
    });
  }

  const restartButton = scene.add.text(centerX, centerY + 100, 'Restart', {
    font: '28px Arial',
    fill: '#ffffff',
    backgroundColor: '#007bff',
    padding: { x: 20, y: 10 }
  }).setOrigin(0.5).setInteractive();

  restartButton.on('pointerdown', () => {
    scene.scene.restart();
  });
}
