// No início do game.js
const controls = {
    left: false,
    right: false,
    jump: {
        pressed: false,
        canJump: true,
        justReleased: true,
        queuedJump: false,
        wantsToJump: false
    }
};

// Controles mobile
const mobileInput = window.mobileInput || {
    left: false,
    right: false,
    up: false
};

const config = {
    type: Phaser.CANVAS,
    width: 720,
    height: 720,
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 800 },
            debug: false,
            checkCollision: {
                up: true,
                down: true,
                left: true,
                right: true
            }
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    render: {
        pixelArt: true,
        antialias: false,
        roundPixels: true
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 720,
        height: 720
    },
    backgroundColor: '#000000'
};

const game = new Phaser.Game(config);

let player;
let platforms;
let spikes;
let door;
let enemies;
let playerName = '';
let gameTime = 30;
let countdownText;
let timerText;
let gameStarted = false;
let firstTime = true;
let playerNameText;

function preload() {
    // Carregar sprites
    this.load.spritesheet('tiles', 'assets/tiles.png', { frameWidth: 48, frameHeight: 48 });
    this.load.spritesheet('player', 'assets/player.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('enemy', 'assets/enemy.png', { frameWidth: 32, frameHeight: 32 });
    
    // Carregar áudios
    this.load.audio('count', 'assets/count.ogg');
    this.load.audio('damage', 'assets/damage.ogg');
    this.load.audio('gameover', 'assets/gameover.ogg');
    this.load.audio('jump', 'assets/jump.ogg');
    this.load.audio('land', 'assets/land.ogg');
    this.load.audio('win', 'assets/win.ogg');
}

function create() {
    if (!this.input.keyboard) {
        this.input.keyboard = this.input.keyboard.addKeys();
    }
    
    // Criar animações apenas na primeira vez
    if (firstTime) {
        createAnimations.call(this);
    }
    
    // Criar menu apenas na primeira vez
    if (firstTime) {
        createMenu.call(this);
    } else {
        startGame.call(this);
    }

    this.sound.pauseOnBlur = false;
    document.body.addEventListener('click', () => {
        if (this.sound.context.state === 'suspended') {
            this.sound.context.resume();
        }
    }, { once: true });
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
    
    // Atualizar lógica do jogo (sem chamada para mobileControls.update)
    updatePlayer.call(this);
    updateEnemies.call(this);
    updateTimer.call(this);
}

function handleResize() {
    // Ajusta posição dos controles se necessário
    const controls = document.getElementById('mobile-controls');
    if (controls) {
        if (this.scale.isGamePortrait) {
            // Modo retrato (celular normal)
            controls.style.flexDirection = 'row';
        } else {
            // Modo paisagem (celular deitado)
            controls.style.flexDirection = 'column';
            controls.style.right = '20px';
            controls.style.bottom = '50%';
            controls.style.transform = 'translateY(50%)';
        }
    }
}

function createMenu() {
    // Limpar cena
    this.children.removeAll();
    
    // Criar background
    for (let y = 0; y < 15; y++) {
        for (let x = 0; x < 15; x++) {
            this.add.image(x * 48 + 24, y * 48 + 24, 'tiles', 1);
        }
    }
    
    // Criar título
    const title = this.add.text(360, 100, 'CATACOMB', {
        fontSize: '64px',
        fill: '#fff'
    }).setOrigin(0.5);
    
    // Criar sprite do jogador (2x no menu)
    const playerSprite = this.add.sprite(360, 300, 'player', 0)
        .setScale(2); // 64x64 no menu
    
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
    nameInput.autofocus = true;
    document.getElementById('game-container').appendChild(nameInput);
    
    // Configurar evento de Enter
    nameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            playerName = nameInput.value.trim() || 'Jogador';
            if (playerName.length > 0) {
                nameInput.remove();
                startGame.call(this);
            }
        }
    });
}

function startGame() {
    // Resetar estado do jogo
    gameStarted = false;
    gameTime = 30;
    
    // Marcar que não é mais a primeira vez
    firstTime = false;
    
    // Limpar física
    this.physics.world.shutdown();
    
    // Reativar física
    this.physics.world.resume();
    
    // Gerar nível primeiro
    generateLevel.call(this);
    
    // Depois iniciar a contagem regressiva
    startCountdown.call(this);
}

