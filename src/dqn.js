// DQN (Deep Q-Network) 구현
export class DQN {
  constructor(inputSize = 4, hiddenSize = 128, outputSize = 2, learningRate = 0.001) {
    this.inputSize = inputSize;
    this.hiddenSize = hiddenSize;
    this.outputSize = outputSize;
    this.learningRate = learningRate;
    
    // 네트워크 가중치 초기화
    this.weights1 = this.initializeWeights(inputSize, hiddenSize);
    this.bias1 = new Array(hiddenSize).fill(0);
    this.weights2 = this.initializeWeights(hiddenSize, outputSize);
    this.bias2 = new Array(outputSize).fill(0);
    
    // 타겟 네트워크 (동일한 구조)
    this.targetWeights1 = this.copyWeights(this.weights1);
    this.targetBias1 = [...this.bias1];
    this.targetWeights2 = this.copyWeights(this.weights2);
    this.targetBias2 = [...this.bias2];
    
    // 경험 리플레이 버퍼
    this.memory = [];
    this.memorySize = 10000;
    this.batchSize = 32; // 배치 크기
    this.minMemorySize = 1000; // 최소 메모리 크기 (더 빨리 학습 시작)
    
    // 하이퍼파라미터
    this.epsilon = 1.0;
    this.epsilonMin = 0.05; // 최소 탐험률을 높게 유지
    this.epsilonDecay = 0.998; // 더 천천히 감소 (0.995 -> 0.998)
    this.gamma = 0.99; // 할인율 증가 (장기 보상 중시)
    this.updateTargetFreq = 1000; // 타겟 네트워크 업데이트 빈도
    this.stepCount = 0;
    this.trainingStep = 0;
    
    // 학습 안정성을 위한 추가 파라미터
    this.rewardScale = 0.01; // 보상 스케일링 (1.0 -> 0.01)
  }
  
  initializeWeights(rows, cols) {
    const weights = [];
    const limit = Math.sqrt(6 / (rows + cols));
    for (let i = 0; i < rows; i++) {
      weights[i] = [];
      for (let j = 0; j < cols; j++) {
        weights[i][j] = (Math.random() * 2 - 1) * limit;
      }
    }
    return weights;
  }
  
  copyWeights(weights) {
    return weights.map(row => [...row]);
  }
  
  relu(x) {
    return Math.max(0, x);
  }
  
  reluDerivative(x) {
    return x > 0 ? 1 : 0;
  }
  
  forward(input, isTarget = false) {
    const w1 = isTarget ? this.targetWeights1 : this.weights1;
    const b1 = isTarget ? this.targetBias1 : this.bias1;
    const w2 = isTarget ? this.targetWeights2 : this.weights2;
    const b2 = isTarget ? this.targetBias2 : this.bias2;
    
    // 첫 번째 레이어
    const hidden = [];
    for (let i = 0; i < this.hiddenSize; i++) {
      let sum = b1[i];
      for (let j = 0; j < this.inputSize; j++) {
        sum += input[j] * w1[j][i];
      }
      hidden[i] = this.relu(sum);
    }
    
    // 두 번째 레이어
    const output = [];
    for (let i = 0; i < this.outputSize; i++) {
      let sum = b2[i];
      for (let j = 0; j < this.hiddenSize; j++) {
        sum += hidden[j] * w2[j][i];
      }
      output[i] = sum; // Linear activation for output
    }
    
    return { hidden, output };
  }
  
  predict(state) {
    const result = this.forward(state);
    return result.output;
  }
  
  act(state) {
    if (Math.random() <= this.epsilon) {
      return Math.floor(Math.random() * this.outputSize);
    }
    
    const qValues = this.predict(state);
    return qValues.indexOf(Math.max(...qValues));
  }
  
  remember(state, action, reward, nextState, done) {
    // 보상 스케일링으로 학습 안정화 (큰 보상 값을 작게 만듦)
    const scaledReward = reward * this.rewardScale;
    this.memory.push({ state, action, reward: scaledReward, nextState, done });
    if (this.memory.length > this.memorySize) {
      this.memory.shift();
    }
  }
  
  replay() {
    // 충분한 경험이 쌓일 때까지 학습하지 않음
    if (this.memory.length < this.minMemorySize) {
      return;
    }
    
    const batch = this.sampleBatch();
    const states = batch.map(exp => exp.state);
    const actions = batch.map(exp => exp.action);
    const rewards = batch.map(exp => exp.reward);
    const nextStates = batch.map(exp => exp.nextState);
    const dones = batch.map(exp => exp.done);
    
    // 현재 Q 값들
    const currentQValues = states.map(state => this.predict(state));
    
    // 타겟 Q 값들 (타겟 네트워크 사용)
    const targetQValues = nextStates.map(nextState => {
      const result = this.forward(nextState, true);
      return Math.max(...result.output);
    });
    
    // 타겟 계산
    const targets = [];
    for (let i = 0; i < batch.length; i++) {
      const target = rewards[i] + (dones[i] ? 0 : this.gamma * targetQValues[i]);
      const currentTarget = [...currentQValues[i]];
      currentTarget[actions[i]] = target;
      targets.push(currentTarget);
    }
    
    // 역전파
    this.backward(states, targets);
    
    this.trainingStep++;
    
    // Epsilon 감소 (학습이 시작된 후에만)
    if (this.trainingStep > 100 && this.epsilon > this.epsilonMin) {
      this.epsilon *= this.epsilonDecay;
    }
    
    // 타겟 네트워크 업데이트 (Soft Update)
    this.stepCount++;
    if (this.stepCount % this.updateTargetFreq === 0) {
      this.updateTargetNetwork();
    }
  }
  
