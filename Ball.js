let ttotes = 0;
class Ball {
    constructor() {
        let self = this;
        this.image = document.createElement("canvas");
        let tempCx = this.image.getContext("2d");
        this.radius = 5;
        this.diameter = this.radius * 2;
        this.pos = [0, 0];
        this.image.setAttribute("width", this.radius * 2);
        this.image.setAttribute("height", this.radius * 2);
        tempCx.beginPath();
        tempCx.arc(this.radius, this.radius, this.radius - 1, 0, 2*Math.PI);
        tempCx.fillStyle = "white";
        tempCx.fill();
        tempCx.stroke();
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
        let signVx = this.signVx;
        this.walls.sort(function (a, b) {
            return (a[0] - b[0]) * signVx;
        });

        for(let i = 0; i < this.walls.length; i++) {
            let edgeX = this.walls[i][0] - this.signVx * this.realRadius;
            let tAtWall = this.getTimeFromRange(edgeX);
            let hAtWall = this.getHeight(tAtWall);
            if(tAtWall > 0 && hAtWall > 0 && hAtWall < this.walls[i][1]) {
                let yvel = this.getYVelocity(tAtWall);
                let xvel = -this.getXVelocity(tAtWall);
                this.nextLaunch = [hAtWall, edgeX, xvel, yvel];
                this.tend = tAtWall;
                ttotes += this.tend;
                return 0;
            }
        }
        let est = (this.v0y1 + Math.sqrt(Math.pow(this.v0y1, 2) + 2*this.g*this.h01)) / this.g;
        for(let i = 0; i < 14; i++) {
            let v = Math.sqrt(this.g / this.q) * (1 - this.C*Math.exp(this.alpha*est)) / (1 + this.C*Math.exp(this.alpha*est));
            let h = this.getHeight(est + this.tmax);
            est -= h / v;
        }
        this.nextLaunch = undefined;
        this.tend = est + this.tmax;
        ttotes += this.tend;
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
            //

            } else {
                this.pos[1] = 0;
                this.pos[0] = this.getRange(this.tend);
                this.time = NaN;
            }
        }
    }
}
Ball.prototype.realRadius = 0.0427;
//                  Cd        p                             A                                     m
Ball.prototype.q = (0.5) * (1.225) * (Math.PI * Math.pow(Ball.prototype.realRadius, 2)) / (2 * 0.04593);
Ball.prototype.g = 9.80665;
Ball.prototype.moving = false;
