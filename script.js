/* ========================================
   JOGO DA VELHA — SCRIPT.JS
   Toda a lógica do jogo: turnos, vitória,
   placar, customização e efeitos visuais
   ======================================== */

/* ============================================================
   1. SELEÇÃO DE ELEMENTOS DO DOM
   ============================================================ */
const celulas       = document.querySelectorAll('.celula');
const statusEl      = document.getElementById('status');
const mensagemFinal = document.getElementById('mensagem-final');
const textoResult   = document.getElementById('texto-resultado');
const textoZoeira   = document.getElementById('texto-zoeira');
const vitoriasXEl   = document.getElementById('vitorias-x');
const vitoriasOEl   = document.getElementById('vitorias-o');
const empatesEl     = document.getElementById('empates');
const btnNovaPartida= document.getElementById('btn-nova-partida');
const btnResetar    = document.getElementById('btn-resetar');
const btnMenu       = document.getElementById('btn-menu');
const modalOverlay  = document.getElementById('modal-overlay');
const btnFecharModal= document.getElementById('btn-fechar-modal');
const placarX       = document.getElementById('placar-x');
const placarO       = document.getElementById('placar-o');
const canvas        = document.getElementById('sparkCanvas');
const ctx           = canvas.getContext('2d');

/* ============================================================
   2. ESTADO DO JOGO
   ============================================================ */
// tabuleiro: array de 9 posições, '' = vazio, 'X' ou 'O' preenchido
let tabuleiro   = Array(9).fill('');
let jogadorAtual= 'X';          // Quem está jogando agora
let jogoAtivo   = true;         // false quando a partida acabar

// Placar persistente (enquanto a página estiver aberta)
let vitorias = { X: 0, O: 0, empates: 0 };

/* ============================================================
   3. CUSTOMIZAÇÃO — símbolos e cores dos jogadores
   ============================================================ */
let config = {
  simboloX: 'X',
  simboloO: 'O',
  corX: '#1a6cf5',
  corO: '#ff2244',
};

/* ============================================================
   4. COMBINAÇÕES VENCEDORAS
   Todos os índices que formam uma linha de 3
   ============================================================ */
const combinacoesVencedoras = [
  [0, 1, 2], // linha 1
  [3, 4, 5], // linha 2
  [6, 7, 8], // linha 3
  [0, 3, 6], // coluna 1
  [1, 4, 7], // coluna 2
  [2, 5, 8], // coluna 3
  [0, 4, 8], // diagonal principal
  [2, 4, 6], // diagonal secundária
];

/* ============================================================
   5. FRASES DE ZOEIRA para vitória e empate
   ============================================================ */
const frasesVitoria = [
  'Você é muito ruim, man. Desiste logo!',
  'Como uma pessoa pode ser tão ruim assim? Impressionante.',
  'Vai trabalhar no Atacadão, KKKKKK!',
  'Você é femboy confirmado. Perdeu pro tabuleiro.',
  'Teu melhor amigo é o ChatGPT, KAKKAKA!',
  'Tinha que ser desempregado jogando isso aqui.',
  'Você não tem amor paterno e ainda perde no jogo.',
  'Você não tem amor materno e nem vitória.',
  'Eu sou Cris: cabeçudo, gordo e nojento... e ainda ganhei de você.',
  'Eu sou Breno CROSTA e até eu te bato fácil.',
  "I'm Bryan, my skin is black and I pick cotton... and still beat you.",
];

const frasesEmpate = [
  'Vocês dois são horríveis, se matem.',
  'Dois jogadores, zero talento. Empataram no zero a zero de competência.',
  'Empate? Os dois erraram a vida.',
];

/* ============================================================
   6. FUNÇÕES PRINCIPAIS DO JOGO
   ============================================================ */

/**
 * Atualiza as cores CSS e textos do placar de acordo com a config atual
 */
function aplicarConfig() {
  // Atualiza variáveis CSS para que todo o brilho acompanhe a cor escolhida
  document.documentElement.style.setProperty('--cor-x', config.corX);
  document.documentElement.style.setProperty('--cor-o', config.corO);

  // Atualiza símbolos no placar
  document.getElementById('simbolo-x-placar').textContent = config.simboloX;
  document.getElementById('simbolo-o-placar').textContent = config.simboloO;

  // Repintar células já marcadas com os novos símbolos/cores
  celulas.forEach((celula, i) => {
    if (tabuleiro[i] === 'X') celula.querySelector('.simbolo-celula').textContent = config.simboloX;
    if (tabuleiro[i] === 'O') celula.querySelector('.simbolo-celula').textContent = config.simboloO;
  });
}

/**
 * Reinicia apenas o tabuleiro para nova partida (placar mantido)
 */