  sampleBatch() {
    const batch = [];
    for (let i = 0; i < this.batchSize; i++) {
      const randomIndex = Math.floor(Math.random() * this.memory.length);
      batch.push(this.memory[randomIndex]);
    }
    return batch;
  }
  
  backward(states, targets) {
    // 배치 평균을 사용한 경사 하강법
    const learningRate = this.learningRate; // 학습률
    const gradientClipValue = 10.0; // 그래디언트 클리핑 (더 여유롭게)
    
    // 그래디언트 누적을 위한 배열 초기화
    const gradWeights2 = Array(this.hiddenSize).fill(0).map(() => Array(this.outputSize).fill(0));
    const gradBias2 = Array(this.outputSize).fill(0);
    const gradWeights1 = Array(this.inputSize).fill(0).map(() => Array(this.hiddenSize).fill(0));
    const gradBias1 = Array(this.hiddenSize).fill(0);
    
    for (let batchIdx = 0; batchIdx < states.length; batchIdx++) {
      const state = states[batchIdx];
      const target = targets[batchIdx];
      
      // Forward pass
      const result = this.forward(state);
      const { hidden, output } = result;
      
      // Output layer gradients
      const outputGradients = [];
      for (let i = 0; i < this.outputSize; i++) {
        outputGradients[i] = output[i] - target[i];
      }
      
      // Hidden layer gradients
      const hiddenGradients = [];
      for (let i = 0; i < this.hiddenSize; i++) {
        let sum = 0;
        for (let j = 0; j < this.outputSize; j++) {
          sum += outputGradients[j] * this.weights2[i][j];
        }
        hiddenGradients[i] = sum * this.reluDerivative(hidden[i]);
      }
      
      // 그래디언트 누적
      for (let i = 0; i < this.hiddenSize; i++) {
        for (let j = 0; j < this.outputSize; j++) {
          gradWeights2[i][j] += outputGradients[j] * hidden[i];
        }
      }
      
      for (let i = 0; i < this.outputSize; i++) {
        gradBias2[i] += outputGradients[i];
      }
      
      for (let i = 0; i < this.inputSize; i++) {
        for (let j = 0; j < this.hiddenSize; j++) {
          gradWeights1[i][j] += hiddenGradients[j] * state[i];
        }
      }
      
      for (let i = 0; i < this.hiddenSize; i++) {
        gradBias1[i] += hiddenGradients[i];
      }
    }
    
    // 그래디언트 클리핑 및 가중치 업데이트 (배치 평균 사용)
    const batchSize = states.length;
    
    for (let i = 0; i < this.hiddenSize; i++) {
      for (let j = 0; j < this.outputSize; j++) {
        const avgGrad = gradWeights2[i][j] / batchSize;
        const grad = Math.max(-gradientClipValue, Math.min(gradientClipValue, avgGrad));
        this.weights2[i][j] -= learningRate * grad;
      }
    }
    
    for (let i = 0; i < this.outputSize; i++) {
      const avgGrad = gradBias2[i] / batchSize;
      const grad = Math.max(-gradientClipValue, Math.min(gradientClipValue, avgGrad));
      this.bias2[i] -= learningRate * grad;
    }
    
    for (let i = 0; i < this.inputSize; i++) {
      for (let j = 0; j < this.hiddenSize; j++) {
        const avgGrad = gradWeights1[i][j] / batchSize;
        const grad = Math.max(-gradientClipValue, Math.min(gradientClipValue, avgGrad));
        this.weights1[i][j] -= learningRate * grad;
      }
    }
    
    for (let i = 0; i < this.hiddenSize; i++) {
      const avgGrad = gradBias1[i] / batchSize;
      const grad = Math.max(-gradientClipValue, Math.min(gradientClipValue, avgGrad));
      this.bias1[i] -= learningRate * grad;
    }
  }
  
  updateTargetNetwork() {
    this.targetWeights1 = this.copyWeights(this.weights1);
    this.targetBias1 = [...this.bias1];
    this.targetWeights2 = this.copyWeights(this.weights2);
    this.targetBias2 = [...this.bias2];
  }
  
  save() {
    return {
      weights1: this.weights1,
      bias1: this.bias1,
      weights2: this.weights2,
      bias2: this.bias2,
      epsilon: this.epsilon
    };
  }
  
  load(data) {
    this.weights1 = data.weights1;
    this.bias1 = data.bias1;
    this.weights2 = data.weights2;
    this.bias2 = data.bias2;
    this.epsilon = data.epsilon;
    this.updateTargetNetwork();
  }
}

