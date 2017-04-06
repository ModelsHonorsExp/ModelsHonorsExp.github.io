game.ball = {
    stroke: 1,
    // Since the math for the X and Z directions is the same, throughout this object, "R" is used as a stand-in for X or Z when it can be specified by the caller of the function/property
    launch: function(v0lat, angleLat, v0y, spin) {
        this.angleLat = angleLat;

        // Array length, makes life/processing easier
        this.divs = 1;
        // Height array
        // TODO: look into preallocating with an estimated amount of entries to save time for this.h and this.lat
        this.h = [this.pos.y];
        // Lateral position array
        // Everything lateral is just x and z in the plane of the lateral angle
        this.x = [this.pos.x];
        this.z = [this.pos.z];
        // Vertical velocity
        let vY = v0y;
        // Lateral velocity
        let vLat = v0lat;
        let sinLat = Math.sin(angleLat);
        let cosLat = Math.cos(angleLat);
        // Delta t, lower = higher precision and longer swing time
        this.dt = Math.pow(10, -5);
        // Spin decay per iteration
        let decay = Math.exp(-this.dt/30);
        let omega = spin * 2 * Math.PI;

        let xSign = Math.sign(cosLat);
        let xIndex = (1 - xSign) / 2;
        let xCurrent = xIndex * (game.tree_xSorted.length - 1);
        while(game.tree_xSorted[xCurrent] !== undefined && xSign * this.pos.x > xSign * game.tree_xSorted[xCurrent][xIndex]) {
            xCurrent += xSign;
        }

        let zSign = Math.sign(sinLat);
        let zIndex = (1 - zSign) / 2 + 3;
        let zCurrent = (zIndex - 3) * (game.tree_zSorted.length - 1);
        while(game.tree_zSorted[zCurrent] !== undefined && zSign * this.pos.z > zSign * game.tree_zSorted[zCurrent][zIndex]) {
            zCurrent += zSign;
        }
        let arc = 1;
        let maxed = false;

        while(true) { // If it's the first calculation or we're above the ground
            // Net velocity magnitude
            let v = Math.sqrt(Math.pow(vY, 2) + Math.pow(vLat, 2));
            // Accelerations
            let aY = this.q * v * (this.CL * vLat - this.CD * vY) - this.g;
            let aLat = this.q * v * (-this.CL * vY - this.CD * vLat);
            // Update spin
            omega *= decay;
            // Euler's method
            vY += aY * this.dt;
            vLat += aLat * this.dt;
            this.h[this.divs] = this.h[this.divs-1] + vY * this.dt;
            this.x[this.divs] = this.x[this.divs-1] + vLat * this.dt * cosLat;
            this.z[this.divs] = this.z[this.divs-1] + vLat * this.dt * sinLat;
            if(!maxed && this.h[this.divs] <= this.h[this.divs - 1]) {
                maxed = true;
                console.log("Max height for arc " + arc + ": " + this.h[this.divs - 1] + " m");
            }

            if(game.tree_xSorted[xCurrent] !== undefined && xSign * this.x[this.divs] >= xSign * (game.tree_xSorted[xCurrent][xIndex] - this.realRadius)) {
                if(this.h[this.divs] <= game.tree_xSorted[xCurrent][2] && this.z[this.divs] >= game.tree_xSorted[xCurrent][3] && this.z[this.divs] <= game.tree_xSorted[xCurrent][4]) {
                    this.x[this.divs] = game.tree_xSorted[xCurrent][xIndex] - this.realRadius * xSign;
                    cosLat = -cosLat;
                    xSign = -xSign;
                    xIndex = 1 - xIndex;
                }
                xCurrent += xSign;
            }

            if(game.tree_zSorted[zCurrent] !== undefined && zSign * this.z[this.divs] >= zSign * (game.tree_zSorted[zCurrent][zIndex] - this.realRadius)) {
                if(this.h[this.divs] <= game.tree_zSorted[zCurrent][2] && this.x[this.divs] >= game.tree_zSorted[zCurrent][0] && this.x[this.divs] <= game.tree_zSorted[zCurrent][1]) {
                    this.z[this.divs] = game.tree_zSorted[zCurrent][zIndex] - this.realRadius * zSign;
                    sinLat = -sinLat;
                    zSign = -zSign;
                    zIndex = (1 - zSign) / 2 + 3;
                }
                zCurrent += zSign;
            }
            if(vY < 0 && this.h[this.divs] <= 0) {
                this.h[this.divs] = 0;
                switch(game.checkLocation(this.z[this.divs], this.x[this.divs])) {
                    case FAIRWAY:
                    console.log("Landing zone for arc " + arc + ": Fairway");
                    break;

                    case ROUGH:
                    console.log("Landing zone for arc " + arc + ": Rough");
                    break;
                }
                let range = Math.sqrt(Math.pow(this.x[this.divs] - this.x[0], 2) + Math.pow(this.z[this.divs] - this.z[0], 2));
                console.log("Range after arc " + arc + ": " + range + " m");
                arc++;
                maxed = false;
                if(v > 1) {
                    let rest = (v <= 20) ? (0.510 - 0.0375*v + 0.000903*Math.pow(v, 2)) : 0.12;
                    let theta1 = Math.atan(-vLat/vY);
                    let thetac = 15.4*v*theta1/(18.6*44.4);
                    vLat = 5/7*v*Math.sin(theta1 - thetac) - 2*this.realRadius*omega/7;
                    vY = rest * v * Math.cos(theta1 - thetac);
                    omega = vLat / this.realRadius;
                } else {
                    break;
                }
            }
            // Increase iterative variable
            this.divs++;
        }
        this.time = 0;
    },
    update(dt) {
        if(!this.moving) {
            // If we're not moving yet
            if(this.time === 0) {
                // If the launch function has finished
                // Start moving next update
                this.moving = true;
            }
            // End
            return 0;
        }

        this.time += dt;
        // Find our closest pre-calculated position by reducing it to one of the array indices
        let index = Math.floor(this.time / this.dt);
        if(index > this.divs) {
            // If we're at the end of the shot
            // Put us on the ground on the last frame
            index = this.divs;
            this.moving = false;
            this.pos.x = this.x[index];
            this.pos.z = this.z[index];
            this.pos.y = this.h[index];
            delete this.x;
            delete this.z;
            delete this.h;
            this.stroke++;
            return 0;
        }
        this.pos.x = this.x[index];
        this.pos.z = this.z[index];
        this.pos.y = this.h[index];
    }
}

// Setting ball constants
// Radius in meters
game.ball.realRadius = 0.02135;
// Acceleration of gravity in meters per second
game.ball.g = 9.80665;
// Whether or not the ball is mid-launch
game.ball.moving = false;
// Initial position
game.ball.pos = {x: 0, z: 0, y: 0};
let p = 1.225;
let m = 0.04593;
// q value
//             p                              A                          m
game.ball.q = (p) * (Math.PI * Math.pow(game.ball.realRadius, 2)) / (2 * m);
game.ball.CL = 0.15;
game.ball.CD = 0.21;
