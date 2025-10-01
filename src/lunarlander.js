// Lunar Lander 환경 구현
export class LunarLander {
  constructor() {
    // 환경 설정
    this.width = 400;
    this.height = 300;
    this.gravity = 0.15;
    
    // 착륙 패드
    this.landingPadY = this.height - 30;
    this.landingPadLeft = this.width / 2 - 40;
    this.landingPadRight = this.width / 2 + 40;
    
    // 우주선 초기 설정
    this.shipWidth = 20;
    this.shipHeight = 30;
    
    this.reset();
  }
  
  reset() {
    // 초기 상태 (상단 중앙에서 시작)
    this.x = this.width / 2;
    this.y = 50;
    this.vx = (Math.random() - 0.5) * 2; // -1 ~ 1
    this.vy = 0;
    this.angle = 0;
    this.angularVelocity = (Math.random() - 0.5) * 0.1;
    this.fuel = 100;
    
    // 다리 접촉 상태
    this.leftLegContact = false;
    this.rightLegContact = false;
    
    // 엔진 상태 (렌더링용)
    this.mainEngine = false;
    this.leftEngine = false;
    this.rightEngine = false;
    
    return this.getState();
  }
  
  getState() {
    // 8차원 상태 벡터
    return [
      (this.x - this.width / 2) / this.width, // 정규화된 x 위치
      (this.y - this.height / 2) / this.height, // 정규화된 y 위치
      this.vx / 10, // 정규화된 x 속도
      this.vy / 10, // 정규화된 y 속도
      this.angle / Math.PI, // 정규화된 각도
      this.angularVelocity, // 각속도
      this.leftLegContact ? 1 : 0,
      this.rightLegContact ? 1 : 0
    ];
  }
  
  step(action) {
    // 액션: 0=nothing, 1=left engine, 2=main engine, 3=right engine
    
    // 엔진 상태 초기화
    this.mainEngine = false;
    this.leftEngine = false;
    this.rightEngine = false;
    
    let reward = 0;
    
    // 액션 적용
    if (this.fuel > 0) {
      if (action === 1) {
        // 왼쪽 엔진 (오른쪽으로 회전)
        this.angularVelocity += 0.05;
        this.fuel -= 0.3;
        this.leftEngine = true;
        reward -= 0.03;
      } else if (action === 2) {
        // 메인 엔진 (위로 추진)
        const thrust = 0.3;
        this.vx += Math.sin(this.angle) * thrust;
        this.vy -= Math.cos(this.angle) * thrust;
        this.fuel -= 0.5;
        this.mainEngine = true;
        reward -= 0.03;
      } else if (action === 3) {
        // 오른쪽 엔진 (왼쪽으로 회전)
        this.angularVelocity -= 0.05;
        this.fuel -= 0.3;
        this.rightEngine = true;
        reward -= 0.03;
      }
    }
    
    // 물리 업데이트
    this.vy += this.gravity; // 중력
    this.x += this.vx;
    this.y += this.vy;
    this.angle += this.angularVelocity;
    
    // 각속도 감쇠
    this.angularVelocity *= 0.95;
    
    // 다리 접촉 확인
    const leftLegX = this.x - Math.cos(this.angle) * 10;
    const leftLegY = this.y + this.shipHeight / 2;
    const rightLegX = this.x + Math.cos(this.angle) * 10;
    const rightLegY = this.y + this.shipHeight / 2;
    
    this.leftLegContact = false;
    this.rightLegContact = false;
    
    let done = false;
    let info = {};
    
    // 착륙 패드 충돌 확인
    if (leftLegY >= this.landingPadY && leftLegX >= this.landingPadLeft && leftLegX <= this.landingPadRight) {
      this.leftLegContact = true;
    }
    if (rightLegY >= this.landingPadY && rightLegX >= this.landingPadLeft && rightLegX <= this.landingPadRight) {
      this.rightLegContact = true;
    }
    
    // 성공적인 착륙
    if (this.leftLegContact && this.rightLegContact) {
      const speedPenalty = Math.abs(this.vx) + Math.abs(this.vy);
      const anglePenalty = Math.abs(this.angle);
      
      if (speedPenalty < 1.5 && anglePenalty < 0.3) {
        reward += 100; // 완벽한 착륙
        done = true;
        info = { success: true, landing: 'perfect' };
      } else if (speedPenalty < 3 && anglePenalty < 0.5) {
        reward += 50; // 거친 착륙
        done = true;
        info = { success: true, landing: 'rough' };
      } else {
        reward -= 100; // 추락
        done = true;
        info = { success: false, landing: 'crash' };
      }
    }
    
    // 화면 밖으로 나가거나 지면 충돌
    if (this.x < 0 || this.x > this.width || this.y < 0) {
      reward -= 100;
      done = true;
      info = { success: false, reason: 'out_of_bounds' };
    } else if (this.y >= this.height - 10 && !this.leftLegContact && !this.rightLegContact) {
      reward -= 100;
      done = true;
      info = { success: false, reason: 'crash' };
    }
    
    // 매 스텝마다 작은 보상 (생존)
    if (!done) {
      reward += 0.1;
      // 착륙 패드 가까이 있으면 보너스
      const distToCenter = Math.abs(this.x - this.width / 2);
      reward += (1 - distToCenter / this.width) * 0.05;
    }
    
    return [this.getState(), reward, done, info];
  }
  
