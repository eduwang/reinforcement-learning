import './style.css'
import { CartPole } from './cartpole.js'
import { DQN } from './dqn.js'
import { Maze } from './maze.js'
import { QLearning } from './qlearning.js'

class CartPoleApp {
  constructor() {
    this.env = new CartPole();
    this.agent = null;
    this.isTraining = false;
    this.episode = 0;
    this.scores = [];
    this.currentScore = 0;
    this.animationId = null;
    this.cartpoleSpeed = 5; // 기본 속도 x5
    
    // 미로 관련 변수
    this.mazeEnv = new Maze(8);
    this.mazeAgent = null;
    this.isMazeTraining = false;
    this.mazeEpisode = 0;
    this.mazeSteps = [];
    this.currentSteps = 0;
    this.shortestPath = 0;
    this.mazeChartData = [];
    this.mazeSpeed = 5; // 기본 속도 x5
    
    this.initializeUI();
    this.setupEventListeners();
  }
  
  initializeUI() {
    document.querySelector('#app').innerHTML = `
      <div class="app-container">
        <header>
          <h1>🤖 강화학습 실험실</h1>
          <p>다양한 강화학습 알고리즘을 실험해보세요</p>
        </header>
        
        <div class="tab-container">
          <div class="tab-buttons">
            <button class="tab-button active" data-tab="cartpole">🎯 CartPole (DQN)</button>
            <button class="tab-button" data-tab="maze">🏃 미로 찾기 (Q-Learning)</button>
          </div>
          
          <!-- CartPole Tab -->
          <div id="cartpole-tab" class="tab-content active">
            <div class="main-content">
              <div class="control-panel">
                <h3>CartPole 실험 설정</h3>
                <div class="settings-grid">
                  <div class="setting-group">
                    <label for="learningRate">
                      학습률 (Learning Rate)
                      <span class="info-icon" data-tooltip="신경망이 얼마나 빠르게 학습할지 결정합니다.&#10;&#10;• 높으면: 빠른 학습, 하지만 불안정할 수 있음&#10;• 낮으면: 느린 학습, 하지만 안정적&#10;&#10;권장값: 0.001 (기본값)">ℹ️</span>
                    </label>
                    <input type="range" id="learningRate" min="0.0001" max="0.01" step="0.0001" value="0.001">
                    <span id="learningRateValue">0.001</span>
                  </div>
                  
                  <div class="setting-group">
                    <label for="epsilon">
                      탐험률 (Epsilon)
                      <span class="info-icon" data-tooltip="에이전트가 랜덤 행동을 선택할 확률입니다.&#10;&#10;• 높으면: 더 많은 탐험 (새로운 전략 시도)&#10;• 낮으면: 더 많은 활용 (학습된 전략 사용)&#10;&#10;학습 초기에는 1.0에서 시작하여 점차 감소합니다.">ℹ️</span>
                    </label>
                    <input type="range" id="epsilon" min="0.01" max="1.0" step="0.01" value="1.0">
                    <span id="epsilonValue">1.0</span>
                  </div>
                  
                  <div class="setting-group">
                    <label for="epsilonDecay">
                      탐험 감소율
                      <span class="info-icon" data-tooltip="매 스텝마다 탐험률이 감소하는 비율입니다.&#10;&#10;• 높으면 (0.999): 천천히 감소 → 오래 탐험&#10;• 낮으면 (0.99): 빠르게 감소 → 빨리 활용&#10;&#10;권장값: 0.995-0.998 (천천히 감소)">ℹ️</span>
                    </label>
                    <input type="range" id="epsilonDecay" min="0.99" max="0.999" step="0.001" value="0.995">
                    <span id="epsilonDecayValue">0.995</span>
                  </div>
                  
                  <div class="setting-group">
                    <label for="gamma">
                      할인율 (Gamma)
                      <span class="info-icon" data-tooltip="미래 보상을 얼마나 중요하게 볼지 결정합니다.&#10;&#10;• 높으면 (0.99): 장기적 보상 중시&#10;• 낮으면 (0.8): 즉각적 보상 중시&#10;&#10;CartPole처럼 오래 버티는 것이 목표라면 높게 설정!&#10;권장값: 0.95-0.99">ℹ️</span>
                    </label>
                    <input type="range" id="gamma" min="0.8" max="0.99" step="0.01" value="0.95">
                    <span id="gammaValue">0.95</span>
                  </div>
                  
                  <div class="setting-group">
                    <label for="hiddenSize">은닉층 크기:</label>
                    <select id="hiddenSize">
                      <option value="64">64</option>
                      <option value="128" selected>128</option>
                      <option value="256">256</option>
                      <option value="512">512</option>
                    </select>
                  </div>
                  
                  <div class="setting-group full-width">
                    <label>학습 속도:</label>
                    <div class="speed-buttons">
                      <button class="cartpole-speed-btn" data-speed="1">x1</button>
                      <button class="cartpole-speed-btn" data-speed="3">x3</button>
                      <button class="cartpole-speed-btn active" data-speed="5">x5</button>
                      <button class="cartpole-speed-btn" data-speed="10">x10</button>
                      <button class="cartpole-speed-btn" data-speed="max">MAX</button>
                    </div>
                  </div>
                </div>
                
                <div class="control-buttons">
                  <button id="startTraining" class="btn btn-primary">학습 시작</button>
                  <button id="stopTraining" class="btn btn-danger" disabled>학습 중지</button>
                  <button id="resetAgent" class="btn btn-secondary">에이전트 초기화</button>
                  <button id="saveModel" class="btn btn-success">모델 저장</button>
                  <button id="loadModel" class="btn btn-info">모델 불러오기</button>
                </div>
              </div>
              
              <div class="visualization-panel">
                <div class="game-container">
                  <h3>CartPole 게임</h3>
                  <canvas id="gameCanvas" width="400" height="300"></canvas>
                  <div class="game-info">
                    <div>에피소드: <span id="episodeCount">0</span></div>
                    <div>현재 점수: <span id="currentScore">0</span></div>
                    <div>평균 점수: <span id="averageScore">0</span></div>
                    <div>최고 점수: <span id="bestScore">0</span></div>
                    <div>탐험률 (ε): <span id="epsilonCurrent">1.00</span></div>
                    <div>메모리: <span id="memorySize">0</span> / 10000</div>
                  </div>
                </div>
                
                <div class="charts-container">
                  <div class="chart-section">
                    <h3>학습 진행 상황</h3>
                    <canvas id="scoreChart" width="400" height="200"></canvas>
                    <div class="chart-info">
                      <p class="chart-label">📊 <strong>Y축:</strong> 에피소드 점수 (높을수록 좋음)</p>
                      <p class="chart-description">CartPole이 넘어지지 않고 버틴 스텝 수. 그래프가 점진적으로 위로 올라가면 학습 성공! 50-100 에피소드 이후부터 개선이 시작됩니다. ↗️</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Maze Tab -->
          <div id="maze-tab" class="tab-content">
            <div class="main-content">
              <div class="control-panel">
                <h3>미로 찾기 실험 설정</h3>
                <div class="settings-grid">
                  <div class="setting-group">
                    <label for="mazeLearningRate">
                      학습률 (Learning Rate)
                      <span class="info-icon" data-tooltip="Q-table의 값이 얼마나 빠르게 업데이트될지 결정합니다.&#10;&#10;• 높으면: 빠른 학습, 최근 경험 중시&#10;• 낮으면: 느린 학습, 과거 경험 유지&#10;&#10;권장값: 0.1-0.3">ℹ️</span>
                    </label>
                    <input type="range" id="mazeLearningRate" min="0.01" max="0.9" step="0.01" value="0.1">
                    <span id="mazeLearningRateValue">0.1</span>
                  </div>
                  
                  <div class="setting-group">
                    <label for="mazeEpsilon">
                      탐험률 (Epsilon)
                      <span class="info-icon" data-tooltip="에이전트가 랜덤 방향으로 이동할 확률입니다.&#10;&#10;• 높으면: 더 많은 탐험 (새로운 경로 시도)&#10;• 낮으면: 더 많은 활용 (알려진 최적 경로 사용)&#10;&#10;초기에는 높게, 학습이 진행되면 낮아집니다.">ℹ️</span>
                    </label>
                    <input type="range" id="mazeEpsilon" min="0.01" max="1.0" step="0.01" value="0.9">
                    <span id="mazeEpsilonValue">0.9</span>
                  </div>
                  
                  <div class="setting-group">
                    <label for="mazeEpsilonDecay">
                      탐험 감소율
                      <span class="info-icon" data-tooltip="매 에피소드마다 탐험률이 감소하는 비율입니다.&#10;&#10;• 높으면 (0.999): 천천히 감소 → 오래 탐험&#10;• 낮으면 (0.99): 빠르게 감소 → 빨리 수렴&#10;&#10;미로가 복잡할수록 천천히 감소시키는 것이 좋습니다.">ℹ️</span>
                    </label>
                    <input type="range" id="mazeEpsilonDecay" min="0.99" max="0.999" step="0.001" value="0.995">
                    <span id="mazeEpsilonDecayValue">0.995</span>
                  </div>
                  
                  <div class="setting-group">
                    <label for="mazeGamma">
                      할인율 (Gamma)
                      <span class="info-icon" data-tooltip="미래 보상을 얼마나 중요하게 볼지 결정합니다.&#10;&#10;• 높으면 (0.99): 장기적 경로 계획&#10;• 낮으면 (0.8): 즉각적 목표에 집중&#10;&#10;미로 찾기에서는 높게 설정하여 최단 경로를 찾습니다.&#10;권장값: 0.9-0.99">ℹ️</span>
                    </label>
                    <input type="range" id="mazeGamma" min="0.8" max="0.99" step="0.01" value="0.9">
                    <span id="mazeGammaValue">0.9</span>
                  </div>
                  
                  <div class="setting-group">
                    <label for="mazeSize">미로 크기:</label>
                    <select id="mazeSize">
                      <option value="5">5x5</option>
                      <option value="8" selected>8x8</option>
                      <option value="10">10x10</option>
                    </select>
                  </div>
                  
                  <div class="setting-group full-width">
                    <label>학습 속도:</label>
                    <div class="speed-buttons">
                      <button class="speed-btn" data-speed="1">x1</button>
                      <button class="speed-btn" data-speed="3">x3</button>
                      <button class="speed-btn active" data-speed="5">x5</button>
                      <button class="speed-btn" data-speed="10">x10</button>
                      <button class="speed-btn" data-speed="max">MAX</button>
                    </div>
                  </div>
                </div>
                
                <div class="control-buttons">
                  <button id="startMazeTraining" class="btn btn-primary">학습 시작</button>
                  <button id="stopMazeTraining" class="btn btn-danger" disabled>학습 중지</button>
                  <button id="resetMazeAgent" class="btn btn-secondary">에이전트 초기화</button>
                  <button id="generateNewMaze" class="btn btn-warning">새 미로 생성</button>
                </div>
              </div>
              
              <div class="visualization-panel">
                <div class="game-container">
                  <h3>미로 찾기 게임</h3>
                  <canvas id="mazeCanvas" width="400" height="400"></canvas>
                  <div class="game-info">
                    <div>에피소드: <span id="mazeEpisodeCount">0</span></div>
                    <div>현재 스텝: <span id="mazeCurrentSteps">0</span></div>
                    <div>평균 스텝: <span id="mazeAverageSteps">0</span></div>
                    <div>최단 경로: <span id="mazeShortestPath">0</span></div>
                  </div>
                </div>
                
                <div class="charts-container">
                  <div class="chart-section">
                    <h3>학습 진행 상황</h3>
                    <canvas id="mazeChart" width="400" height="200"></canvas>
                    <div class="chart-info">
                      <p class="chart-label">📊 <strong>Y축:</strong> 목표 도달 스텝 수 (낮을수록 좋음)</p>
                      <p class="chart-description">목표(G)에 도달하는데 걸린 이동 횟수. 그래프가 아래로 내려가면 학습 성공! ↘️</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="status-panel">
          <div id="statusText">준비됨</div>
          <div class="progress-bar">
            <div id="progressFill" class="progress-fill"></div>
          </div>
        </div>
      </div>
    `;
  }
  