function startCountdown() {
    // Remover contagem anterior se existir
    if (countdownText) {
        countdownText.destroy();
    }
    
    let count = 3;
    countdownText = this.add.text(360, 360, count.toString(), {
        fontSize: '64px',
        fill: '#fff',
        fontStyle: 'bold',
        stroke: '#000',
        strokeThickness: 6
    }).setOrigin(0.5);
    
    this.sound.play('count');
    
    // Paralisar jogador e inimigos
    if (player && player.body) {
        player.body.moves = false;
        player.setVelocity(0, 0);
    }
    
    if (enemies && enemies.children) {
        enemies.children.iterate((enemy) => {
            if (enemy && enemy.body) {
                enemy.body.moves = false;
                enemy.setVelocity(0, 0);
            }
        });
    }
    
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
                startTimer.call(this);
                
                // Ativar movimentos após o GO
                if (player && player.body) {
                    player.body.moves = true;
                }
                
                if (enemies && enemies.children) {
                    enemies.children.iterate((enemy) => {
                        if (enemy && enemy.body) {
                            enemy.body.moves = true;
                            enemy.setVelocityX(Phaser.Math.Between(-50, 50));
                        }
                    });
                }
            }
        },
        loop: true
    });
}

function startTimer() {
    // Remover timer anterior se existir
    if (timerText) {
        timerText.destroy();
    }
    
    // Resetar o tempo
    gameTime = 30;
    
    // Remover qualquer evento de timer existente
    this.time.removeAllEvents();
    
    timerText = this.add.text(360, 50, gameTime.toString(), {
        fontSize: '32px',
        fill: '#fff'
    }).setOrigin(0.5);
    
    // Criar novo timer
    this.time.addEvent({
        delay: 1000, // 1 segundo
        callback: () => {
            if (gameStarted && timerText) {
                gameTime--;
                timerText.setText(gameTime.toString());
                
                if (gameTime <= 0) {
                    const gameoverSound = this.sound.add('gameover', { volume: 0.5 });
                    gameoverSound.play();
                    gameOver.call(this);
                }
            }
        },
        loop: true
    });
}

function updatePlayer() {
    if (!player || !player.body) return;
    
    // Atualizar posição do texto do nome (mantido original)
    if (playerNameText) {
        playerNameText.x = player.x;
        playerNameText.y = player.y - 28;
    }
    
    // Garante que o teclado está disponível
    if (!this.input.keyboard) {
        this.input.keyboard = this.input.keyboard.addKeys();
        return; // Sai da função neste frame, retorna no próximo
    }

    // Reset do pulo quando toca no chão
    if (!player.body.touching.down) {
        if (!window.mobileControls && !window.mobileControls.jump) {
            window.mobileControls.jump.canJump = true;
        }
    }
    if (player.body.touching.down) {
        controls.jump.canJump = true;
        if (window.mobileControls && window.mobileControls.jump) {
            window.mobileControls.jump.canJump = true;
        }
    }

    // Controles de teclado
    const cursors = this.input.keyboard.createCursorKeys();
    const keys = this.input.keyboard.addKeys('W,A,D,SPACE,ENTER');
    
    // Controles combinados (mobile + teclado)
    const isLeft = controls.left || (window.mobileControls && window.mobileControls.left) || cursors.left.isDown || keys.A.isDown;
    const isRight = controls.right || (window.mobileControls && window.mobileControls.right) || cursors.right.isDown || keys.D.isDown;
    
    // Movimento horizontal
    if (isLeft) {
        player.setVelocityX(-160);
        player.setFlipX(true);
    } else if (isRight) {
        player.setVelocityX(160);
        player.setFlipX(false);
    } else {
        player.setVelocityX(0);
    }

    // Lógica de pulo unificada
    const keyboardJump = cursors.up.isDown || keys.W.isDown || keys.SPACE.isDown || keys.ENTER.isDown;
    const mobileJump = window.mobileControls && window.mobileControls.jump && window.mobileControls.jump.pressed;

    // Verifica se pode pular (teclado)
    if (!player.body.touching.down && keyboardJump && !controls.jump.pressed) {
        controls.jump.pressed = false;
        controls.jump.justReleased = true;
    }
    else if (keyboardJump && controls.jump.canJump && controls.jump.justReleased) {
        controls.jump.pressed = true;
        controls.jump.canJump = false;
        controls.jump.justReleased = false;
        executeJump.call(this);
    } 
    else if (!keyboardJump && controls.jump.pressed) {
        controls.jump.pressed = false;
        controls.jump.justReleased = true;
    }

    // Verifica se pode pular (mobile)
    if (player.body.touching.down && mobileJump && window.mobileControls.jump.canJump && window.mobileControls.jump.justReleased) {
        window.mobileControls.jump.canJump = false;
        window.mobileControls.jump.justReleased = false;
        executeJump.call(this);
    }

    // Som de aterrissagem (original)
    if (player.body.touching.down && !player.body.wasTouching.down) {
        const landSound = this.sound.add('land', { volume: 0.5 });
        landSound.play();
    }
    
    // Animação (original)
    if (player.body.velocity.x !== 0) {
        player.anims.play('walk', true);
    } else {
        player.anims.play('idle', true);
    }
    
    // Morte ao cair da tela (original)
    if (player.y + player.body.halfHeight >= 710) {
        const damageSound = this.sound.add('damage', { volume: 0.5 });
        damageSound.play();
        hitSpike.call(this, player, null);
    }
}

