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
    
    // 미로 관련 변수
    this.mazeEnv = new Maze(8);
    this.mazeAgent = null;
    this.isMazeTraining = false;
    this.mazeEpisode = 0;
    this.mazeSteps = [];
    this.currentSteps = 0;
    this.shortestPath = 0;
    this.mazeChartData = [];
    
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
                    <label for="learningRate">학습률 (Learning Rate):</label>
                    <input type="range" id="learningRate" min="0.0001" max="0.01" step="0.0001" value="0.001">
                    <span id="learningRateValue">0.001</span>
                  </div>
                  
                  <div class="setting-group">
                    <label for="epsilon">탐험률 (Epsilon):</label>
                    <input type="range" id="epsilon" min="0.01" max="1.0" step="0.01" value="1.0">
                    <span id="epsilonValue">1.0</span>
                  </div>
                  
                  <div class="setting-group">
                    <label for="epsilonDecay">탐험 감소율:</label>
                    <input type="range" id="epsilonDecay" min="0.99" max="0.999" step="0.001" value="0.995">
                    <span id="epsilonDecayValue">0.995</span>
                  </div>
                  
                  <div class="setting-group">
                    <label for="gamma">할인율 (Gamma):</label>
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
                  </div>
                </div>
                
                <div class="charts-container">
                  <div class="chart-section">
                    <h3>학습 진행 상황</h3>
                    <canvas id="scoreChart" width="400" height="200"></canvas>
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
                    <label for="mazeLearningRate">학습률 (Learning Rate):</label>
                    <input type="range" id="mazeLearningRate" min="0.01" max="0.9" step="0.01" value="0.1">
                    <span id="mazeLearningRateValue">0.1</span>
                  </div>
                  
                  <div class="setting-group">
                    <label for="mazeEpsilon">탐험률 (Epsilon):</label>
                    <input type="range" id="mazeEpsilon" min="0.01" max="1.0" step="0.01" value="0.9">
                    <span id="mazeEpsilonValue">0.9</span>
                  </div>
                  
                  <div class="setting-group">
                    <label for="mazeEpsilonDecay">탐험 감소율:</label>
                    <input type="range" id="mazeEpsilonDecay" min="0.99" max="0.999" step="0.001" value="0.995">
                    <span id="mazeEpsilonDecayValue">0.995</span>
                  </div>
                  
                  <div class="setting-group">
                    <label for="mazeGamma">할인율 (Gamma):</label>
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
                  
                  <div class="setting-group">
                    <label for="mazeSpeed">학습 속도:</label>
                    <input type="range" id="mazeSpeed" min="1" max="10" step="1" value="5">
                    <span id="mazeSpeedValue">5</span>
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
    
    document.getElementById('mazeSpeed').addEventListener('input', (e) => {
      document.getElementById('mazeSpeedValue').textContent = e.target.value;
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
    
    document.getElementById('startTraining').disabled = true;
    document.getElementById('stopTraining').disabled = false;
    document.getElementById('statusText').textContent = '학습 중...';
    
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
      
      // 100 에피소드마다 잠시 대기 (시각화를 위해)
      if (this.episode % 100 === 0) {
        await this.sleep(100);
      }
    }
  }
  
  async runEpisode() {
    let state = this.env.reset();
    let done = false;
    let score = 0;
    
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
      done = episodeDone; // done 변수 업데이트
      
      // 렌더링
      this.render();
      
      // 약간의 지연 (시각화를 위해)
      await this.sleep(50);
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
    const maxSteps = this.mazeEnv.size * this.mazeEnv.size * 2; // 최대 스텝 제한
    
    console.log(`Starting maze episode ${this.mazeEpisode + 1}, agent at:`, this.mazeEnv.agent);
    
    // 에피소드 시작 시 렌더링
    this.renderMaze();
    await this.sleep(200);
    
    while (!done && this.isMazeTraining && steps < maxSteps) {
      // 액션 선택
      const action = this.mazeAgent.act(state);
      
      // 환경에서 스텝 실행
      const [nextState, reward, episodeDone, info] = this.mazeEnv.step(action);
      
      // Q-learning 업데이트
      this.mazeAgent.update(state, action, reward, nextState, episodeDone);
      
      // 벽에 부딪힌 경우 시각적 피드백
      if (info.hitWall) {
        const canvas = document.getElementById('mazeCanvas');
        const ctx = canvas.getContext('2d');
        
        // 빨간색 깜빡임 효과
        ctx.fillStyle = 'rgba(245, 101, 101, 0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 잠시 대기 후 정상 렌더링
        setTimeout(() => {
          this.renderMaze();
        }, 100);
      }
      
      state = nextState;
      done = episodeDone;
      steps++;
      
      // 렌더링 (매 스텝마다)
      this.renderMaze();
      
      // UI 업데이트 (매 스텝마다)
      this.updateMazeUI();
      
      // 시각화를 위한 지연 (학습 속도에 따라 조절)
      const speed = parseInt(document.getElementById('mazeSpeed').value);
      const baseDelay = 300 - (speed * 25); // 1-10 속도에 따라 275ms-50ms
      
      if (this.mazeEpisode < 100) {
        // 초기 학습 단계에서는 더 천천히
        await this.sleep(baseDelay * 1.5);
      } else if (this.mazeEpisode < 500) {
        // 중간 학습 단계
        await this.sleep(baseDelay);
      } else {
        // 후반 학습 단계에서는 빠르게
        await this.sleep(baseDelay * 0.5);
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
    
    // 목표 도달 시 시각적 피드백
    if (done && this.mazeAgent) {
      const canvas = document.getElementById('mazeCanvas');
      const ctx = canvas.getContext('2d');
      
      // 성공 애니메이션
      ctx.fillStyle = 'rgba(72, 187, 120, 0.3)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // 잠시 대기 후 정상 렌더링
      setTimeout(() => {
        this.renderMaze();
      }, 300);
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
