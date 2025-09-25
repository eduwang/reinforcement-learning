// CartPole 환경 구현
export class CartPole {
  constructor() {
    this.gravity = 9.8;
    this.masscart = 1.0;
    this.masspole = 0.1;
    this.total_mass = this.masspole + this.masscart;
    this.length = 0.5; // 실제 pole length
    this.polemass_length = this.masspole * this.length;
    this.force_mag = 10.0;
    this.tau = 0.02; // seconds between state updates
    this.kinematics_integrator = 'euler';
    
    // Angle at which to fail the episode
    this.theta_threshold_radians = 12 * 2 * Math.PI / 360;
    this.x_threshold = 2.4;
    
    this.reset();
  }
  
  reset() {
    this.state = [
      Math.random() * 0.1 - 0.05, // x
      0, // x_dot
      Math.random() * 0.1 - 0.05, // theta
      0  // theta_dot
    ];
    this.steps_beyond_done = null;
    return [...this.state];
  }
  
  step(action) {
    const [x, x_dot, theta, theta_dot] = this.state;
    const force = action === 1 ? this.force_mag : -this.force_mag;
    const costheta = Math.cos(theta);
    const sintheta = Math.sin(theta);
    
    const temp = (force + this.polemass_length * theta_dot * theta_dot * sintheta) / this.total_mass;
    const thetaacc = (this.gravity * sintheta - costheta * temp) / (this.length * (4.0/3.0 - this.masspole * costheta * costheta / this.total_mass));
    const xacc = temp - this.polemass_length * thetaacc * costheta / this.total_mass;
    
    if (this.kinematics_integrator === 'euler') {
      this.state[0] = x + this.tau * x_dot;
      this.state[1] = x_dot + this.tau * xacc;
      this.state[2] = theta + this.tau * theta_dot;
      this.state[3] = theta_dot + this.tau * thetaacc;
    } else {
      // Runge-Kutta integration
      const x_dot_new = x_dot + this.tau * xacc;
      const theta_dot_new = theta_dot + this.tau * thetaacc;
      this.state[0] = x + this.tau * x_dot_new;
      this.state[1] = x_dot_new;
      this.state[2] = theta + this.tau * theta_dot_new;
      this.state[3] = theta_dot_new;
    }
    
    const done = this.state[0] < -this.x_threshold || 
                 this.state[0] > this.x_threshold ||
                 this.state[2] < -this.theta_threshold_radians ||
                 this.state[2] > this.theta_threshold_radians;
    
    if (!done) {
      this.steps_beyond_done = null;
      return [this.state, 1.0, false, {}];
    } else if (this.steps_beyond_done === null) {
      this.steps_beyond_done = 0;
      return [this.state, 1.0, true, {}];
    } else {
      this.steps_beyond_done += 1;
      return [this.state, 0.0, true, {}];
    }
  }
  
  render(canvas, ctx) {
    const [x, x_dot, theta, theta_dot] = this.state;
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, width, height);
    
    // Scale factors
    const scale = 200;
    const cart_x = width / 2 + x * scale;
    const cart_y = height - 50;
    
    // Draw track
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, cart_y);
    ctx.lineTo(width, cart_y);
    ctx.stroke();
    
    // Draw cart
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(cart_x - 25, cart_y - 15, 50, 30);
    
    // Draw pole
    const pole_length = this.length * scale;
    const pole_x = cart_x + pole_length * Math.sin(theta);
    const pole_y = cart_y - pole_length * Math.cos(theta);
    
    ctx.strokeStyle = '#FF5722';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cart_x, cart_y);
    ctx.lineTo(pole_x, pole_y);
    ctx.stroke();
    
    // Draw pole tip
    ctx.fillStyle = '#FF5722';
    ctx.beginPath();
    ctx.arc(pole_x, pole_y, 5, 0, 2 * Math.PI);
    ctx.fill();
  }
}