function executeJump() {
    if (player.body.touching.down) {
        player.setVelocityY(-400);
        const jumpSound = this.sound.add('jump', { volume: 0.5 });
        jumpSound.play();
    }
}

function updateEnemies() {
    if (!enemies) return;
    
    enemies.children.iterate((enemy) => {
        if (!enemy || !enemy.body) return;
        
        // Velocidade fixa
        const speed = 100;
        
        // Se não tiver velocidade, definir uma direção
        if (enemy.body.velocity.x === 0) {
            enemy.setVelocityX(speed);
            enemy.lastX = enemy.x;
            enemy.lastMoveTime = this.time.now;
        }
        
        // Se a posição x não mudou por 1 segundo, inverter direção
        if (enemy.lastX === enemy.x) {
            if (this.time.now - enemy.lastMoveTime > 1000) {
                enemy.setVelocityX(-enemy.body.velocity.x);
                enemy.lastMoveTime = this.time.now;
            }
        } else {
            enemy.lastX = enemy.x;
            enemy.lastMoveTime = this.time.now;
        }
        
        // Garantir velocidade fixa
        enemy.setVelocityX(Math.sign(enemy.body.velocity.x) * speed);
        
        enemy.anims.play('enemyWalk', true);
    });
}

function updateTimer() {
    // Atualizar timer apenas se o jogo estiver rodando
    if (gameStarted && timerText) {
        timerText.setText(gameTime.toString());
    }
}

