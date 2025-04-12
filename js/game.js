const config = {
    type: Phaser.AUTO,
    width: 720,
    height: 720,
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 800 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

let player;
let platforms;
let spikes;
let door;
let enemies;
let playerName = '';
let gameTime = 60;
let countdownText;
let timerText;
let gameStarted = false;
let mobileControls = {
    left: false,
    right: false,
    jump: false
};

function preload() {
    // Carregar sprites
    this.load.spritesheet('tiles', 'https://proxlu.github.io/catacomb/assets/tiles.png', { frameWidth: 48, frameHeight: 48 });
    this.load.spritesheet('player', 'https://proxlu.github.io/catacomb/assets/player.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('enemy', 'https://proxlu.github.io/catacomb/assets/enemy.png', { frameWidth: 32, frameHeight: 32 });
    
    // Carregar áudios
    this.load.audio('count', 'https://proxlu.github.io/catacomb/assets/count.ogg');
    this.load.audio('damage', 'https://proxlu.github.io/catacomb/assets/damage.ogg');
    this.load.audio('gameover', 'https://proxlu.github.io/catacomb/assets/gameover.ogg');
    this.load.audio('jump', 'https://proxlu.github.io/catacomb/assets/jump.ogg');
    this.load.audio('land', 'https://proxlu.github.io/catacomb/assets/land.ogg');
    this.load.audio('win', 'https://proxlu.github.io/catacomb/assets/win.ogg');
}

function create() {
    // Configurar controles mobile
    setupMobileControls();
    
    // Criar animações
    createAnimations();
    
    // Criar cena do menu
    createMenu();
}

function createAnimations() {
    // Animação do jogador
    this.anims.create({
        key: 'idle',
        frames: [{ key: 'player', frame: 0 }],
        frameRate: 10
    });
    
    this.anims.create({
        key: 'walk',
        frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
    });
    
    // Animação do inimigo
    this.anims.create({
        key: 'enemyWalk',
        frames: this.anims.generateFrameNumbers('enemy', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
    });
}

function update() {
    if (!gameStarted) return;
    
    // Atualizar lógica do jogo
    updatePlayer();
    updateEnemies();
    updateTimer();
}

function setupMobileControls() {
    const leftButton = document.getElementById('left-button');
    const rightButton = document.getElementById('right-button');
    const jumpButton = document.getElementById('jump-button');

    leftButton.addEventListener('touchstart', () => mobileControls.left = true);
    leftButton.addEventListener('touchend', () => mobileControls.left = false);
    
    rightButton.addEventListener('touchstart', () => mobileControls.right = true);
    rightButton.addEventListener('touchend', () => mobileControls.right = false);
    
    jumpButton.addEventListener('touchstart', () => mobileControls.jump = true);
    jumpButton.addEventListener('touchend', () => mobileControls.jump = false);
}

function createMenu() {
    // Limpar cena
    this.children.removeAll();
    
    // Criar título
    const title = this.add.text(360, 100, 'CATACOMB', {
        fontSize: '64px',
        fill: '#fff'
    }).setOrigin(0.5);
    
    // Criar sprite do jogador
    const playerSprite = this.add.sprite(360, 300, 'player', 0)
        .setScale(2);
    
    // Criar campo de texto para nome
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.placeholder = 'Digite seu nome';
    nameInput.style.position = 'absolute';
    nameInput.style.top = '400px';
    nameInput.style.left = '50%';
    nameInput.style.transform = 'translateX(-50%)';
    nameInput.style.padding = '10px';
    nameInput.style.fontSize = '20px';
    document.getElementById('game-container').appendChild(nameInput);
    
    // Configurar evento de Enter
    nameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            playerName = nameInput.value || 'Jogador';
            nameInput.remove();
            startGame();
        }
    });
}

function startGame() {
    // Iniciar contagem regressiva
    startCountdown();
    
    // Gerar nível
    generateLevel();
    
    // Configurar colisões
    this.physics.add.overlap(player, spikes, hitSpike, null, this);
    this.physics.add.overlap(player, door, reachDoor, null, this);
    this.physics.add.overlap(player, enemies, hitEnemy, null, this);
}

function startCountdown() {
    let count = 3;
    countdownText = this.add.text(360, 360, count.toString(), {
        fontSize: '64px',
        fill: '#fff'
    }).setOrigin(0.5);
    
    this.sound.play('count');
    
    const countdown = this.time.addEvent({
        delay: 1000,
        callback: () => {
            count--;
            if (count > 0) {
                countdownText.setText(count.toString());
            } else if (count === 0) {
                countdownText.setText('GO!');
            } else {
                countdownText.destroy();
                gameStarted = true;
                startTimer();
            }
        },
        loop: true
    });
}

function startTimer() {
    timerText = this.add.text(360, 50, gameTime.toString(), {
        fontSize: '32px',
        fill: '#fff'
    }).setOrigin(0.5);
    
    const timer = this.time.addEvent({
        delay: 1000,
        callback: () => {
            gameTime--;
            timerText.setText(gameTime.toString());
            
            if (gameTime <= 0) {
                gameOver();
            }
        },
        loop: true
    });
}