function novaPartida() {
  tabuleiro    = Array(9).fill('');
  jogadorAtual = 'X';
  jogoAtivo    = true;

  // Limpa as células visualmente
  celulas.forEach(celula => {
    celula.className = 'celula';   // Remove classes 'x', 'o', 'marcada', 'vencedora'
    celula.innerHTML = '';
  });

  // Esconde mensagem final
  mensagemFinal.style.display = 'none';

  // Atualiza status
  atualizarStatus();
  destacarPlacarTurno();
}

/**
 * Atualiza o texto de status com o turno atual
 */
function atualizarStatus() {
  const simbolo = jogadorAtual === 'X' ? config.simboloX : config.simboloO;
  statusEl.textContent = `Vez do Jogador ${simbolo} (${jogadorAtual})`;
}

/**
 * Destaca no placar qual jogador está na vez
 */
function destacarPlacarTurno() {
  placarX.classList.toggle('ativo-turno', jogadorAtual === 'X');
  placarO.classList.toggle('ativo-turno', jogadorAtual === 'O');
}

/**
 * Clique em uma célula — jogada principal
 * @param {number} index - índice da célula (0-8)
 */
function jogar(index) {
  // Ignora se jogo acabou ou célula já preenchida
  if (!jogoAtivo || tabuleiro[index] !== '') return;

  // Registra no tabuleiro lógico
  tabuleiro[index] = jogadorAtual;

  // Renderiza o símbolo na célula
  const celula = celulas[index];
  celula.classList.add('marcada', jogadorAtual.toLowerCase());
  const span = document.createElement('span');
  span.classList.add('simbolo-celula');
  span.textContent = jogadorAtual === 'X' ? config.simboloX : config.simboloO;
  celula.appendChild(span);

  // Verifica se há vitória ou empate
  const vencedores = verificarVitoria();
  if (vencedores) {
    destacarVencedoras(vencedores);
    encerrarJogo('vitoria');
    return;
  }

  if (verificarEmpate()) {
    encerrarJogo('empate');
    return;
  }

  // Troca de turno
  jogadorAtual = jogadorAtual === 'X' ? 'O' : 'X';
  atualizarStatus();
  destacarPlacarTurno();
}

/**
 * Verifica se há combinação vencedora
 * @returns {number[]|null} índices das 3 células vencedoras ou null
 */
function verificarVitoria() {
  for (const combo of combinacoesVencedoras) {
    const [a, b, c] = combo;
    if (
      tabuleiro[a] &&
      tabuleiro[a] === tabuleiro[b] &&
      tabuleiro[a] === tabuleiro[c]
    ) {
      return combo;
    }
  }
  return null;
}

/**
 * Verifica empate (tabuleiro cheio sem vencedor)
 * @returns {boolean}
 */
function verificarEmpate() {
  return tabuleiro.every(c => c !== '');
}

/**
 * Destaca visualmente as 3 células vencedoras com cor dourada
 * @param {number[]} indices - array de 3 índices
 */
function destacarVencedoras(indices) {
  indices.forEach(i => celulas[i].classList.add('vencedora'));
}

/**
 * Encerra o jogo: atualiza placar, mostra mensagem e zoeira
 * @param {'vitoria'|'empate'} tipo
 */
function encerrarJogo(tipo) {
  jogoAtivo = false;

  if (tipo === 'vitoria') {
    vitorias[jogadorAtual]++;
    const simboloV = jogadorAtual === 'X' ? config.simboloX : config.simboloO;
    textoResult.textContent = `Jogador ${simboloV} (${jogadorAtual}) venceu! 🏆`;

    // Frase aleatória de zoeira para o perdedor
    const frase = frasesVitoria[Math.floor(Math.random() * frasesVitoria.length)];
    textoZoeira.textContent = `"${frase}"`;
    statusEl.textContent = `Jogador ${jogadorAtual} venceu!`;

  } else {
    vitorias.empates++;
    textoResult.textContent = '😐 Empate!';

    // Frase específica de empate
    const frase = frasesEmpate[Math.floor(Math.random() * frasesEmpate.length)];
    textoZoeira.textContent = `"${frase}"`;
    statusEl.textContent = 'Empate!';
  }

  // Exibe a mensagem final
  mensagemFinal.style.display = 'block';

  // Atualiza os números no placar
  vitoriasXEl.textContent = vitorias.X;
  vitoriasOEl.textContent = vitorias.O;
  empatesEl.textContent   = vitorias.empates;
}

/**
 * Reseta o placar zerado e começa nova partida
 */
function resetarPlacar() {
  vitorias = { X: 0, O: 0, empates: 0 };
  vitoriasXEl.textContent = '0';
  vitoriasOEl.textContent = '0';
  empatesEl.textContent   = '0';
  novaPartida();
}

