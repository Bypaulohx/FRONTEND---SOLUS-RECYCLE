const player = document.getElementById('player');
const trashes = document.querySelectorAll('.trash');
const station = document.getElementById('station');
const scoreDisplay = document.getElementById('score');
const message = document.getElementById('message');

let score = 0;
let carrying = false;
let carriedTrash = null;

function randomPosition() {
  return Math.floor(Math.random() * 350) + 20;
}

// posicionar lixos aleatoriamente
trashes.forEach(trash => {
  trash.style.top = randomPosition() + "px";
  trash.style.left = randomPosition() + "px";
});

let posX = 280, posY = 180;
const speed = 10;

// movimentação do jogador
document.addEventListener('keydown', e => {
  switch (e.key) {
    case 'ArrowUp': posY -= speed; break;
    case 'ArrowDown': posY += speed; break;
    case 'ArrowLeft': posX -= speed; break;
    case 'ArrowRight': posX += speed; break;
  }

  posX = Math.max(0, Math.min(posX, 560));
  posY = Math.max(0, Math.min(posY, 360));

  player.style.left = posX + "px";
  player.style.top = posY + "px";

  checkCollision();
});

function checkCollision() {
  const playerRect = player.getBoundingClientRect();

  trashes.forEach(trash => {
    const rect = trash.getBoundingClientRect();
    if (collision(playerRect, rect) && !carrying && trash.style.display !== "none") {
      carrying = true;
      carriedTrash = trash;
      trash.style.display = "none";
      message.textContent = "Você pegou um lixo eletrônico! Leve até o ponto verde.";
    }
  });

  const stationRect = station.getBoundingClientRect();
  if (collision(playerRect, stationRect) && carrying) {
    carrying = false;
    score += 50;
    scoreDisplay.textContent = "Pontos: " + score;
    message.textContent = "Lixo reciclado com sucesso! +50 pontos.";
    carriedTrash = null;

    if (document.querySelectorAll('.trash[style*="display: none"]').length === trashes.length) {
      message.textContent = "Parabéns! Você reciclou tudo! Pontos finais: " + score;
    }
  }
}

function collision(a, b) {
  return !(
    a.bottom < b.top ||
    a.top > b.bottom ||
    a.right < b.left ||
    a.left > b.right
  );
}