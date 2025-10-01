// 미로 찾기 환경 구현
export class Maze {
  constructor(size = 8) {
    this.size = size;
    this.maze = [];
    this.start = { x: 1, y: 1 };
    this.goal = { x: size - 2, y: size - 2 };
    this.agent = { x: 1, y: 1 };
    this.path = []; // 에이전트의 전체 이동 경로
    this.visitedCells = new Map(); // 방문한 셀과 방문 횟수
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
    
    // 외곽 벽 생성
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        if (x === 0 || x === this.size - 1 || y === 0 || y === this.size - 1) {
          this.maze[y][x] = 1;
        }
      }
    }
    
    // 내부 벽 생성 (더 구조화된 패턴)
    // 가로 벽
    for (let y = 2; y < this.size - 1; y += 3) {
      for (let x = 1; x < this.size - 1; x++) {
        if (Math.random() > 0.3) { // 70% 확률로 벽 생성
          this.maze[y][x] = 1;
        }
      }
      // 각 가로벽에 최소 1개의 구멍 만들기
      const holeX = Math.floor(Math.random() * (this.size - 2)) + 1;
      this.maze[y][holeX] = 0;
    }
    
    // 세로 벽
    for (let x = 2; x < this.size - 1; x += 3) {
      for (let y = 1; y < this.size - 1; y++) {
        if (Math.random() > 0.3 && this.maze[y][x] === 0) {
          this.maze[y][x] = 1;
        }
      }
      // 각 세로벽에 최소 1개의 구멍 만들기
      const holeY = Math.floor(Math.random() * (this.size - 2)) + 1;
      this.maze[holeY][x] = 0;
    }
    
    // 시작점과 목표점은 항상 통로
    this.maze[this.start.y][this.start.x] = 0;
    this.maze[this.goal.y][this.goal.x] = 0;
    
    // 시작점 주변 확보
    this.maze[this.start.y][this.start.x + 1] = 0;
    this.maze[this.start.y + 1][this.start.x] = 0;
    
    // 목표점 주변 확보
    this.maze[this.goal.y][this.goal.x - 1] = 0;
    this.maze[this.goal.y - 1][this.goal.x] = 0;
    
    // 경로가 존재하는지 확인하고, 없으면 재생성
    if (this.findShortestPath() === -1) {
      this.generateMaze(); // 재귀적으로 다시 생성
    }
    
    // 에이전트 위치 초기화
    this.agent = { ...this.start };
  }
  
  reset() {
    this.agent = { ...this.start };
    this.path = [{ ...this.start }]; // 경로 초기화
    this.visitedCells.clear(); // 방문 기록 초기화
    this.visitedCells.set(`${this.start.x},${this.start.y}`, 1);
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
    
    // 방문 횟수 업데이트
    const cellKey = `${newX},${newY}`;
    this.visitedCells.set(cellKey, (this.visitedCells.get(cellKey) || 0) + 1);
    
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
    
    // 배경 그리기 (그라데이션)
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#1a202c');
    gradient.addColorStop(1, '#2d3748');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 방문 히트맵 그리기 (방문 횟수에 따라 색상 변화)
    const maxVisits = Math.max(...Array.from(this.visitedCells.values()), 1);
    for (const [key, visits] of this.visitedCells) {
      const [x, y] = key.split(',').map(Number);
      const cellX = offsetX + x * cellSize;
      const cellY = offsetY + y * cellSize;
      
      // 방문 횟수에 따른 투명도 (많이 방문할수록 진하게)
      const alpha = Math.min(visits / maxVisits * 0.4, 0.4);
      ctx.fillStyle = `rgba(139, 92, 246, ${alpha})`;
      ctx.fillRect(cellX + 1, cellY + 1, cellSize - 2, cellSize - 2);
    }
    
    // 미로 그리기
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        const cellX = offsetX + x * cellSize;
        const cellY = offsetY + y * cellSize;
        
        if (this.maze[y][x] === 1) {
          // 벽 - 입체감 있는 디자인
          // 벽 메인
          ctx.fillStyle = '#1a202c';
          ctx.fillRect(cellX, cellY, cellSize, cellSize);
          
          // 벽 테두리 (밝은 부분)
          ctx.strokeStyle = '#4a5568';
          ctx.lineWidth = 2;
          ctx.strokeRect(cellX + 1, cellY + 1, cellSize - 2, cellSize - 2);
          
          // 벽 하이라이트
          ctx.strokeStyle = '#2d3748';
          ctx.lineWidth = 1;
          ctx.strokeRect(cellX + 2, cellY + 2, cellSize - 4, cellSize - 4);
        } else {
          // 통로 - 깔끔한 그리드
          ctx.fillStyle = '#e2e8f0';
          ctx.fillRect(cellX, cellY, cellSize, cellSize);
          
          // 그리드 선
          ctx.strokeStyle = '#cbd5e0';
          ctx.lineWidth = 1;
          ctx.strokeRect(cellX, cellY, cellSize, cellSize);
        }
      }
    }
    
    // 이동 경로 그리기 (전체 경로, 페이드 효과)
    if (this.path.length > 1) {
      const pathLength = this.path.length;
      const showLength = Math.min(pathLength, 50); // 최근 50개 스텝만
      const startIdx = Math.max(0, pathLength - showLength);
      
      for (let i = startIdx; i < pathLength - 1; i++) {
        const pos = this.path[i];
        const nextPos = this.path[i + 1];
        
        // 최근 경로일수록 진하게
        const alpha = (i - startIdx) / showLength;
        const lineWidth = 2 + alpha * 2;
        
        ctx.strokeStyle = `rgba(59, 130, 246, ${0.3 + alpha * 0.5})`;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(
          offsetX + pos.x * cellSize + cellSize / 2,
          offsetY + pos.y * cellSize + cellSize / 2
        );
        ctx.lineTo(
          offsetX + nextPos.x * cellSize + cellSize / 2,
          offsetY + nextPos.y * cellSize + cellSize / 2
        );
        ctx.stroke();
      }
    }
    
    // 시작점 그리기
    const startX = offsetX + this.start.x * cellSize;
    const startY = offsetY + this.start.y * cellSize;
    
    // 시작점 배경 (펄스 효과)
    ctx.fillStyle = 'rgba(72, 187, 120, 0.2)';
    ctx.fillRect(startX, startY, cellSize, cellSize);
    
    // 시작점 아이콘
    ctx.fillStyle = '#48bb78';
    ctx.beginPath();
    ctx.arc(startX + cellSize/2, startY + cellSize/2, cellSize/3, 0, 2 * Math.PI);
    ctx.fill();
    
    // 시작점 라벨
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.floor(cellSize/2.5)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('S', startX + cellSize/2, startY + cellSize/2);
    
    // 목표점 그리기
    const goalX = offsetX + this.goal.x * cellSize;
    const goalY = offsetY + this.goal.y * cellSize;
    
    // 목표점 배경 (글로우 효과)
    ctx.fillStyle = 'rgba(245, 101, 101, 0.2)';
    ctx.fillRect(goalX, goalY, cellSize, cellSize);
    
    // 목표점 아이콘 (별 모양)
    ctx.fillStyle = '#f56565';
    ctx.beginPath();
    const centerX = goalX + cellSize/2;
    const centerY = goalY + cellSize/2;
    const outerRadius = cellSize/3;
    const innerRadius = cellSize/6;
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI / 5) - Math.PI/2;
      const x = centerX + Math.cos(angle) * outerRadius;
      const y = centerY + Math.sin(angle) * outerRadius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      
      const innerAngle = angle + (2 * Math.PI / 5);
      const innerX = centerX + Math.cos(innerAngle) * innerRadius;
      const innerY = centerY + Math.sin(innerAngle) * innerRadius;
      ctx.lineTo(innerX, innerY);
    }
    ctx.closePath();
    ctx.fill();
    
    // 목표점 라벨
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.floor(cellSize/3)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('G', centerX, centerY);
    
    // 에이전트 그리기 (현재 위치)
    const agentX = offsetX + this.agent.x * cellSize + cellSize / 2;
    const agentY = offsetY + this.agent.y * cellSize + cellSize / 2;
    
    // 에이전트 글로우 효과
    const glowGradient = ctx.createRadialGradient(agentX, agentY, 0, agentX, agentY, cellSize/2);
    glowGradient.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
    glowGradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(agentX, agentY, cellSize/2, 0, 2 * Math.PI);
    ctx.fill();
    
    // 에이전트 그림자
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.arc(agentX + 2, agentY + 2, cellSize/3.5, 0, 2 * Math.PI);
    ctx.fill();
    
    // 에이전트 메인 (그라데이션)
    const agentGradient = ctx.createRadialGradient(
      agentX - cellSize/8, agentY - cellSize/8, 0,
      agentX, agentY, cellSize/3
    );
    agentGradient.addColorStop(0, '#60a5fa');
    agentGradient.addColorStop(1, '#3b82f6');
    ctx.fillStyle = agentGradient;
    ctx.beginPath();
    ctx.arc(agentX, agentY, cellSize/3.5, 0, 2 * Math.PI);
    ctx.fill();
    
    // 에이전트 테두리
    ctx.strokeStyle = '#1e40af';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(agentX, agentY, cellSize/3.5, 0, 2 * Math.PI);
    ctx.stroke();
    
    // 에이전트 하이라이트
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(agentX - cellSize/10, agentY - cellSize/10, cellSize/10, 0, 2 * Math.PI);
    ctx.fill();
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
