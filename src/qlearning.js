// Q-Learning 알고리즘 구현
export class QLearning {
  constructor(stateSize, actionSize, learningRate = 0.1, gamma = 0.9, epsilon = 0.9) {
    this.stateSize = stateSize;
    this.actionSize = actionSize;
    this.learningRate = learningRate;
    this.gamma = gamma;
    this.epsilon = epsilon;
    this.epsilonDecay = 0.995;
    this.epsilonMin = 0.01;
    
    // Q-table 초기화 (상태를 문자열로 변환하여 사용)
    this.qTable = new Map();
  }
  
  getStateKey(state) {
    // 상태를 문자열로 변환 (예: "x,y")
    return `${state[0]},${state[1]}`;
  }
  
  getQValue(state, action) {
    const stateKey = this.getStateKey(state);
    if (!this.qTable.has(stateKey)) {
      this.qTable.set(stateKey, new Array(this.actionSize).fill(0));
    }
    return this.qTable.get(stateKey)[action];
  }
  
  setQValue(state, action, value) {
    const stateKey = this.getStateKey(state);
    if (!this.qTable.has(stateKey)) {
      this.qTable.set(stateKey, new Array(this.actionSize).fill(0));
    }
    this.qTable.get(stateKey)[action] = value;
  }
  
  act(state) {
    // Epsilon-greedy 정책
    if (Math.random() < this.epsilon) {
      // 탐험 (랜덤 액션)
      return Math.floor(Math.random() * this.actionSize);
    } else {
      // 활용 (최적 액션)
      return this.getBestAction(state);
    }
  }
  
  getBestAction(state) {
    const stateKey = this.getStateKey(state);
    if (!this.qTable.has(stateKey)) {
      this.qTable.set(stateKey, new Array(this.actionSize).fill(0));
    }
    
    const qValues = this.qTable.get(stateKey);
    let bestAction = 0;
    let bestValue = qValues[0];
    
    for (let i = 1; i < this.actionSize; i++) {
      if (qValues[i] > bestValue) {
        bestValue = qValues[i];
        bestAction = i;
      }
    }
    
    return bestAction;
  }
  
  update(state, action, reward, nextState, done) {
    const currentQ = this.getQValue(state, action);
    
    if (done) {
      // 종료 상태의 경우
      const newQ = currentQ + this.learningRate * (reward - currentQ);
      this.setQValue(state, action, newQ);
    } else {
      // 다음 상태의 최대 Q값
      const nextQ = this.getQValue(nextState, this.getBestAction(nextState));
      const targetQ = reward + this.gamma * nextQ;
      const newQ = currentQ + this.learningRate * (targetQ - currentQ);
      this.setQValue(state, action, newQ);
    }
    
    // Epsilon 감소
    if (this.epsilon > this.epsilonMin) {
      this.epsilon *= this.epsilonDecay;
    }
  }
  
  save() {
    const data = {
      qTable: Array.from(this.qTable.entries()),
      learningRate: this.learningRate,
      gamma: this.gamma,
      epsilon: this.epsilon,
      epsilonDecay: this.epsilonDecay,
      epsilonMin: this.epsilonMin
    };
    return data;
  }
  
  load(data) {
    this.qTable = new Map(data.qTable);
    this.learningRate = data.learningRate;
    this.gamma = data.gamma;
    this.epsilon = data.epsilon;
    this.epsilonDecay = data.epsilonDecay;
    this.epsilonMin = data.epsilonMin;
  }
  
  // Q-table 통계 정보
  getStats() {
    const states = this.qTable.size;
    let totalQValues = 0;
    let maxQValue = -Infinity;
    let minQValue = Infinity;
    
    for (const [stateKey, qValues] of this.qTable) {
      totalQValues += qValues.length;
      for (const qValue of qValues) {
        maxQValue = Math.max(maxQValue, qValue);
        minQValue = Math.min(minQValue, qValue);
      }
    }
    
    return {
      states: states,
      totalQValues: totalQValues,
      maxQValue: maxQValue,
      minQValue: minQValue,
      epsilon: this.epsilon
    };
  }
}
