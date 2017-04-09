game.ball = {
    stroke: 1,
    location: FAIRWAY,
    // Since the math for the X and Z directions is the same, throughout this object, "R" is used as a stand-in for X or Z when it can be specified by the caller of the function/property
    launch: function(v0lat, angleLat, v0y, spin) {
        this.x0 = this.pos.x;
        this.z0 = this.pos.z;

        this.angleLat = angleLat;
        // Array length, makes life/processing easier
        this.frameTime = 0;
        this.yLast = this.pos.y - 1;
        // Lateral velocity
        this.vLat = v0lat;
        this.sinLat = Math.sin(angleLat);
        this.cosLat = Math.cos(angleLat);
        // Delta t, lower = higher precision and longer swing time
        this.dt = Math.pow(10, -5);
        if(v0y === 0) {
            this.rolling = true;
        } else {
            // Vertical velocity
            this.vY = v0y;
            // Spin decay per iteration
            this.decay = Math.exp(-this.dt/30);
            this.omega = spin * 2 * Math.PI;

            this.xSign = Math.sign(this.cosLat);
            this.xIndex = (1 - this.xSign) / 2;
            this.xCurrent = this.xIndex * (game.tree_xSorted.length - 1);
            while(game.tree_xSorted[this.xCurrent] !== undefined && this.xSign * this.pos.x > this.xSign * game.tree_xSorted[this.xCurrent][this.xIndex]) {
                this.xCurrent += this.xSign;
            }

            this.zSign = Math.sign(this.sinLat);
            this.zIndex = (1 - this.zSign) / 2 + 3;
            this.zCurrent = (this.zIndex - 3) * (game.tree_zSorted.length - 1);
            while(game.tree_zSorted[this.zCurrent] !== undefined && this.zSign * this.pos.z > this.zSign * game.tree_zSorted[this.zCurrent][this.zIndex]) {
                this.zCurrent += this.zSign;
            }
            this.arc = 1;
            this.maxed = false;
        }
        this.time = 0;
        this.moving = true;
    },
    update(dt) {
        if(!this.moving || this.won) {
            // If we're not moving yet or we already won, end
            return 0;
        }
        this.time += dt;
        while(this.frameTime < this.time) { // If we need to update
            // Increase iterative variable
            this.frameTime += this.dt
            if(this.rolling) {
                let a = -5/7*G*PG;
                this.vLat += a * this.dt;
                if(this.vLat < 0) {
                    this.moving = false;
                    this.rolling = false;
                    let range = Math.sqrt(Math.pow(this.pos.x - this.x0, 2) + Math.pow(this.pos.z - this.z0, 2));
                    console.log("Range after rolling: " + range + " m");
                    this.stroke++;
                    break;
                }
                this.pos.x += this.vLat * this.dt * this.cosLat;
                this.pos.z += this.vLat * this.dt * this.sinLat;
                if(Math.sqrt(Math.pow(this.pos.x - game.flagX, 2) + Math.pow(this.pos.z - game.flagZ, 2)) < 0.25) { // real-life radius: 0.053975 m
                    this.won = true;
                    game.poof()
                    setInterval(function() {
                        game.poof();
                    }, 1000);
                    break;
                }
            } else {
                // Net velocity magnitude
                var v = Math.sqrt(Math.pow(this.vY, 2) + Math.pow(this.vLat, 2));
                // Accelerations
                let aY = this.q * v * (this.CL * this.vLat - this.CD * this.vY) - G;
                let aLat = this.q * v * (-this.CL * this.vY - this.CD * this.vLat);
                // Update spin
                this.omega *= this.decay;
                // Euler's method
                this.vY += aY * this.dt;
                this.vLat += aLat * this.dt;
                this.pos.y += this.vY * this.dt;
                this.pos.x += this.vLat * this.dt * this.cosLat;
                this.pos.z += this.vLat * this.dt * this.sinLat;
                if(!this.maxed && this.pos.y <= this.yLast) {
                    this.maxed = true;
                    console.log("Max height for arc " + this.arc + ": " + this.yLast + " m");
                }
                this.yLast = this.pos.y;
            }

            if(game.tree_xSorted[this.xCurrent] !== undefined && this.xSign * this.pos.x >= this.xSign * (game.tree_xSorted[this.xCurrent][this.xIndex] - this.realRadius)) {
                if(this.pos.y <= game.tree_xSorted[this.xCurrent][2] && this.pos.z >= game.tree_xSorted[this.xCurrent][3] && this.pos.z <= game.tree_xSorted[this.xCurrent][4]) {
                    this.pos.x = game.tree_xSorted[this.xCurrent][this.xIndex] - this.realRadius * this.xSign;
                    this.cosLat = -this.cosLat;
                    this.xSign = -this.xSign;
                    this.xIndex = 1 - this.xIndex;
                }
                this.xCurrent += this.xSign;
            }

            if(game.tree_zSorted[this.zCurrent] !== undefined && this.zSign * this.pos.z >= this.zSign * (game.tree_zSorted[this.zCurrent][this.zIndex] - this.realRadius)) {
                if(this.pos.y <= game.tree_zSorted[this.zCurrent][2] && this.pos.x >= game.tree_zSorted[this.zCurrent][0] && this.pos.x <= game.tree_zSorted[this.zCurrent][1]) {
                    this.pos.z = game.tree_zSorted[this.zCurrent][this.zIndex] - this.realRadius * this.zSign;
                    this.sinLat = -this.sinLat;
                    this.zSign = -this.zSign;
                    this.zIndex = (1 - this.zSign) / 2 + 3;
                }
                this.zCurrent += this.zSign;
            }
            if(this.vY <= 0 && this.pos.y <= 0) {
                this.pos.y = 0;
                this.location = game.checkLocation(this.pos.z, this.pos.x);
                switch(this.location) {
                    case GREEN:
                    console.log("Landing zone for arc " + this.arc + ": Green")
                    break;

                    case FAIRWAY:
                    console.log("Landing zone for arc " + this.arc + ": Fairway");
                    break;

                    case ROUGH:
                    console.log("Landing zone for arc " + this.arc + ": Rough");
                    break;
                }
                let range = Math.sqrt(Math.pow(this.pos.x - this.x0, 2) + Math.pow(this.pos.z - this.z0, 2));
                console.log("Range after arc " + this.arc + ": " + range + " m");
                this.arc++;
                this.maxed = false;
                if(v > 1 && this.vY !== 0) {
                    let rest = (v <= 20) ? (0.510 - 0.0375*v + 0.000903*Math.pow(v, 2)) : 0.12;
                    let theta1 = Math.atan(-this.vLat/this.vY);
                    let thetac = 15.4*v*theta1/(18.6*44.4);
                    this.vLat = 5/7*v*Math.sin(theta1 - thetac) - 2*this.realRadius*this.omega/7;
                    this.vY = rest * v * Math.cos(theta1 - thetac);
                    this.omega = this.vLat / this.realRadius;
                } else {
                    this./*rick*/rolling = true;
                    this.vY = undefined;
                }
            }
        }
    }
}

// Setting ball constants
// Radius in meters
game.ball.realRadius = 0.02135;
// Acceleration of gravity in meters per second
const G = 9.80665;
const PG = 1.31;
// Whether or not the ball is mid-launch
game.ball.moving = false;
// Initial position
game.ball.pos = {x: -50, z: -72, y: 0};
let p = 1.225;
let m = 0.04593;
// q value
//             p                              A                          m
game.ball.q = (p) * (Math.PI * Math.pow(game.ball.realRadius, 2)) / (2 * m);
game.ball.CL = 0.15;
game.ball.CD = 0.21;