function updatePlayer() {
    // Controles de teclado
    const cursors = this.input.keyboard.createCursorKeys();
    
    // Movimento horizontal
    if (cursors.left.isDown || mobileControls.left) {
        player.setVelocityX(-160);
        player.setFlipX(true);
    } else if (cursors.right.isDown || mobileControls.right) {
        player.setVelocityX(160);
        player.setFlipX(false);
    } else {
        player.setVelocityX(0);
    }
    
    // Pulo
    if ((cursors.up.isDown || cursors.space.isDown || mobileControls.jump) && player.body.touching.down) {
        player.setVelocityY(-400);
        this.sound.play('jump');
    }
    
    // Animação
    if (player.body.velocity.x !== 0) {
        player.anims.play('walk', true);
    } else {
        player.anims.play('idle', true);
    }
}

function updateEnemies() {
    enemies.children.iterate((enemy) => {
        if (enemy.body.velocity.x === 0) {
            enemy.setVelocityX(Phaser.Math.Between(-50, 50));
        }
        enemy.anims.play('enemyWalk', true);
    });
}

function updateTimer() {
    // Implementar contagem regressiva do tempo
}

function generateLevel() {
    // Limpar grupos existentes
    platforms = this.physics.add.staticGroup();
    spikes = this.physics.add.staticGroup();
    enemies = this.physics.add.group();
    
    // Tamanho do grid
    const gridSize = 15;
    const tileSize = 48;
    
    // Matriz para armazenar o layout
    const level = Array(gridSize).fill().map(() => Array(gridSize).fill(0));
    
    // Gerar pisos
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            if (Math.random() > 0.7) { // 30% de chance de gerar piso
                level[y][x] = 1;
                platforms.create(x * tileSize + tileSize/2, y * tileSize + tileSize/2, 'tiles', 0);
            }
        }
    }
    
    // Garantir que haja um caminho para a porta
    ensurePathToDoor(level);
    
    // Gerar espinhos
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            if (level[y][x] === 1 && Math.random() > 0.8) { // 20% de chance de gerar espinhos
                spikes.create(x * tileSize + tileSize/2, (y-1) * tileSize + tileSize/2, 'tiles', 2);
            }
        }
    }
    
    // Gerar porta
    let doorX, doorY;
    do {
        doorX = Math.floor(Math.random() * gridSize);
        doorY = Math.floor(Math.random() * gridSize);
    } while (level[doorY][doorX] !== 1);
    door = this.physics.add.staticSprite(doorX * tileSize + tileSize/2, doorY * tileSize + tileSize/2, 'tiles', 3);
    
    // Gerar inimigos
    for (let i = 0; i < 3; i++) {
        let enemyX, enemyY;
        do {
            enemyX = Math.floor(Math.random() * gridSize);
            enemyY = Math.floor(Math.random() * gridSize);
        } while (level[enemyY][enemyX] !== 0);
        
        const enemy = enemies.create(enemyX * tileSize + tileSize/2, enemyY * tileSize + tileSize/2, 'enemy');
        enemy.setCollideWorldBounds(true);
        enemy.setBounce(0.2);
        enemy.setVelocityX(Phaser.Math.Between(-50, 50));
    }
    
    // Gerar jogador
    let playerX, playerY;
    do {
        playerX = Math.floor(Math.random() * gridSize);
        playerY = Math.floor(Math.random() * gridSize);
    } while (level[playerY][playerX] !== 1);
    
    player = this.physics.add.sprite(playerX * tileSize + tileSize/2, playerY * tileSize + tileSize/2, 'player');
    player.setCollideWorldBounds(true);
    player.setBounce(0.2);
    
    // Configurar colisões
    this.physics.add.collider(player, platforms);
    this.physics.add.collider(enemies, platforms);
}

function ensurePathToDoor(level) {
    // Implementar algoritmo para garantir caminho até a porta
    // Por enquanto, apenas garante que haja pelo menos um piso
    let hasFloor = false;
    for (let y = 0; y < level.length; y++) {
        for (let x = 0; x < level[y].length; x++) {
            if (level[y][x] === 1) {
                hasFloor = true;
                break;
            }
        }
        if (hasFloor) break;
    }
    
    if (!hasFloor) {
        // Se não houver pisos, cria um no centro
        const center = Math.floor(level.length / 2);
        level[center][center] = 1;
    }
}

function hitSpike() {
    this.sound.play('damage');
    gameOver();
}

function hitEnemy() {
    this.sound.play('damage');
    gameOver();
}

function reachDoor() {
    this.sound.play('win');
    victory();
}

function gameOver() {
    gameStarted = false;
    this.children.removeAll();
    
    // Criar tela de game over
    const gameOverText = this.add.text(360, 300, 'GAME OVER', {
        fontSize: '64px',
        fill: '#fff'
    }).setOrigin(0.5);
    
    const enemySprite = this.add.sprite(360, 400, 'enemy', 0)
        .setScale(2);
    
    this.sound.play('gameover');
    
    // Reiniciar após 3 segundos
    this.time.delayedCall(3000, () => {
        this.scene.restart();
    });
}

function victory() {
    gameStarted = false;
    this.children.removeAll();
    
    // Criar tela de vitória
    const victoryText = this.add.text(360, 300, 'VITÓRIA!', {
        fontSize: '64px',
        fill: '#fff'
    }).setOrigin(0.5);
    
    const playerNameText = this.add.text(360, 350, playerName, {
        fontSize: '32px',
        fill: '#fff'
    }).setOrigin(0.5);
    
    const playerSprite = this.add.sprite(360, 400, 'player', 0)
        .setScale(2);
    
    // Reiniciar após 3 segundos
    this.time.delayedCall(3000, () => {
        this.scene.restart();
    });
} 