  setupEventListeners() {
    // 탭 전환 이벤트
    document.querySelectorAll('.tab-button').forEach(button => {
      button.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
    });
    
    // CartPole 슬라이더 값 업데이트
    document.getElementById('learningRate').addEventListener('input', (e) => {
      document.getElementById('learningRateValue').textContent = e.target.value;
    });
    
    document.getElementById('epsilon').addEventListener('input', (e) => {
      document.getElementById('epsilonValue').textContent = e.target.value;
    });
    
    document.getElementById('epsilonDecay').addEventListener('input', (e) => {
      document.getElementById('epsilonDecayValue').textContent = e.target.value;
    });
    
    document.getElementById('gamma').addEventListener('input', (e) => {
      document.getElementById('gammaValue').textContent = e.target.value;
    });
    
    // CartPole 속도 버튼 이벤트
    document.querySelectorAll('.cartpole-speed-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        // 모든 버튼에서 active 클래스 제거
        document.querySelectorAll('.cartpole-speed-btn').forEach(b => b.classList.remove('active'));
        // 클릭된 버튼에 active 클래스 추가
        e.target.classList.add('active');
        // 속도 저장
        this.cartpoleSpeed = e.target.dataset.speed;
      });
    });
    
    // Maze 슬라이더 값 업데이트
    document.getElementById('mazeLearningRate').addEventListener('input', (e) => {
      document.getElementById('mazeLearningRateValue').textContent = e.target.value;
    });
    
    document.getElementById('mazeEpsilon').addEventListener('input', (e) => {
      document.getElementById('mazeEpsilonValue').textContent = e.target.value;
    });
    
    document.getElementById('mazeEpsilonDecay').addEventListener('input', (e) => {
      document.getElementById('mazeEpsilonDecayValue').textContent = e.target.value;
    });
    
    document.getElementById('mazeGamma').addEventListener('input', (e) => {
      document.getElementById('mazeGammaValue').textContent = e.target.value;
    });
    
    // 속도 버튼 이벤트
    document.querySelectorAll('.speed-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        // 모든 버튼에서 active 클래스 제거
        document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
        // 클릭된 버튼에 active 클래스 추가
        e.target.classList.add('active');
        // 속도 저장
        this.mazeSpeed = e.target.dataset.speed;
      });
    });
    
    // CartPole 버튼 이벤트
    document.getElementById('startTraining').addEventListener('click', () => this.startTraining());
    document.getElementById('stopTraining').addEventListener('click', () => this.stopTraining());
    document.getElementById('resetAgent').addEventListener('click', () => this.resetAgent());
    document.getElementById('saveModel').addEventListener('click', () => this.saveModel());
    document.getElementById('loadModel').addEventListener('click', () => this.loadModel());
    
    // Maze 버튼 이벤트
    document.getElementById('startMazeTraining').addEventListener('click', () => this.startMazeTraining());
    document.getElementById('stopMazeTraining').addEventListener('click', () => this.stopMazeTraining());
    document.getElementById('resetMazeAgent').addEventListener('click', () => this.resetMazeAgent());
    document.getElementById('generateNewMaze').addEventListener('click', () => this.generateNewMaze());
    
    // 차트 초기화
    this.initializeChart();
    this.initializeMazeChart();
    
    // 초기 미로 렌더링 (DOM이 완전히 로드된 후)
    setTimeout(() => {
      this.renderMaze();
    }, 100);
  }
  
  initializeChart() {
    const canvas = document.getElementById('scoreChart');
    const ctx = canvas.getContext('2d');
    
    // 간단한 차트 구현
    this.chartCtx = ctx;
    this.chartData = [];
    this.drawChart();
  }
  
  drawChart() {
    const ctx = this.chartCtx;
    const canvas = document.getElementById('scoreChart');
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    if (this.chartData.length === 0) return;
    
    const maxScore = Math.max(...this.chartData);
    const minScore = Math.min(...this.chartData);
    const range = maxScore - minScore || 1;
    
    ctx.strokeStyle = '#2196F3';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    this.chartData.forEach((score, index) => {
      const x = (index / (this.chartData.length - 1)) * width;
      const y = height - ((score - minScore) / range) * height;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();
    
    // 평균선 그리기
    if (this.chartData.length > 10) {
      const recentScores = this.chartData.slice(-10);
      const avgScore = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
      const avgY = height - ((avgScore - minScore) / range) * height;
      
      ctx.strokeStyle = '#FF9800';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(0, avgY);
      ctx.lineTo(width, avgY);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
  
  startTraining() {
    if (this.isTraining) return;
    
    const learningRate = parseFloat(document.getElementById('learningRate').value);
    const epsilon = parseFloat(document.getElementById('epsilon').value);
    const epsilonDecay = parseFloat(document.getElementById('epsilonDecay').value);
    const gamma = parseFloat(document.getElementById('gamma').value);
    const hiddenSize = parseInt(document.getElementById('hiddenSize').value);
    
    this.agent = new DQN(4, hiddenSize, 2, learningRate);
    this.agent.epsilon = epsilon;
    this.agent.epsilonDecay = epsilonDecay;
    this.agent.gamma = gamma;
    
    this.isTraining = true;
    this.episode = 0;
    this.scores = [];
    this.chartData = [];
    
    document.getElementById('startTraining').disabled = true;
    document.getElementById('stopTraining').disabled = false;
    document.getElementById('statusText').textContent = '학습 중... (초기 500 스텝 동안 경험 수집)';
    
    this.trainingLoop();
  }
  
  stopTraining() {
    this.isTraining = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    document.getElementById('startTraining').disabled = false;
    document.getElementById('stopTraining').disabled = true;
    document.getElementById('statusText').textContent = '학습 중지됨';
  }
  
  resetAgent() {
    this.agent = null;
    this.episode = 0;
    this.scores = [];
    this.currentScore = 0;
    
    document.getElementById('episodeCount').textContent = '0';
    document.getElementById('currentScore').textContent = '0';
    document.getElementById('averageScore').textContent = '0';
    document.getElementById('bestScore').textContent = '0';
    
    this.chartData = [];
    this.drawChart();
    
    document.getElementById('statusText').textContent = '에이전트 초기화됨';
  }
  
  saveModel() {
    if (!this.agent) {
      alert('저장할 모델이 없습니다.');
      return;
    }
    
    const modelData = this.agent.save();
    const dataStr = JSON.stringify(modelData);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = 'cartpole_model.json';
    link.click();
    
    document.getElementById('statusText').textContent = '모델이 저장되었습니다.';
  }
  
  loadModel() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const modelData = JSON.parse(e.target.result);
          if (!this.agent) {
            this.agent = new DQN();
          }
          this.agent.load(modelData);
          document.getElementById('statusText').textContent = '모델이 로드되었습니다.';
        } catch (error) {
          alert('모델 파일을 읽을 수 없습니다.');
        }
      };
      reader.readAsText(file);
    };
    
    input.click();
  }
  
  async trainingLoop() {
    while (this.isTraining) {
      await this.runEpisode();
      
      // UI 업데이트
      this.updateUI();
      
      // 차트 업데이트
      this.drawChart();
      
      // 속도에 따른 대기 시간
      if (this.cartpoleSpeed === 'max') {
        // MAX 속도: 10 에피소드마다 한 번만 대기
        if (this.episode % 10 === 0) {
          await this.sleep(10);
        }
      } else {
        // 일반 속도: 에피소드마다 대기
        const speedMultiplier = parseFloat(this.cartpoleSpeed);
        if (this.episode % 10 === 0) {
          await this.sleep(100 / speedMultiplier);
        }
      }
    }
  }
  
  async runEpisode() {
    let state = this.env.reset();
    let done = false;
    let score = 0;
    let stepCount = 0;
    
    while (!done && this.isTraining) {
      // 액션 선택
      const action = this.agent.act(state);
      
      // 환경에서 스텝 실행
      const [nextState, reward, episodeDone, info] = this.env.step(action);
      
      // 경험 저장
      this.agent.remember(state, action, reward, nextState, episodeDone);
      
      // 학습
      this.agent.replay();
      
      state = nextState;
      score += reward;
      done = episodeDone;
      stepCount++;
      
      // 렌더링 및 딜레이 (속도에 따라 조절)
      if (this.cartpoleSpeed === 'max') {
        // MAX 속도: 5 스텝마다 한 번만 렌더링
        if (stepCount % 5 === 0) {
          this.render();
        }
        await this.sleep(0);
      } else {
        // 일반 속도: 매 스텝마다 렌더링
        this.render();
        const speedMultiplier = parseFloat(this.cartpoleSpeed);
        await this.sleep(50 / speedMultiplier);
      }
    }
    
    this.episode++;
    this.scores.push(score);
    this.currentScore = score;
    
    // 차트 데이터 업데이트 (최근 100개 에피소드만)
    this.chartData.push(score);
    if (this.chartData.length > 100) {
      this.chartData.shift();
    }
  }
  
  render() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    this.env.render(canvas, ctx);
  }
  
  updateUI() {
    document.getElementById('episodeCount').textContent = this.episode;
    document.getElementById('currentScore').textContent = this.currentScore;
    
    if (this.scores.length > 0) {
      const avgScore = this.scores.reduce((a, b) => a + b, 0) / this.scores.length;
      const bestScore = Math.max(...this.scores);
      
      document.getElementById('averageScore').textContent = avgScore.toFixed(1);
      document.getElementById('bestScore').textContent = bestScore;
    }
    
    // DQN 학습 상태 정보 및 상태 메시지
    if (this.agent) {
      document.getElementById('epsilonCurrent').textContent = this.agent.epsilon.toFixed(3);
      document.getElementById('memorySize').textContent = this.agent.memory.length;
      
      // 학습 단계에 따른 상태 메시지
      if (this.agent.memory.length < this.agent.minMemorySize) {
        document.getElementById('statusText').textContent = 
          `경험 수집 중... (${this.agent.memory.length}/${this.agent.minMemorySize})`;
      } else if (this.agent.trainingStep < 100) {
        document.getElementById('statusText').textContent = 
          `워밍업 중... (탐험률 고정)`;
      } else if (this.agent.epsilon > 0.3) {
        document.getElementById('statusText').textContent = 
          `탐험 중... (ε=${this.agent.epsilon.toFixed(2)})`;
      } else if (this.agent.epsilon > 0.1) {
        document.getElementById('statusText').textContent = 
          `학습 중... (ε=${this.agent.epsilon.toFixed(2)})`;
      } else {
        document.getElementById('statusText').textContent = 
          `최적화 중... (ε=${this.agent.epsilon.toFixed(2)})`;
      }
    }
    
    // 진행률 업데이트
    const progress = Math.min(this.episode / 1000, 1);
    document.getElementById('progressFill').style.width = `${progress * 100}%`;
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // 탭 전환 기능
  switchTab(tabName) {
    // 모든 탭 버튼과 콘텐츠 비활성화
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // 선택된 탭 활성화
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    // 현재 탭에 따라 상태 업데이트
    if (tabName === 'cartpole') {
      document.getElementById('statusText').textContent = 'CartPole 탭이 선택되었습니다.';
    } else if (tabName === 'maze') {
      document.getElementById('statusText').textContent = '미로 찾기 탭이 선택되었습니다.';
    }
  }
  
  // 미로 관련 메서드들 (추후 구현)
  initializeMazeChart() {
    const canvas = document.getElementById('mazeChart');
    const ctx = canvas.getContext('2d');
    
    this.mazeChartCtx = ctx;
    this.mazeChartData = [];
    this.drawMazeChart();
  }
  
  drawMazeChart() {
    const ctx = this.mazeChartCtx;
    const canvas = document.getElementById('mazeChart');
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    if (this.mazeChartData.length === 0) return;
    
    const maxSteps = Math.max(...this.mazeChartData);
    const minSteps = Math.min(...this.mazeChartData);
    const range = maxSteps - minSteps || 1;
    
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    this.mazeChartData.forEach((steps, index) => {
      const x = (index / (this.mazeChartData.length - 1)) * width;
      const y = height - ((steps - minSteps) / range) * height;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();
  }
  
  startMazeTraining() {
    if (this.isMazeTraining) return;
    
    const learningRate = parseFloat(document.getElementById('mazeLearningRate').value);
    const epsilon = parseFloat(document.getElementById('mazeEpsilon').value);
    const epsilonDecay = parseFloat(document.getElementById('mazeEpsilonDecay').value);
    const gamma = parseFloat(document.getElementById('mazeGamma').value);
    const mazeSize = parseInt(document.getElementById('mazeSize').value);
    
    this.mazeEnv = new Maze(mazeSize);
    this.mazeAgent = new QLearning(2, 4, learningRate, gamma, epsilon);
    this.mazeAgent.epsilonDecay = epsilonDecay;
    
    this.isMazeTraining = true;
    this.mazeEpisode = 0;
    this.mazeSteps = [];
    this.shortestPath = this.mazeEnv.findShortestPath();
    
    // 초기 미로 렌더링
    this.renderMaze();
    
    document.getElementById('startMazeTraining').disabled = true;
    document.getElementById('stopMazeTraining').disabled = false;
    document.getElementById('statusText').textContent = '미로 찾기 학습 중...';
    
    this.mazeTrainingLoop();
  }
  
  stopMazeTraining() {
    this.isMazeTraining = false;
    
    document.getElementById('startMazeTraining').disabled = false;
    document.getElementById('stopMazeTraining').disabled = true;
    document.getElementById('statusText').textContent = '미로 찾기 학습이 중지되었습니다.';
  }
  
  resetMazeAgent() {
    this.mazeAgent = null;
    this.mazeEpisode = 0;
    this.mazeSteps = [];
    this.currentSteps = 0;
    
    document.getElementById('mazeEpisodeCount').textContent = '0';
    document.getElementById('mazeCurrentSteps').textContent = '0';
    document.getElementById('mazeAverageSteps').textContent = '0';
    document.getElementById('mazeShortestPath').textContent = '0';
    
    this.mazeChartData = [];
    this.drawMazeChart();
    
    document.getElementById('statusText').textContent = '미로 찾기 에이전트가 초기화되었습니다.';
  }
  
  generateNewMaze() {
    const mazeSize = parseInt(document.getElementById('mazeSize').value);
    this.mazeEnv = new Maze(mazeSize);
    this.shortestPath = this.mazeEnv.findShortestPath();
    document.getElementById('mazeShortestPath').textContent = this.shortestPath;
    document.getElementById('statusText').textContent = '새 미로가 생성되었습니다.';
    this.renderMaze();
  }
  
  async mazeTrainingLoop() {
    while (this.isMazeTraining) {
      await this.runMazeEpisode();
      
      // UI 업데이트
      this.updateMazeUI();
      
      // 차트 업데이트
      this.drawMazeChart();
      
      // 50 에피소드마다 잠시 대기 (시각화를 위해)
      if (this.mazeEpisode % 50 === 0) {
        await this.sleep(100);
      }
    }
  }
  
  async runMazeEpisode() {
    let state = this.mazeEnv.reset();
    let done = false;
    let steps = 0;
    const maxSteps = this.mazeEnv.size * this.mazeEnv.size * 3; // 최대 스텝 제한
    
    // 에피소드 시작 시 렌더링
    this.renderMaze();
    
    // 속도에 따른 시작 딜레이
    if (this.mazeSpeed === 'max') {
      await this.sleep(0);
    } else {
      const speedMultiplier = parseFloat(this.mazeSpeed);
      await this.sleep(300 / speedMultiplier);
    }
    
    while (!done && this.isMazeTraining && steps < maxSteps) {
      // 이전 위치 저장
      const prevX = this.mazeEnv.agent.x;
      const prevY = this.mazeEnv.agent.y;
      
      // 액션 선택
      const action = this.mazeAgent.act(state);
      
      // 환경에서 스텝 실행
      const [nextState, reward, episodeDone, info] = this.mazeEnv.step(action);
      
      // Q-learning 업데이트
      this.mazeAgent.update(state, action, reward, nextState, episodeDone);
      
      // 에이전트가 실제로 이동했는지 확인
      const hasMoved = (this.mazeEnv.agent.x !== prevX || this.mazeEnv.agent.y !== prevY);
      
      if (hasMoved) {
        // 에이전트가 이동한 경우에만 렌더링 및 딜레이
        state = nextState;
        done = episodeDone;
        steps++;
        
        // 렌더링 (MAX 속도가 아닐 때만)
        if (this.mazeSpeed !== 'max') {
          this.renderMaze();
          this.updateMazeUI();
        }
        
        // 시각화를 위한 지연 (속도에 따라 조절)
        const baseDelay = 300; // 기본 0.3초
        if (this.mazeSpeed === 'max') {
          // MAX: 10 스텝마다 한 번만 렌더링
          if (steps % 10 === 0) {
            this.renderMaze();
            this.updateMazeUI();
          }
          await this.sleep(0); // 딜레이 없음
        } else {
          const speedMultiplier = parseFloat(this.mazeSpeed);
          const delay = baseDelay / speedMultiplier;
          await this.sleep(delay);
        }
      } else {
        // 벽에 부딪힌 경우 - 딜레이 없이 빠르게 다음 액션으로
        state = nextState;
        done = episodeDone;
        steps++;
      }
    }
    
    this.mazeEpisode++;
    this.mazeSteps.push(steps);
    this.currentSteps = steps;
    
    // 차트 데이터 업데이트 (최근 100개 에피소드만)
    this.mazeChartData.push(steps);
    if (this.mazeChartData.length > 100) {
      this.mazeChartData.shift();
    }
    
    // 에피소드 완료 시 최종 렌더링
    this.renderMaze();
    this.updateMazeUI();
    
    // 목표 도달 시 시각적 피드백 (MAX 속도가 아닐 때만)
    if (done && this.mazeSpeed !== 'max') {
      const canvas = document.getElementById('mazeCanvas');
      const ctx = canvas.getContext('2d');
      
      // 성공 애니메이션 (글로우 효과)
      ctx.fillStyle = 'rgba(72, 187, 120, 0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // 속도에 따른 대기 시간
      const speedMultiplier = parseFloat(this.mazeSpeed);
      await this.sleep(500 / speedMultiplier);
      this.renderMaze();
    }
    
    // 에피소드 간 짧은 대기 (MAX 속도일 때는 생략)
    if (this.mazeSpeed === 'max') {
      // 100 에피소드마다 한 번만 렌더링
      if (this.mazeEpisode % 100 === 0) {
        this.renderMaze();
        this.updateMazeUI();
        await this.sleep(10);
      }
    } else {
      const speedMultiplier = parseFloat(this.mazeSpeed);
      await this.sleep(100 / speedMultiplier);
    }
  }
  
  renderMaze() {
    const canvas = document.getElementById('mazeCanvas');
    if (!canvas) {
      console.error('mazeCanvas not found');
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Could not get 2D context');
      return;
    }
    this.mazeEnv.render(canvas, ctx);
  }
  
  updateMazeUI() {
    document.getElementById('mazeEpisodeCount').textContent = this.mazeEpisode;
    document.getElementById('mazeCurrentSteps').textContent = this.currentSteps;
    document.getElementById('mazeShortestPath').textContent = this.shortestPath;
    
    if (this.mazeSteps.length > 0) {
      const avgSteps = this.mazeSteps.reduce((a, b) => a + b, 0) / this.mazeSteps.length;
      document.getElementById('mazeAverageSteps').textContent = avgSteps.toFixed(1);
    }
    
    // 진행률 업데이트
    const progress = Math.min(this.mazeEpisode / 1000, 1);
    document.getElementById('progressFill').style.width = `${progress * 100}%`;
  }
}

// 앱 초기화
const app = new CartPoleApp();