/* ============================================================
   7. EVENTOS DOS BOTÕES E CÉLULAS
   ============================================================ */

// Clique em cada célula
celulas.forEach((celula, index) => {
  celula.addEventListener('click', () => jogar(index));
});

// Botão Nova Partida
btnNovaPartida.addEventListener('click', novaPartida);

// Botão Resetar Placar
btnResetar.addEventListener('click', resetarPlacar);

// Abrir / fechar modal de customização
btnMenu.addEventListener('click', () => {
  modalOverlay.style.display = 'flex';
});

btnFecharModal.addEventListener('click', () => {
  modalOverlay.style.display = 'none';
});

// Fechar modal clicando no overlay (fora do modal)
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) modalOverlay.style.display = 'none';
});

/* ============================================================
   8. CUSTOMIZAÇÃO — lógica dos botões de símbolo e cor
   ============================================================ */

/**
 * Marca o botão clicado como ativo dentro do grupo pai
 * @param {HTMLElement} btn - botão clicado
 */
function marcarAtivo(btn) {
  const grupo = btn.parentElement;
  grupo.querySelectorAll('.simbolo-btn, .cor-btn').forEach(b => b.classList.remove('ativo'));
  btn.classList.add('ativo');
}

// Botões de símbolo
document.querySelectorAll('.simbolo-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    marcarAtivo(btn);
    const jogador = btn.dataset.jogador; // 'x' ou 'o'
    const simbolo = btn.dataset.simbolo;
    if (jogador === 'x') config.simboloX = simbolo;
    else                 config.simboloO = simbolo;
    aplicarConfig();
    atualizarStatus();
  });
});

// Botões de cor
document.querySelectorAll('.cor-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    marcarAtivo(btn);
    const jogador = btn.dataset.jogador;
    const cor     = btn.dataset.cor;
    if (jogador === 'x') config.corX = cor;
    else                 config.corO = cor;
    aplicarConfig();
  });
});

/* ============================================================
   9. EFEITO DE FAÍSCAS DO MOUSE (Canvas)
   ============================================================ */

// Array que guarda as faíscas ativas
let particulas = [];

// Posição atual do mouse
let mouseX = -200, mouseY = -200;

/**
 * Redimensiona o canvas para cobrir a janela inteira
 */
function redimensionarCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}
redimensionarCanvas();
window.addEventListener('resize', redimensionarCanvas);

/**
 * Cria N faíscas na posição do mouse
 * @param {number} x - posição X
 * @param {number} y - posição Y
 * @param {number} quantidade - quantidade de faíscas
 */
function criarFaiscas(x, y, quantidade = 5) {
  for (let i = 0; i < quantidade; i++) {
    const angulo    = Math.random() * Math.PI * 2;
    const velocidade= Math.random() * 2.5 + 0.5;
    particulas.push({
      x,
      y,
      vx: Math.cos(angulo) * velocidade,
      vy: Math.sin(angulo) * velocidade,
      vida: 1,                // começa com opacidade máxima
      decaimento: Math.random() * 0.06 + 0.03, // velocidade de fade
      tamanho: Math.random() * 2.5 + 0.8,
    });
  }
}

/**
 * Loop de animação do canvas — atualiza e desenha faíscas a cada frame
 */
function animarFaiscas() {
  // Limpa o canvas (fundo transparente)
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Atualiza cada partícula
  particulas = particulas.filter(p => p.vida > 0);

  particulas.forEach(p => {
    // Move a partícula
    p.x  += p.vx;
    p.y  += p.vy;
    p.vy += 0.06; // leve gravidade
    p.vida -= p.decaimento;

    // Desenha a faísca como círculo branco translúcido
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.vida);
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.tamanho, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur  = 6;
    ctx.fill();
    ctx.restore();
  });

  requestAnimationFrame(animarFaiscas);
}
animarFaiscas();

// Gera faíscas ao mover o mouse
document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;

  // Atualiza posição do cursor CSS customizado
  document.documentElement.style.setProperty('--cursor-x', mouseX + 'px');
  document.documentElement.style.setProperty('--cursor-y', mouseY + 'px');

  // Cria faíscas na trilha do mouse
  criarFaiscas(mouseX, mouseY, 4);
});

// Faíscas extras ao clicar
document.addEventListener('click', (e) => {
  criarFaiscas(e.clientX, e.clientY, 18);
});

/* ============================================================
   10. INICIALIZAÇÃO
   ============================================================ */
aplicarConfig();   // Aplica cores e símbolos padrão
atualizarStatus(); // Exibe "Vez do Jogador X"
destacarPlacarTurno();
