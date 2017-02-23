class Ball {
    constructor() {
        let self = this;
        this.radius = 5;
        this.diameter = this.radius * 2;
        this.pos = [0, 0];
    }
    launch(h0, x0, v0x, v0y) {
        this.moving = true;
        this.pos = [x0, h0];
        this.h01 = h0;
        this.x0 = x0;
        this.v0y1 = v0y;
        this.v0x = v0x;
        this.time = 0;
        if(this.v0y1 <= 0) {
            this.v0y2 = this.v0y1;
            this.h02 = h0;
            this.tmax = 0;
        } else {
            this.D = Math.atan(Math.sqrt(this.q / this.g) * this.v0y1);
            this.tmax = this.D / Math.sqrt(this.q * this.g);
            this.v0y2 = 0;
            this.h02 = this.getHeight(this.tmax);
        }
        this.signVx = Math.sign(this.v0x);
        this.C = Math.abs((this.v0y2 - Math.sqrt(this.g / this.q)) / (this.v0y2 + Math.sqrt(this.g / this.q)));
        this.alpha = 2*Math.sqrt(this.q * this.g);
        let signVx = this.signVx; // For use in function below
        this.walls.sort(function (a, b) {
            return (a[0] - b[0]) * signVx;
        });

        let est = (this.v0y1 + Math.sqrt(Math.pow(this.v0y1, 2) + 2*this.g*this.h01)) / this.g;
        let side = (1 - this.signVx) / 2; // 0 (left side of wall) if we're moving right, 1 (right side) if we're moving left
        for(let i = 0; i < this.walls.length; i++) {
            let top = this.walls[i][2] + this.realRadius;
            let tAtTop = this.getTimeFromHeight(top, est);
            let rAtTop = this.getRange(tAtTop);
            if(tAtTop > 0 && rAtTop > this.walls[i][0] && rAtTop < this.walls[i][1]) {
                // bounce off of top of wall
                let yvel = -this.getYVelocity(tAtTop);
                let xvel = this.getXVelocity(tAtTop);
                this.nextLaunch = [top, rAtTop, xvel, yvel];
                this.tend = tAtTop;
                return 0;
            }

            let edgeX = this.walls[i][side] - this.signVx * this.realRadius;
            let tAtWall = this.getTimeFromRange(edgeX);
            let hAtWall = this.getHeight(tAtWall);
            if(tAtWall > 0 && hAtWall > 0 && hAtWall < this.walls[i][2]) {
                let yvel = this.getYVelocity(tAtWall);
                let xvel = -this.getXVelocity(tAtWall);
                this.nextLaunch = [hAtWall, edgeX, xvel, yvel];
                this.tend = tAtWall;
                return 0;
            }
        }
        this.tend = this.getTimeFromHeight(0, est);
        this.nextLaunch = undefined;

        let vxf = this.getXVelocity(this.tend);
        let vyf = this.getYVelocity(this.tend);
        let vf = Math.sqrt(Math.pow(vxf, 2) + Math.pow(vyf, 2));
        let theta1 = Math.atan(Math.abs(vxf/vyf));

        if(vf <= 20) {
            var rest = 0.510 - 0.0375*vf + 0.000903*Math.pow(vf, 2);
        } else {
            var rest = 0.12;
        }
        let thetac = 15.4*vf*theta1/(18.6*44.4);
        if(thetac > 0.017) {
            this.nextLaunch = [0, this.getRange(this.tend), Math.sign(vxf)*vf*rest*Math.cos(thetac), vf*rest*Math.sin(thetac)];
        }
    }
    getHeight(time) {
        if(time <= this.tmax) {
            return this.h01 + Math.log(Math.abs(Math.cos(this.D - time*Math.sqrt(this.q*this.g)) / Math.cos(this.D))) / this.q;
        } else {
            let deltat = time - this.tmax;
            let value = this.h02 + Math.sqrt(this.g / this.q) * (deltat + 2 / this.alpha * Math.log((1 + this.C)/(1 + this.C*Math.exp(this.alpha*deltat))));
            return value;
        }
    }
    getRange(time) {
        return this.x0 + this.signVx * Math.log(Math.abs(-this.v0x*this.signVx*this.q*time - 1)) / this.q;
    }
    getTimeFromRange(range) {
        return (Math.exp(this.signVx * (range - this.x0) * this.q) - 1) / (Math.abs(this.v0x) * this.q);
    }
    getTimeFromHeight(height, guess) {
        // NOTE: this only finds the time when the ball is going down, as it's irrelevant going up in all cases so far. If a ceiling is added, life is gonna suck
        let est = guess - this.tmax;
        for(let i = 0; i < 14; i++) {
            let v = Math.sqrt(this.g / this.q) * (1 - this.C*Math.exp(this.alpha*est)) / (1 + this.C*Math.exp(this.alpha*est));
            let h = this.getHeight(est + this.tmax) - height;
            est -= h / v;
        }
        return est + this.tmax;
    }
    getXVelocity(time) {
        return this.v0x / (1 + Math.abs(this.v0x) * this.q * time);
    }
    getYVelocity(time) {
        if(time <= this.tmax) {
            return Math.sqrt(this.g/this.q) * Math.tan(this.D - time * Math.sqrt(this.q * this.g));
        } else {
            return Math.sqrt(this.g/this.q) * (1 - this.C*Math.exp(this.alpha*(time - this.tmax))) / (1 + this.C * Math.exp(this.alpha * (time - this.tmax)));
        }
    }
    getNetVelocity(time) {
        return Math.sqrt(Math.pow(this.getXVelocity(time), 2) + Math.pow(this.getYVelocity(time), 2));
    }
    update(dt) {
        this.time += dt;
        if(this.time < this.tend) {
            this.pos[1] = this.getHeight(this.time);
            this.pos[0] = this.getRange(this.time);
        } else if (!isNaN(this.time)) {
            if(this.nextLaunch) {
                this.launch.apply(this, this.nextLaunch);
            } else {
                this.pos[1] = 0;
                this.pos[0] = this.getRange(this.tend);
                this.time = NaN;
            }
        }
    }
}
Ball.prototype.realRadius = 0.02135;
//                  Cd        p                             A                                     m
Ball.prototype.q = (0.5) * (1.225) * (Math.PI * Math.pow(Ball.prototype.realRadius, 2)) / (2 * 0.04593);
Ball.prototype.g = 9.80665;
Ball.prototype.moving = false;