  render(canvas, ctx) {
    // 배경 (우주)
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#000428');
    gradient.addColorStop(1, '#004e92');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 별들
    ctx.fillStyle = 'white';
    for (let i = 0; i < 50; i++) {
      const x = (i * 37) % canvas.width;
      const y = (i * 73) % (canvas.height - 50);
      ctx.fillRect(x, y, 2, 2);
    }
    
    // 지면
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, this.landingPadY + 20, canvas.width, canvas.height);
    
    // 착륙 패드
    ctx.fillStyle = '#32CD32';
    ctx.fillRect(this.landingPadLeft, this.landingPadY, 
                 this.landingPadRight - this.landingPadLeft, 5);
    
    // 착륙 패드 마커
    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.landingPadLeft, this.landingPadY);
    ctx.lineTo(this.landingPadLeft - 5, this.landingPadY + 10);
    ctx.moveTo(this.landingPadRight, this.landingPadY);
    ctx.lineTo(this.landingPadRight + 5, this.landingPadY + 10);
    ctx.stroke();
    
    // 우주선
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    
    // 우주선 본체
    ctx.fillStyle = '#C0C0C0';
    ctx.beginPath();
    ctx.moveTo(0, -this.shipHeight / 2);
    ctx.lineTo(-this.shipWidth / 2, this.shipHeight / 2);
    ctx.lineTo(this.shipWidth / 2, this.shipHeight / 2);
    ctx.closePath();
    ctx.fill();
    
    // 우주선 윈도우
    ctx.fillStyle = '#4169E1';
    ctx.beginPath();
    ctx.arc(0, -5, 5, 0, Math.PI * 2);
    ctx.fill();
    
    // 다리
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 3;
    
    // 왼쪽 다리
    ctx.beginPath();
    ctx.moveTo(-this.shipWidth / 2, this.shipHeight / 2);
    ctx.lineTo(-this.shipWidth / 2 - 5, this.shipHeight / 2 + 8);
    ctx.stroke();
    if (this.leftLegContact) {
      ctx.fillStyle = '#00FF00';
      ctx.fillRect(-this.shipWidth / 2 - 7, this.shipHeight / 2 + 8, 4, 4);
    }
    
    // 오른쪽 다리
    ctx.beginPath();
    ctx.moveTo(this.shipWidth / 2, this.shipHeight / 2);
    ctx.lineTo(this.shipWidth / 2 + 5, this.shipHeight / 2 + 8);
    ctx.stroke();
    if (this.rightLegContact) {
      ctx.fillStyle = '#00FF00';
      ctx.fillRect(this.shipWidth / 2 + 3, this.shipHeight / 2 + 8, 4, 4);
    }
    
    // 엔진 불꽃
    if (this.mainEngine) {
      ctx.fillStyle = '#FFA500';
      ctx.beginPath();
      ctx.moveTo(-5, this.shipHeight / 2);
      ctx.lineTo(0, this.shipHeight / 2 + 15);
      ctx.lineTo(5, this.shipHeight / 2);
      ctx.closePath();
      ctx.fill();
    }
    
    if (this.leftEngine) {
      ctx.fillStyle = '#FFA500';
      ctx.fillRect(-this.shipWidth / 2 - 3, -5, 8, 3);
    }
    
    if (this.rightEngine) {
      ctx.fillStyle = '#FFA500';
      ctx.fillRect(this.shipWidth / 2 - 5, -5, 8, 3);
    }
    
    ctx.restore();
    
    // 연료 게이지
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '12px Arial';
    ctx.fillText(`Fuel: ${this.fuel.toFixed(1)}%`, 10, 20);
    
    // 속도 정보
    ctx.fillText(`VX: ${this.vx.toFixed(2)}`, 10, 40);
    ctx.fillText(`VY: ${this.vy.toFixed(2)}`, 10, 60);
    ctx.fillText(`Angle: ${(this.angle * 180 / Math.PI).toFixed(1)}°`, 10, 80);
  }
}