function generateLevel() {
    // Limpar completamente todos os objetos existentes
    this.children.removeAll();
    
    // Criar novos grupos primeiro
    platforms = this.physics.add.staticGroup();
    spikes = this.physics.add.staticGroup();
    enemies = this.physics.add.group();
    door = this.physics.add.staticGroup();
    
    // Tamanho do grid
    const gridSize = 15;
    const tileSize = 48;
    
    // Matriz para armazenar o layout
    const level = Array(gridSize).fill().map(() => Array(gridSize).fill(0));
    
    // Criar background (sem física e sem colisão)
    const background = this.add.group();
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            const bgTile = this.add.image(x * tileSize + tileSize/2, y * tileSize + tileSize/2, 'tiles', 1);
            bgTile.setDepth(-1); // Colocar background atrás de tudo
            background.add(bgTile);
        }
    }
    
    // Criar borda inferior como plataforma
    for (let x = 0; x < gridSize; x++) {
        const floorTile = platforms.create(x * tileSize + tileSize/2, 743, 'tiles', 0);
        floorTile.setVisible(false); // Tornar invisível
    }
    
    // Gerar pisos
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            if (Math.random() > 0.7) { // 30% de chance de gerar piso
                level[y][x] = 1;
                platforms.create(x * tileSize + tileSize/2, y * tileSize + tileSize/2, 'tiles', 0);
            }
        }
    }
    
    // Gerar espinhos (apenas um tile acima de pisos e mais raros)
    for (let y = 1; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            if (level[y][x] === 1 && level[y-1][x] === 0 && Math.random() > 0.8) { // 20% de chance de gerar espinhos
                const spike = spikes.create(x * tileSize + tileSize/2, (y-1) * tileSize + tileSize/2, 'tiles', 2);
                spike.body.setSize(12, 12).setOffset(18, 18);
                spike.setDepth(0); // Espinhos abaixo dos pisos
                level[y-1][x] = 2; // Marcar posição do espinho
            }
        }
    }
    
    // Gerar porta
    let doorX, doorY;
    do {
        doorX = Math.floor(Math.random() * gridSize);
        doorY = Math.floor(Math.random() * gridSize);
    } while (doorY === 0 || doorY >= gridSize - 1 || level[doorY][doorX] !== 0 || level[doorY + 1][doorX] !== 1 || level[doorY][doorX] === 2);
    
    // Criar porta como sprite estático
    const doorSprite = door.create(doorX * tileSize + tileSize/2, doorY * tileSize + tileSize/2, 'tiles', 3);
    doorSprite.setScale(1);
    doorSprite.setDepth(0);
    doorSprite.body.setSize(12, 12).setOffset(18, 18);
    
    // Gerar inimigos (3 a 6 inimigos)
    const numEnemies = Phaser.Math.Between(3, 6);
    for (let i = 0; i < numEnemies; i++) {
        let enemyX, enemyY;
        do {
            enemyX = Math.floor(Math.random() * gridSize);
            enemyY = Math.floor(Math.random() * gridSize);
        } while (level[enemyY][enemyX] !== 0 || level[enemyY][enemyX] === 2);
        
        const enemy = enemies.create(enemyX * tileSize + tileSize/2, enemyY * tileSize + tileSize/2, 'enemy');
        enemy.setCollideWorldBounds(true);
        enemy.setBounce(0.2);
        enemy.setVelocityX(0); // Iniciar parado
        enemy.setScale(1);
    }
    
    // Gerar jogador
    let playerX, playerY;
    do {
        playerX = Math.floor(Math.random() * gridSize);
        playerY = Math.floor(Math.random() * gridSize);
    } while (level[playerY][playerX] !== 0 || playerY >= gridSize - 1 || level[playerY + 1][playerX] !== 1 || level[playerY][playerX] === 2);
    
    player = this.physics.add.sprite(playerX * tileSize + tileSize/2, playerY * tileSize + tileSize/2, 'player');
    player.setCollideWorldBounds(true);
    player.setBounce(0.2);
    player.setScale(1);
    
    // Adicionar nome do jogador
    playerNameText = this.add.text(player.x, player.y - 28, playerName, {
        fontSize: '16px',
        fill: '#fff'
    }).setOrigin(0.5);
    
    // Configurar colisões
    this.physics.add.collider(player, platforms);
    this.physics.add.overlap(player, this.physics.world.bounds, hitSpike, null, this);
    this.physics.add.overlap(player, spikes, hitSpike, null, this);
    this.physics.add.overlap(player, door, reachDoor, null, this);
    this.physics.add.overlap(player, enemies, hitEnemy, null, this);
    this.physics.add.collider(enemies, platforms);
    this.physics.add.collider(enemies, this.physics.world.bounds, null, null, this);
}

function hitEnemy(player, enemy) {
    if (gameStarted) {
        gameStarted = false;
        const damageSound = this.sound.add('damage', { volume: 0.5 });
        damageSound.play();
        
        // Fazer o jogador desaparecer imediatamente
        if (player) {
            player.destroy();
        }
        if (playerNameText) {
            playerNameText.destroy();
        }
        
        // Parar o jogo completamente
        this.physics.pause();
        this.time.removeAllEvents();
        
        // Remover texto do timer
        if (timerText) {
            timerText.destroy();
        }
        
        // Remover grupos
        if (platforms && platforms.children) platforms.clear(true, true);
        if (spikes && spikes.children) spikes.clear(true, true);
        if (enemies && enemies.children) enemies.clear(true, true);
        if (door && door.children) door.clear(true, true);
        
        // Criar background
        for (let y = 0; y < 15; y++) {
            for (let x = 0; x < 15; x++) {
                this.add.image(x * 48 + 24, y * 48 + 24, 'tiles', 1);
            }
        }
        
        // Criar tela de game over
        const gameOverText = this.add.text(360, 200, 'GAME OVER', {
            fontSize: '64px',
            fill: '#fff'
        }).setOrigin(0.5);
        
        const scoreText = this.add.text(360, 300, `Tempo: ${30 - gameTime} segundos`, {
            fontSize: '32px',
            fill: '#fff'
        }).setOrigin(0.5);
        
        const generatingText = this.add.text(360, 500, 'Gerando próxima fase...', {
            fontSize: '24px',
            fill: '#fff'
        }).setOrigin(0.5);
        
        // Gerar nova fase após 3 segundos
        this.time.delayedCall(3000, () => {
            gameOverText.destroy();
            scoreText.destroy();
            generatingText.destroy();
            this.children.removeAll();
            this.physics.world.resume();
            startGame.call(this);
        });
    }
}

