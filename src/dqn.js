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
    this.batchSize = 32;
    
    // 하이퍼파라미터
    this.epsilon = 1.0;
    this.epsilonMin = 0.01;
    this.epsilonDecay = 0.995;
    this.gamma = 0.95;
    this.updateTargetFreq = 100;
    this.stepCount = 0;
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
    this.memory.push({ state, action, reward, nextState, done });
    if (this.memory.length > this.memorySize) {
      this.memory.shift();
    }
  }
  
  replay() {
    if (this.memory.length < this.batchSize) {
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
    
    // 타겟 Q 값들
    const targetQValues = nextStates.map(nextState => {
      const result = this.forward(nextState, true);
      return Math.max(...result.output);
    });
    
    // 타겟 계산
    const targets = [];
    for (let i = 0; i < this.batchSize; i++) {
      const target = rewards[i] + (dones[i] ? 0 : this.gamma * targetQValues[i]);
      const currentTarget = [...currentQValues[i]];
      currentTarget[actions[i]] = target;
      targets.push(currentTarget);
    }
    
    // 역전파
    this.backward(states, targets);
    
    // Epsilon 감소
    if (this.epsilon > this.epsilonMin) {
      this.epsilon *= this.epsilonDecay;
    }
    
    // 타겟 네트워크 업데이트
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
    // 간단한 경사 하강법 구현
    const learningRate = this.learningRate;
    
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
      
      // Update weights2
      for (let i = 0; i < this.hiddenSize; i++) {
        for (let j = 0; j < this.outputSize; j++) {
          this.weights2[i][j] -= learningRate * outputGradients[j] * hidden[i];
        }
      }
      
      // Update bias2
      for (let i = 0; i < this.outputSize; i++) {
        this.bias2[i] -= learningRate * outputGradients[i];
      }
      
      // Update weights1
      for (let i = 0; i < this.inputSize; i++) {
        for (let j = 0; j < this.hiddenSize; j++) {
          this.weights1[i][j] -= learningRate * hiddenGradients[j] * state[i];
        }
      }
      
      // Update bias1
      for (let i = 0; i < this.hiddenSize; i++) {
        this.bias1[i] -= learningRate * hiddenGradients[i];
      }
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
