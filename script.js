let game = {
    ready: 0,
    start: function() {
        // There are two canvases - the foreground (this.canvas) and background (this.bg). this.canvas gets updated every frame, this.bg stays as long as the window isn't resized.
        // They're layered, and this.canvas has a transparent background.
        this.canvas = document.querySelector("#fg");
        this.bg = document.querySelector("#bg");
        // cx is short for context, this is what you use to draw to a canvas.
        this.cx = this.canvas.getContext("2d");
        // Setting font for fillText
        this.bgCx = this.bg.getContext("2d");
        // this.leftEdge is the coordinate in meters of the left edge of the canvas
        this.leftEdge = -2;
        // this.groundHeight is the height of the ground above the bottom of the canvas in pixels (the zero point of height in meters).
        this.groundHeight = 100;
        // Each array in this.walls is a wall that follows this structure: [left edge, right edge, top]
        this.walls = [[60, 60.5, 8], [68, 78, 10]];
        // Giving the Ball class access to this.walls
        this.ball.walls = this.walls;
        // let self = this; declares the game object as a local variable so it can be used in callback functions, etc.
        let self = this;
        window.onresize = function() {
            // When the window is resized, run the window resize function. See game.windowResize()
            self.windowResize();
        };
        // On key down or on click, run the key down / click handler. See game.onKeyDown()
        window.onkeydown = function() {
            self.onKeyDown();
        };
        window.onclick = function() {
            self.onKeyDown();
        };

        // Images in JS load asynchonously, so we give a callback that iincrements game.ready. Once that hits 2, we know that both images have been loaded.
        this.manImage = new Image();
        this.manImage.onload = function() {
            self.ready++;
        }
        this.manImage.src = "man.svg";
        this.ballImage = new Image();
        this.ballImage.onload = function() {
            self.ready++;
        }
        this.ballImage.src = "ball.svg";
        // This loop waits for both images to load, then starts the game. See game.enable()
        let loop = setInterval(function() {
            if(self.ready >= 1) {
                clearInterval(loop);
                self.enable();
            }
        }, 0);
    },
    windowResize: function() {
        // Dimensions in pixels
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        // Set canvases to fill page
        this.canvas.setAttribute("width", this.width);
        this.canvas.setAttribute("height", this.height);
        this.bg.setAttribute("width", this.width);
        this.bg.setAttribute("height", this.height);

        // this.scale is set in the update loop - setting it to Infinity ensures that it is set properly the first time through the update loop.
        // It describes the zoom level in pixels per meter.
        this.scale = Infinity;

        // Resizing canvases fucks up all the fill options so we have to set those again
        this.cx.font = "20px Courier New";
        this.bgCx.font = "20px Courier New";
        // Set background fill color to green
        this.bgCx.fillStyle = "green";
        let groundHeight = this.getGroundHeight();
        // Draw grass. JS canvases place the zero point at the top and y increases going down, so everything has to be flipped over.
        this.bgCx.fillRect(0, groundHeight, this.width, this.height - groundHeight);
        // Draw line in corner
        this.bgCx.beginPath();
        this.bgCx.moveTo(10.5, 10);
        this.bgCx.lineTo(10.5, 40);
        this.bgCx.stroke();

        // Putting this on the background means we only have to redraw the number every frame, plus keeps it in a consistent location.
        this.bgCx.fillStyle = "black";
        this.bgCx.fillText("yards", 90, 30);
    },
    onKeyDown: function() {
        if(this.ball.moving) {
            // If the ball is already moving, ignore imput
            return 0;
        }
        // Otherwise, advance to the next input phase or launch. See the end of game.update()
        if(!this.launchAngle) {
            this.launchAngle = this.angle * Math.PI / 180;
        } else {
            // See Ball.launch()
            this.ball.launch(0, 0, 58 * Math.cos(this.launchAngle) * this.power, 58 * Math.sin(this.launchAngle) * this.power);
        }
    },
    enable: function() {
        // When the game first loads, we simulate a window resize to set things up.
        this.windowResize();

        let self = this;
        // this.lastUpdate is used to calculate dt
        this.lastUpdate = Date.now();
        // this.angle is used during oscillation to keep track of where it is while going up and down.
        this.angle = 10;
        // this.angleUp keeps track of whether we're oscillating up or down
        this.angleUp = 1;
        // Same as angle stuff
        this.power = 0.2;
        this.powerUp = 1;
        // Start running updates
        this.loop = setInterval(function() {
            self.update();
        }, 0);
    },
    getGroundHeight() {
        return this.height - this.groundHeight;
    },
    update: function() {
        // game.update runs each frame
        // Clear foreground for redraw
        this.cx.clearRect(0, 0, this.width, this.height);
        // Calculate dt by subtracting the time of the last update to now
        let now = Date.now();
        let dt = (now - this.lastUpdate) / 1000;
        // Let the ball recalculate its position
        this.ball.update(dt);
        // Set the zoom so it goes from the left edge to 10 meters past the position of the ball.
        let scale = this.width / (this.leftEdge + this.ball.pos[0] + 10);
        if(scale < this.scale) {
            // If the scale is shrinking, don't change it.
            this.scale = scale;
        }
        // Calculate left edge in pixels - for drawing purposes.
        let realLeftEdge = this.scale * this.leftEdge;
        this.lastUpdate = now;
        // Put the new scale on the screen in yards per 30 pixels.
        this.cx.fillText(Math.round(1000 * 30 / this.scale * 1.09361) / 1000, 20, 30);
        // Calculate the size of the stick man
        let manHeight = 1.8 * this.scale;
        let manWidth = manHeight / 3;
        let groundHeight = this.getGroundHeight();
        // Draw stick man with his "feet" a little behind the (0, 0) point.
        this.cx.drawImage(this.manImage, -realLeftEdge - manWidth - 1, groundHeight - manHeight, manWidth, manHeight);
        for(let i = 0; i < this.walls.length; i++) {
            // Draw the walls
            this.cx.fillRect(-realLeftEdge + this.scale * this.walls[i][0], groundHeight - this.scale * this.walls[i][2],
                             this.scale * (this.walls[i][1] - this.walls[i][0]), this.scale * this.walls[i][2]);
        }
        if(!this.ball.moving) {
            // TODO: create oscillate function so this code isn't effectively duplicated and to make support for multiple club types easier
            // If we're awaiting input
            // Tell the user we're awaiting input
            this.cx.fillText("Press any key or tap screen", 20, 80);
            // Get ready to draw lines
            this.cx.beginPath();
            if(!this.launchAngle) {
                // If launch angle isn't finalized
                // Oscillate between 10 and 20 degrees
                // max angle: 20 deg, min angle: 10 deg, middle: 15 deg, range: 10 deg
                this.angle += this.angleUp * 30 * dt;
                if(Math.abs(this.angle - 15) > 5) {
                    this.angle = 15 + this.angleUp * 5;
                    this.angleUp = -this.angleUp;
                }
                // Draw 400 pixel line at the current angle
                this.cx.moveTo(-realLeftEdge, groundHeight - this.ball.radius);
                let angle = this.angle * Math.PI / 180;
                this.cx.lineTo(-realLeftEdge + 400 * Math.cos(angle), groundHeight - this.ball.radius - 400 * Math.sin(angle));
            } else {
                // If power isn't finalized
                //Oscillate between 0.2 and 1 arbitrary power units, which are a multiplier on our launch speed
                // max power: 1, min power: 0.2, middle: 0.6, range: 0.8
                this.power += this.powerUp * 3 * dt;
                if(Math.abs(this.power - 0.6) > 0.4) {
                    this.power = 0.6 + 0.4 * this.powerUp;
                    this.powerUp = -this.powerUp;
                }
                // Draw line at the launch angle at a length of 400 pixels times the power
                this.cx.moveTo(-realLeftEdge, groundHeight - this.ball.radius);
                this.cx.lineTo(-realLeftEdge + 400 * Math.cos(this.launchAngle) * this.power, groundHeight - this.ball.radius - 400 * Math.sin(this.launchAngle) * this.power);
            }
            // Write all of our lines to the screen
            this.cx.stroke();
        }
        // Draw the ball
        // Commented line below is for discussion purposes - I'm on the fence about which of these to use
        // this.cx.drawImage(this.ballImage, -realLeftEdge + this.ball.pos[0]*this.scale - this.ball.radius, groundHeight - (this.ball.pos[1] + this.ball.realRadius)*this.scale - this.ball.radius, this.ball.diameter, this.ball.diameter);
        this.cx.drawImage(this.ballImage, -realLeftEdge + this.ball.pos[0]*this.scale - this.ball.radius, groundHeight - this.ball.pos[1]*this.scale - this.ball.diameter, this.ball.diameter, this.ball.diameter);
    }
}
