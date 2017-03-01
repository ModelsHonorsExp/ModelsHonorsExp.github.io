game.ball = {
    // Since the math for the X and Z directions is the same, throughout this object, "R" is used as a stand-in for X or Z when it can be specified by the caller of the function/property
    launch: function(x0, z0, h0, v0x, v0z, v0y) {
        // Ball is moving now
        this.moving = true;
        // Position of the bottom center of the ball
        this.setPos(x0, z0, h0);
        // initial x/z velocity
        this.v0 = {x: v0x, z: v0z};
        // -1 if the ball is moving in the - direction, 1 if it's moving in the + direction, 0 if it has no R velocity.
        this.signV = {x: Math.sign(v0x), z: Math.sign(v0z)};
        // reset time
        this.time = 0;
        if(v0y <= 0) {
            // If the ball is going downward to begin with
            // Set starting values for the second half of the flight
            var v0y2 = v0y;
            this.h02 = h0;
            // Time of max height is zero - first half will never start
            this.tmax = 0;
        } else {
            // Otherwise
            // Set values for first half of launch and set second half to the values that they will hold at the end of the first half
            this.D = Math.atan(Math.sqrt(this.q / this.g) * v0y);
            // Time of max height - this tells it when to switch to the formula for downward motion
            this.tmax = this.D / Math.sqrt(this.q * this.g);
            // Vertical velocity is 0 at max height
            var v0y2 = 0;
            this.h02 = this.getHeight(this.tmax);
        }
        //I'm not sure if the code breaks when x velocity is zero - this may be something to test.
        // C value
        this.C = Math.abs((v0y2 - Math.sqrt(this.g / this.q)) / (v0y2 + Math.sqrt(this.g / this.q)));
        // alpha value
        this.alpha = 2*Math.sqrt(this.q * this.g);

        // Estimate collision time based on how it would be without air resistance
        let est = (v0y + Math.sqrt(Math.pow(v0y, 2) + 2*this.g*h0)) / this.g;
        this.tend = this.getTimeFromHeight(0, est);
        this.nextLaunch = undefined;
        let side = (1 - this.signV.x) / 2; // 0 (left side of wall) if we're moving right, 1 (right side) if we're moving left. See game.start()
        for(let i = 0; i < game.walls.length; i++) {
            // TODO: add z direction collision checks
            // Check if the bottom center of the ball hits the top of the wall
            let tAtTop = this.getTimeFromHeight(game.walls[i][2], est);
            let rAtTop = this.getRange(tAtTop, "x");
            if(tAtTop < this.tend && rAtTop > game.walls[i][0] && rAtTop < game.walls[i][1]) {
                // If it does
                // Bounce off of top of wall (assuming completely elastic collision with infinitely massive Earth - basically true if the walls are steel or something. Close enough)
                let yvel = -this.getYVelocity(tAtTop);
                let xvel = this.getRVelocity(tAtTop, "x");
                // Once we hit the top of that wall, game.ball.launch() will be called again with these arguments. Recursive function, sorta
                this.nextLaunch = [rAtTop, this.getRange(tAtTop, "z"), game.walls[i][2], xvel, this.getRVelocity(tAtTop, "z"), yvel];
                // Stop the simulation once we get to the top of the wall
                this.tend = tAtTop;
            }

            // The ball hits the wall when it's position is the edge of the wall, offset by its radius
            let edgeX = game.walls[i][side] - this.signV.x * this.realRadius;
            let tAtWall = this.getTimeFromRange(edgeX, "x");
            let hAtWall = this.getHeight(tAtWall);
            if(tAtWall < this.tend && hAtWall > 0 && hAtWall < game.walls[i][2]) {
                // If the side of the ball hits the side of the wall
                // Bounce off of side of wall (same stipulations as above)
                let yvel = this.getYVelocity(tAtWall);
                let xvel = -this.getRVelocity(tAtWall, "x");
                // See above
                this.nextLaunch = [edgeX, this.getRange(tAtWall, "z"), hAtWall, xvel, this.getRVelocity(tAtWall, "z"), yvel];
                this.tend = tAtWall;
            }
        }
        // If we collided, quit here.
        if(this.nextLaunch) {
            return 0;
        }

        // Now we check for bouncing
        // vxf and vyf - x/y velocities when we hit the grass
        let vxf = this.getRVelocity(this.tend, "x");
        let vzf = this.getRVelocity(this.tend, "z");
        let vyf = this.getYVelocity(this.tend);
        // Pythagorean theorem
        let vrf = Math.sqrt(Math.pow(vxf, 2) + Math.pow(vzf, 2));
        let vf = Math.sqrt(Math.pow(vrf, 2) + Math.pow(vyf, 2));
        // Angle in flat plane
        let rAngle = Math.atan(vzf/vxf);
        // Angle of collision
        let theta1 = Math.atan(Math.abs(vrf/vyf));

        // Coefficient of restitution - see below for less elegant code but clearer explanation
        let rest = (vf <= 20) ? (0.510 - 0.0375*vf + 0.000903*Math.pow(vf, 2)) : 0.12;
        // Angle of bounce
        let thetac = 15.4*vf*theta1/(18.6*44.4);
        if(thetac > 0.017) {
            // TODO: research this more
            // If the angle is more than ~1 degree
            // Set next launch to bounce
            let rawVr = Math.sign(vxf)*vf*rest*Math.cos(thetac);
            this.nextLaunch = [this.getRange(this.tend, "x"), this.getRange(this.tend, "z"), 0,
                               rawVr*Math.cos(rAngle), rawVr*Math.sin(rAngle), vf*rest*Math.sin(thetac)];
            return 0;
        }
    },
    setPos(x, z, y) {
        this.pos = {x: x, z: z, y: y};
        this.pos0 = {x: x, z: z, y: y};
    },
    getHeight: function(time) {
        if(time <= this.tmax) {
            // If we're going up
            // Use the up formula
            return this.pos0.y + Math.log(Math.abs(Math.cos(this.D - time*Math.sqrt(this.q*this.g)) / Math.cos(this.D))) / this.q;
        } else {
            // Otherwise
            // Calculate based on time elapsed since the maximum using the down formula
            let deltat = time - this.tmax;
            let value = this.h02 + Math.sqrt(this.g / this.q) * (deltat + 2 / this.alpha * Math.log((1 + this.C)/(1 + this.C*Math.exp(this.alpha*deltat))));
            return value;
        }
    },
    getRange: function(time, index) {
        // See the MATLAB code
        return this.pos0[index] + this.signV[index] * Math.log(Math.abs(-this.v0[index]*this.signV[index]*this.q*time - 1)) / this.q;
    },
    getTimeFromRange: function(range, index) {
        // Inverted above function - can be inverted with algebra
        let time = (Math.exp(this.signV[index] * (range - this.pos0[index]) * this.q) - 1) / (Math.abs(this.v0[index]) * this.q);
        if(time < 0) {
            return undefined;
        }
        return time;
    },
    getTimeFromHeight: function(height, guess) {
        // NOTE: this only finds the time when the ball is going down, as it's irrelevant going up in all cases so far. If a ceiling is added, life is gonna suck
        // Newton method
        let est = guess - this.tmax;
        for(let i = 0; i < 20; i++) {
            let v = Math.sqrt(this.g / this.q) * (1 - this.C*Math.exp(this.alpha*est)) / (1 + this.C*Math.exp(this.alpha*est));
            let h = this.getHeight(est + this.tmax) - height;
            est -= h / v;
        }
        est += this.tmax;
        if(est < 0 || Math.abs(this.getHeight(est) - height) > 0.1) {
            return undefined;
        }
        return est;
    },
    getRVelocity: function(time, index) {
        // See the MATLAB code
        return this.v0[index] / (1 + Math.abs(this.v0[index]) * this.q * time);
    },
    getYVelocity: function(time) {
        // See the MATLAB code
        if(time <= this.tmax) {
            return Math.sqrt(this.g/this.q) * Math.tan(this.D - time * Math.sqrt(this.q * this.g));
        } else {
            return Math.sqrt(this.g/this.q) * (1 - this.C*Math.exp(this.alpha*(time - this.tmax))) / (1 + this.C * Math.exp(this.alpha * (time - this.tmax)));
        }
    },
    update: function(dt) {
        // Runs every frame
        // Update time
        this.time += dt;
        if(this.time < this.tend) {
            // If we're not done with this bounce yet
            // Update position to new time
            this.pos.y = this.getHeight(this.time);
            this.pos.x = this.getRange(this.time, "x");
            this.pos.z = this.getRange(this.time, "z");
        } else if (!isNaN(this.time)) {
            // Otherwise, given we haven't set the time to NaN to say that the launch is fully over
            if(this.nextLaunch) {
                // If there are conditions for a bounce
                // Execute the bounce
                this.launch.apply(this, this.nextLaunch);
            } else {
                // Otherwise
                // Move the ball to the exact location at the end and set the time to NaN to say that the launch is fully over
                this.pos.y = 0;
                this.pos.x = this.getRange(this.tend, "x");
                this.pos.z = this.getRange(this.tend, "z");
                this.time = NaN;
            }
        }
    }
}

// Setting ball constants
// Radius in meters
game.ball.realRadius = 0.02135;
// Acceleration of gravity in meters per second
game.ball.g = 9.80665;
// Whether or not the ball is mid-launch
game.ball.moving = false;
// Radius of image in pixels (for drawing purposes)
game.ball.radius = 5;
// Initial position
game.ball.setPos(0, 0, 0);
// Diameter of image in pixels (for drawing purposes)
game.ball.diameter = game.ball.radius * 2;
// q value
//             Cd        p                              A                               m
game.ball.q = (0.5) * (1.225) * (Math.PI * Math.pow(game.ball.realRadius, 2)) / (2 * 0.04593);