function hitSpike(player, spike) {
    if (gameStarted) {
        gameStarted = false;
        const damageSound = this.sound.add('damage', { volume: 0.5 });
        damageSound.play();
        
        // Fazer o jogador desaparecer imediatamente
        if (player) {
            player.destroy();
        }
        if (playerNameText) {
            playerNameText.destroy();
        }
        
        // Parar o jogo completamente
        this.physics.pause();
        this.time.removeAllEvents();
        
        // Remover texto do timer
        if (timerText) {
            timerText.destroy();
        }
        
        // Remover grupos
        if (platforms && platforms.children) platforms.clear(true, true);
        if (spikes && spikes.children) spikes.clear(true, true);
        if (enemies && enemies.children) enemies.clear(true, true);
        if (door && door.children) door.clear(true, true);
        
        // Criar background
        for (let y = 0; y < 15; y++) {
            for (let x = 0; x < 15; x++) {
                this.add.image(x * 48 + 24, y * 48 + 24, 'tiles', 1);
            }
        }
        
        // Criar tela de game over
        const gameOverText = this.add.text(360, 200, 'GAME OVER', {
            fontSize: '64px',
            fill: '#fff'
        }).setOrigin(0.5);
        
        const scoreText = this.add.text(360, 300, `Tempo: ${30 - gameTime} segundos`, {
            fontSize: '32px',
            fill: '#fff'
        }).setOrigin(0.5);
        
        const generatingText = this.add.text(360, 500, 'Gerando próxima fase...', {
            fontSize: '24px',
            fill: '#fff'
        }).setOrigin(0.5);
        
        // Gerar nova fase após 3 segundos
        this.time.delayedCall(3000, () => {
            gameOverText.destroy();
            scoreText.destroy();
            generatingText.destroy();
            this.children.removeAll();
            this.physics.world.resume();
            startGame.call(this);
        });
    }
}

function reachDoor(player, doorSprite) {
    if (gameStarted) {
        gameStarted = false;
        const winSound = this.sound.add('win', { volume: 0.5 });
        winSound.play();
        
        // Fazer o jogador desaparecer imediatamente
        if (player) {
            player.destroy();
        }
        if (playerNameText) {
            playerNameText.destroy();
        }
        
        // Parar o jogo completamente
        this.physics.pause();
        this.time.removeAllEvents();
        
        // Remover texto do timer
        if (timerText) {
            timerText.destroy();
        }
        
        // Remover texto do nome do jogador
        if (playerNameText) {
            playerNameText.destroy();
        }
        
        // Remover jogador
        if (player) {
            player.destroy();
        }
        
        // Remover grupos
        if (platforms && platforms.children) platforms.clear(true, true);
        if (spikes && spikes.children) spikes.clear(true, true);
        if (enemies && enemies.children) enemies.clear(true, true);
        if (door && door.children) door.clear(true, true);
        
        // Criar background
        for (let y = 0; y < 15; y++) {
            for (let x = 0; x < 15; x++) {
                this.add.image(x * 48 + 24, y * 48 + 24, 'tiles', 1);
            }
        }
        
        // Criar tela de vitória
        const victoryText = this.add.text(360, 200, `${playerName} WINS!`, {
            fontSize: '64px',
            fill: '#fff'
        }).setOrigin(0.5);
        
        const scoreText = this.add.text(360, 300, `Tempo: ${30 - gameTime} segundos`, {
            fontSize: '32px',
            fill: '#fff'
        }).setOrigin(0.5);
        
        const generatingText = this.add.text(360, 500, 'Gerando próxima fase...', {
            fontSize: '24px',
            fill: '#fff'
        }).setOrigin(0.5);
        
        // Gerar nova fase após 3 segundos
        this.time.delayedCall(3000, () => {
            victoryText.destroy();
            scoreText.destroy();
            generatingText.destroy();
            this.children.removeAll();
            this.physics.world.shutdown();
            this.physics.world.resume();
            startGame.call(this);
        });
    }
}

