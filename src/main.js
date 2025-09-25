import './style.css'
import { CartPole } from './cartpole.js'
import { DQN } from './dqn.js'

class CartPoleApp {
  constructor() {
    this.env = new CartPole();
    this.agent = null;
    this.isTraining = false;
    this.episode = 0;
    this.scores = [];
    this.currentScore = 0;
    this.animationId = null;
    
    this.initializeUI();
    this.setupEventListeners();
  }
  
  initializeUI() {
    document.querySelector('#app').innerHTML = `
      <div class="app-container">
        <header>
          <h1>🎯 CartPole 강화학습 실험</h1>
          <p>DQN 알고리즘으로 CartPole 게임을 학습합니다</p>
        </header>
        
        <div class="main-content">
          <div class="control-panel">
            <h3>실험 설정</h3>
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
    // 슬라이더 값 업데이트
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
    
    // 버튼 이벤트
    document.getElementById('startTraining').addEventListener('click', () => this.startTraining());
    document.getElementById('stopTraining').addEventListener('click', () => this.stopTraining());
    document.getElementById('resetAgent').addEventListener('click', () => this.resetAgent());
    document.getElementById('saveModel').addEventListener('click', () => this.saveModel());
    document.getElementById('loadModel').addEventListener('click', () => this.loadModel());
    
    // 차트 초기화
    this.initializeChart();
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
      const [nextState, reward, done, info] = this.env.step(action);
      
      // 경험 저장
      this.agent.remember(state, action, reward, nextState, done);
      
      // 학습
      this.agent.replay();
      
      state = nextState;
      score += reward;
      
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
}

// 앱 초기화
const app = new CartPoleApp();
