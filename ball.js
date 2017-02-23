game.ball = {
    launch: function(h0, x0, v0x, v0y) {
        // Ball is moving now
        this.moving = true;
        // Position of the bottom center of the ball
        this.pos = [x0, h0];
        // initial height for first half of flight (going upward)
        this.h01 = h0;
        // initial x position
        this.x0 = x0;
        // initial vertical velocity for first half of flight
        this.v0y1 = v0y;
        // initial x velocity
        this.v0x = v0x;
        // reset time
        this.time = 0;
        if(this.v0y1 <= 0) {
            // If the ball is going downward to begin with
            // Set starting values for the second half of the flight
            this.v0y2 = this.v0y1;
            this.h02 = h0;
            // Time of max height is zero - first half will never start
            this.tmax = 0;
        } else {
            // Otherwise
            // Set values for first half of launch and set second half to the values that they will hold at the end of the first half
            this.D = Math.atan(Math.sqrt(this.q / this.g) * this.v0y1);
            // Time of max height - this tells it when to switch to the formula for downward motion
            this.tmax = this.D / Math.sqrt(this.q * this.g);
            // Vertical velocity is 0 at max height
            this.v0y2 = 0;
            this.h02 = this.getHeight(this.tmax);
        }
        // -1 if the ball is moving left, 1 if it's moving right, 0 if it has no x velocity.
        //I'm not sure if the code breaks when x velocity is zero - this may be something to test.
        this.signVx = Math.sign(this.v0x);
        // C value
        this.C = Math.abs((this.v0y2 - Math.sqrt(this.g / this.q)) / (this.v0y2 + Math.sqrt(this.g / this.q)));
        // alpha value
        this.alpha = 2*Math.sqrt(this.q * this.g);
        let signVx = this.signVx; // For use in function below
        // Sort the walls in the order of the direction of motion - needed to make sure the ball detects the right wall to collide with
        this.walls.sort(function (a, b) {
            return (a[0] - b[0]) * signVx;
        });

        // Estimate collision time based on how it would be without air resistance
        let est = (this.v0y1 + Math.sqrt(Math.pow(this.v0y1, 2) + 2*this.g*this.h01)) / this.g;
        let side = (1 - this.signVx) / 2; // 0 (left side of wall) if we're moving right, 1 (right side) if we're moving left. See game.start()
        for(let i = 0; i < this.walls.length; i++) {
            // Check if the bottom center of the ball hits the top of the wall
            let tAtTop = this.getTimeFromHeight(this.walls[i][2], est);
            let rAtTop = this.getRange(tAtTop);
            if(tAtTop > 0 && rAtTop > this.walls[i][0] && rAtTop < this.walls[i][1]) {
                // If it does
                // Bounce off of top of wall (assuming completely elastic collision with infinitely massive Earth - basically true if the walls are steel or something. Close enough)
                let yvel = -this.getYVelocity(tAtTop);
                let xvel = this.getXVelocity(tAtTop);
                // Once we hit the top of that wall, game.ball.launch() will be called again with these arguments. Recursive function, sorta
                this.nextLaunch = [this.walls[i][2], rAtTop, xvel, yvel];
                // Stop the simulation once we get to the top of the wall
                this.tend = tAtTop;
                // No more wall checking or anything, we found out collision
                return 0;
            }

            // The ball hits the wall when it's position is the edge of the wall, offset by its radius
            let edgeX = this.walls[i][side] - this.signVx * this.realRadius;
            let tAtWall = this.getTimeFromRange(edgeX);
            let hAtWall = this.getHeight(tAtWall);
            if(tAtWall > 0 && hAtWall > 0 && hAtWall < this.walls[i][2]) {
                // If the side of the ball hits the side of the wall
                // Bounce off of side of wall (same stipulations as above)
                let yvel = this.getYVelocity(tAtWall);
                let xvel = -this.getXVelocity(tAtWall);
                // See above
                this.nextLaunch = [hAtWall, edgeX, xvel, yvel];
                this.tend = tAtWall;
                return 0;
            }
        }
        // If we didn't collide with any walls, calculate when we hit the ground.
        this.tend = this.getTimeFromHeight(0, est);

        // Now we check for bouncing
        // vxf and vyf - x/y velocities when we hit the grass
        let vxf = this.getXVelocity(this.tend);
        let vyf = this.getYVelocity(this.tend);
        // Pythagorean theorem
        let vf = Math.sqrt(Math.pow(vxf, 2) + Math.pow(vyf, 2));
        // Angle of collision
        let theta1 = Math.atan(Math.abs(vxf/vyf));

        // Coefficient of restitution - see below for less elegant code but clearer explanation
        /*if(vf <= 20) {
            var rest = 0.510 - 0.0375*vf + 0.000903*Math.pow(vf, 2);
        } else {
            var rest = 0.12;
        }*/
        let rest = (vf <= 20) ? (0.510 - 0.0375*vf + 0.000903*Math.pow(vf, 2)) : 0.12;
        // Angle of bounce
        let thetac = 15.4*vf*theta1/(18.6*44.4);
        if(thetac > 0.017) {
            // TODO: research this more
            // If the angle is more than ~1 degree
            // Set next launch to bounce
            this.nextLaunch = [0, this.getRange(this.tend), Math.sign(vxf)*vf*rest*Math.cos(thetac), vf*rest*Math.sin(thetac)];
            return 0;
        }
        // Otherwise, don't bother calculating bounce
        this.nextLaunch = undefined;
    },
    getHeight: function(time) {
        if(time <= this.tmax) {
            // If we're going up
            // Use the up formula
            return this.h01 + Math.log(Math.abs(Math.cos(this.D - time*Math.sqrt(this.q*this.g)) / Math.cos(this.D))) / this.q;
        } else {
            // Otherwise
            // Calculate based on time elapsed since the maximum using the down formula
            let deltat = time - this.tmax;
            let value = this.h02 + Math.sqrt(this.g / this.q) * (deltat + 2 / this.alpha * Math.log((1 + this.C)/(1 + this.C*Math.exp(this.alpha*deltat))));
            return value;
        }
    },
    getRange: function(time) {
        // See the MATLAB code
        return this.x0 + this.signVx * Math.log(Math.abs(-this.v0x*this.signVx*this.q*time - 1)) / this.q;
    },
    getTimeFromRange: function(range) {
        // Inverted above function - can be inverted with algebra
        return (Math.exp(this.signVx * (range - this.x0) * this.q) - 1) / (Math.abs(this.v0x) * this.q);
    },
    getTimeFromHeight: function(height, guess) {
        // NOTE: this only finds the time when the ball is going down, as it's irrelevant going up in all cases so far. If a ceiling is added, life is gonna suck
        // Newton method
        let est = guess - this.tmax;
        for(let i = 0; i < 14; i++) {
            let v = Math.sqrt(this.g / this.q) * (1 - this.C*Math.exp(this.alpha*est)) / (1 + this.C*Math.exp(this.alpha*est));
            let h = this.getHeight(est + this.tmax) - height;
            est -= h / v;
        }
        return est + this.tmax;
    },
    getXVelocity: function(time) {
        // See the MATLAB code
        return this.v0x / (1 + Math.abs(this.v0x) * this.q * time);
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
            this.pos[1] = this.getHeight(this.time);
            this.pos[0] = this.getRange(this.time);
        } else if (!isNaN(this.time)) {
            // Otherwise, given we haven't set the time to NaN to say that the launch is fully over
            if(this.nextLaunch) {
                // If there are conditions for a bounce
                // Execute the bounce
                this.launch.apply(this, this.nextLaunch);
            } else {
                // Otherwise
                // Move the ball to the exact location at the end and set the time to NaN to say that the launch is fully over
                this.pos[1] = 0;
                this.pos[0] = this.getRange(this.tend);
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
game.ball.pos = [0, 0];
// Diameter of image in pixels (for drawing purposes)
game.ball.diameter = game.ball.radius * 2;
// q value
//             Cd        p                              A                               m
game.ball.q = (0.5) * (1.225) * (Math.PI * Math.pow(game.ball.realRadius, 2)) / (2 * 0.04593);
