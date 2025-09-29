// 미로 찾기 환경 구현
export class Maze {
  constructor(size = 8) {
    this.size = size;
    this.maze = [];
    this.start = { x: 0, y: 0 };
    this.goal = { x: size - 1, y: size - 1 };
    this.agent = { x: 0, y: 0 };
    this.path = []; // 에이전트의 이동 경로
    this.actions = [
      { name: 'up', dx: 0, dy: -1 },
      { name: 'right', dx: 1, dy: 0 },
      { name: 'down', dx: 0, dy: 1 },
      { name: 'left', dx: -1, dy: 0 }
    ];
    
    this.generateMaze();
  }
  
  generateMaze() {
    // 빈 미로 생성 (모든 셀이 통로)
    this.maze = Array(this.size).fill().map(() => Array(this.size).fill(0));
    
    // 벽 생성 (간단한 패턴)
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        // 경계는 벽으로
        if (x === 0 || x === this.size - 1 || y === 0 || y === this.size - 1) {
          this.maze[y][x] = 1;
        }
        // 랜덤하게 일부 셀을 벽으로
        else if (Math.random() < 0.2) {
          this.maze[y][x] = 1;
        }
      }
    }
    
    // 시작점과 목표점은 항상 통로
    this.maze[this.start.y][this.start.x] = 0;
    this.maze[this.goal.y][this.goal.x] = 0;
    
    // 에이전트 위치 초기화
    this.agent = { ...this.start };
  }
  
  reset() {
    this.agent = { ...this.start };
    this.path = [{ ...this.start }]; // 경로 초기화
    return this.getState();
  }
  
  getState() {
    // 현재 상태를 1차원 배열로 반환 (위치 정보)
    return [this.agent.x, this.agent.y];
  }
  
  step(action) {
    const actionInfo = this.actions[action];
    const newX = this.agent.x + actionInfo.dx;
    const newY = this.agent.y + actionInfo.dy;
    
    let reward = -0.01; // 기본 페널티 (시간 소모)
    let done = false;
    let info = {};
    
    // 경계 체크
    if (newX < 0 || newX >= this.size || newY < 0 || newY >= this.size) {
      reward = -1; // 벽에 부딪힘
      info = { hitWall: true };
      return [this.getState(), reward, done, info];
    }
    
    // 벽 체크
    if (this.maze[newY][newX] === 1) {
      reward = -1; // 벽에 부딪힘
      info = { hitWall: true };
      return [this.getState(), reward, done, info];
    }
    
    // 에이전트 이동
    this.agent.x = newX;
    this.agent.y = newY;
    
    // 경로에 현재 위치 추가
    this.path.push({ x: newX, y: newY });
    
    // 목표 도달 체크
    if (this.agent.x === this.goal.x && this.agent.y === this.goal.y) {
      reward = 10; // 목표 도달
      done = true;
      info = { success: true };
    }
    
    return [this.getState(), reward, done, info];
  }
  
  render(canvas, ctx) {
    const cellSize = Math.min(canvas.width, canvas.height) / this.size;
    const offsetX = (canvas.width - this.size * cellSize) / 2;
    const offsetY = (canvas.height - this.size * cellSize) / 2;
    
    // 캔버스 클리어
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 미로 그리기
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        const cellX = offsetX + x * cellSize;
        const cellY = offsetY + y * cellSize;
        
        if (this.maze[y][x] === 1) {
          // 벽
          ctx.fillStyle = '#2d3748';
          ctx.fillRect(cellX, cellY, cellSize, cellSize);
        } else {
          // 통로
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(cellX, cellY, cellSize, cellSize);
          ctx.strokeStyle = '#e2e8f0';
          ctx.strokeRect(cellX, cellY, cellSize, cellSize);
        }
      }
    }
    
    // 이동 경로 그리기 (최근 20개 스텝만)
    if (this.path.length > 1) {
      const recentPath = this.path.slice(-20);
      ctx.strokeStyle = '#4299e1';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      
      for (let i = 0; i < recentPath.length; i++) {
        const pos = recentPath[i];
        const x = offsetX + pos.x * cellSize + cellSize / 2;
        const y = offsetY + pos.y * cellSize + cellSize / 2;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }
    
    // 시작점과 목표점 다시 그리기 (경로 위에)
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        const cellX = offsetX + x * cellSize;
        const cellY = offsetY + y * cellSize;
        
        // 시작점
        if (x === this.start.x && y === this.start.y) {
          ctx.fillStyle = '#48bb78';
          ctx.fillRect(cellX + 2, cellY + 2, cellSize - 4, cellSize - 4);
          // 시작점 라벨
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('S', cellX + cellSize/2, cellY + cellSize/2 + 4);
        }
        
        // 목표점
        if (x === this.goal.x && y === this.goal.y) {
          ctx.fillStyle = '#f56565';
          ctx.fillRect(cellX + 2, cellY + 2, cellSize - 4, cellSize - 4);
          // 목표점 라벨
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('G', cellX + cellSize/2, cellY + cellSize/2 + 4);
        }
      }
    }
    
    // 에이전트 (현재 위치)
    const agentX = offsetX + this.agent.x * cellSize + cellSize / 2;
    const agentY = offsetY + this.agent.y * cellSize + cellSize / 2;
    
    // 에이전트 배경 원
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(agentX, agentY, cellSize/2.5, 0, 2 * Math.PI);
    ctx.fill();
    
    // 에이전트 그림자
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.arc(agentX + 2, agentY + 2, cellSize/3, 0, 2 * Math.PI);
    ctx.fill();
    
    // 에이전트 메인
    ctx.fillStyle = '#4299e1';
    ctx.beginPath();
    ctx.arc(agentX, agentY, cellSize/3, 0, 2 * Math.PI);
    ctx.fill();
    
    // 에이전트 하이라이트
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(agentX - cellSize/8, agentY - cellSize/8, cellSize/8, 0, 2 * Math.PI);
    ctx.fill();
    
    // 에이전트 테두리
    ctx.strokeStyle = '#2d3748';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(agentX, agentY, cellSize/3, 0, 2 * Math.PI);
    ctx.stroke();
  }
  
  // 최단 경로 계산 (BFS)
  findShortestPath() {
    const queue = [{ x: this.start.x, y: this.start.y, path: [] }];
    const visited = new Set();
    const directions = [
      { dx: 0, dy: -1 }, { dx: 1, dy: 0 },
      { dx: 0, dy: 1 }, { dx: -1, dy: 0 }
    ];
    
    while (queue.length > 0) {
      const { x, y, path } = queue.shift();
      const key = `${x},${y}`;
      
      if (visited.has(key)) continue;
      visited.add(key);
      
      if (x === this.goal.x && y === this.goal.y) {
        return path.length;
      }
      
      for (const dir of directions) {
        const newX = x + dir.dx;
        const newY = y + dir.dy;
        
        if (newX >= 0 && newX < this.size && 
            newY >= 0 && newY < this.size && 
            this.maze[newY][newX] === 0) {
          queue.push({ x: newX, y: newY, path: [...path, { x, y }] });
        }
      }
    }
    
    return -1; // 경로를 찾을 수 없음
  }
}