function gameOver() {
    if (!gameStarted) return;
    
    gameStarted = false;
    
    // Desativar física primeiro
    this.physics.world.shutdown();
    
    // Remover texto do timer
    if (timerText) {
        timerText.destroy();
    }
    
    // Remover texto do nome do jogador
    if (playerNameText) {
        playerNameText.destroy();
    }
    
    // Remover jogador
    if (player) {
        player.destroy();
    }
    
    // Remover grupos
    if (platforms) {
        platforms.clear(true, true);
        platforms.destroy();
    }
    if (spikes) {
        spikes.clear(true, true);
        spikes.destroy();
    }
    if (enemies) {
        enemies.clear(true, true);
        enemies.destroy();
    }
    if (door) {
        door.clear(true, true);
        door.destroy();
    }
    
    // Limpar completamente a cena
    this.children.removeAll();
    
    // Criar background
    for (let y = 0; y < 15; y++) {
        for (let x = 0; x < 15; x++) {
            this.add.image(x * 48 + 24, y * 48 + 24, 'tiles', 1);
        }
    }
    
    // Criar tela de game over
    const gameOverText = this.add.text(360, 200, 'GAME OVER', {
        fontSize: '64px',
        fill: '#fff'
    }).setOrigin(0.5);
    
    const scoreText = this.add.text(360, 300, `Tempo: ${30 - gameTime} segundos`, {
        fontSize: '32px',
        fill: '#fff'
    }).setOrigin(0.5);
    
    const generatingText = this.add.text(360, 500, 'Gerando próxima fase...', {
        fontSize: '24px',
        fill: '#fff'
    }).setOrigin(0.5);
    
    // Gerar nova fase após 3 segundos
    this.time.delayedCall(3000, () => {
        gameOverText.destroy();
        scoreText.destroy();
        generatingText.destroy();
        this.children.removeAll();
        this.physics.world.resume();
        startGame.call(this);
    });
}

function victory() {
    if (!gameStarted) return;
    
    gameStarted = false;
    
    // Remover texto do timer
    if (timerText) {
        timerText.destroy();
    }
    
    // Remover texto do nome do jogador
    if (playerNameText) {
        playerNameText.destroy();
    }
    
    // Remover jogador
    if (player) {
        player.destroy();
    }
    
    // Remover grupos
    if (platforms) {
        platforms.clear(true, true);
        platforms.destroy();
    }
    if (spikes) {
        spikes.clear(true, true);
        spikes.destroy();
    }
    if (enemies) {
        enemies.clear(true, true);
        enemies.destroy();
    }
    if (door) {
        door.clear(true, true);
        door.destroy();
    }
    
    // Limpar completamente a cena
    this.children.removeAll();
    
    // Criar background
    for (let y = 0; y < 15; y++) {
        for (let x = 0; x < 15; x++) {
            this.add.image(x * 48 + 24, y * 48 + 24, 'tiles', 1);
        }
    }
    
    // Criar tela de vitória
    const victoryText = this.add.text(360, 200, `${playerName} WINS!`, {
        fontSize: '64px',
        fill: '#fff'
    }).setOrigin(0.5);
    
    const scoreText = this.add.text(360, 300, `Tempo: ${30 - gameTime} segundos`, {
        fontSize: '32px',
        fill: '#fff'
    }).setOrigin(0.5);
    
    const generatingText = this.add.text(360, 500, 'Gerando próxima fase...', {
        fontSize: '24px',
        fill: '#fff'
    }).setOrigin(0.5);
    
    // Gerar nova fase após 3 segundos
    this.time.delayedCall(3000, () => {
        victoryText.destroy();
        scoreText.destroy();
        generatingText.destroy();
        this.children.removeAll();
        this.physics.world.shutdown();
        this.physics.world.resume();
        startGame.call(this);
    });
} 