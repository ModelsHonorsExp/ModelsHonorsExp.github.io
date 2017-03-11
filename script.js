let game = {
    ready: 0,
    start: function() {
        // There are two canvases - the foreground (this.leftCanvas) and background (this.bg). this.leftCanvas gets updated every frame, this.bg stays as long as the window isn't resized.
        // They're layered, and this.leftCanvas has a transparent background.
        this.leftCanvas = document.querySelector("#left");
        this.rightCanvas = document.querySelector("#right");
        this.bg = document.querySelector("#bg");
        // cx is short for context, this is what you use to draw to a canvas.
        this.leftCx = this.leftCanvas.getContext("2d");
        this.rightCx = this.rightCanvas.getContext("2d");
        // Like this.scale but for the right canvas
        this.rightScale = 5;
        // Setting font for fillText
        this.bgCx = this.bg.getContext("2d");
        // this.leftEdge is the coordinate in meters of the left edge of the canvas
        this.leftEdge = Infinity;
        // this.groundHeight is the height of the ground above the bottom of the canvas in pixels (the zero point of height in meters).
        this.groundHeight = 100;
        // Each array in this.walls is a wall that follows this structure: [left edge, right edge, top]
        this.walls = [[60, 60.5, 8], [68, 78, 10]];
        // let self = this; declares the game object as a local variable so it can be used in callback functions, etc.
        let self = this;
        window.onresize = function() {
            // When the window is resized, run the window resize function. See game.windowResize()
            self.windowResize();
        };
        // On key down or on click, run the key down / click handler. See game.onKeyDown()
        window.onkeydown = function(event) {
            self.onKeyDown(event.keyCode);
        };
        window.onclick = function(event) {
            self.onKeyDown(event.keyCode);
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
            if(self.ready >= 2) {
                clearInterval(loop);
                self.enable();
            }
        }, 0);
    },
    windowResize: function() {
        // Dimensions in pixels
        this.width = window.innerWidth;
        this.leftWidth = this.width * 3 / 5;
        this.rightWidth = this.width - this.leftWidth;
        this.height = window.innerHeight;
        // Set canvases to fill page
        this.bg.setAttribute("width", this.width);
        this.bg.setAttribute("height", this.height);
        this.leftCanvas.setAttribute("width", this.leftWidth);
        this.leftCanvas.setAttribute("height", this.height);
        this.rightCanvas.setAttribute("width", this.rightWidth);
        this.rightCanvas.setAttribute("height", this.height);

        // this.scale is set in the update loop - setting it to Infinity ensures that it is set properly the first time through the update loop.
        // It describes the zoom level in pixels per meter.
        this.scale = Infinity;

        // Resizing canvases fucks up all the fill options so we have to set those again
        this.leftCx.font = "20px Courier New";
        this.bgCx.font = "20px Courier New";
        this.rightCx.strokeStyle = "white";
        this.rightCx.lineWidth = 4;
        this.leftCx.strokeStyle = "gray";
        this.leftCx.lineWidth = 4;
        // Set background fill color to green
        this.bgCx.fillStyle = "green";
        let groundHeight = this.getGroundHeight();
        // Draw grass. JS canvases place the zero point at the top and y increases going down, so everything has to be flipped over.
        this.bgCx.fillRect(0, groundHeight, this.leftWidth, this.height - groundHeight);
        this.bgCx.fillRect(this.leftWidth, 0, this.rightWidth, this.height);
        // Draw line in corner
        this.bgCx.lineWidth = 1;
        this.bgCx.beginPath();
        this.bgCx.moveTo(10.5, 10);
        this.bgCx.lineTo(10.5, 40);
        this.bgCx.stroke();
        this.bgCx.lineWidth = 4;
        this.bgCx.beginPath();
        this.bgCx.moveTo(this.leftWidth, 0);
        this.bgCx.lineTo(this.leftWidth, this.height);
        this.bgCx.stroke();

        // Putting this on the background means we only have to redraw the number every frame, plus keeps it in a consistent location.
        this.bgCx.fillStyle = "black";
        this.bgCx.fillText("yards", 90, 30);
    },
    onKeyDown: function(keyCode) {
        if(this.ball.moving) {
            // If the ball is already moving, ignore imput
            return 0;
        }
        if(keyCode === 37) {
            this.launchDir = -1;
            return 0;
        } if (keyCode === 39) {
            this.launchDir = 1;
            return 0;
        }

        // Otherwise, advance to the next input phase or launch. See the end of game.update()
        if(!this.launchAngleSet) {
            this.launchAngleSet = true;
            this.up = 1;
        } else if(!this.lateralAngleSet) {
            this.lateralAngleSet = true;
            this.up = 1;
            this.power = 0.2;
        } else {
            // See Ball.launch()
            if(this.launchDir === -1) {
                this.LAngle = Math.PI - this.LAngle;
            }
            this.ball.launch(58 * Math.cos(this.angle) * this.power, this.LAngle, 58 * Math.sin(this.angle) * this.power, 0);
            this.angle = 0.174;
            // this.up keeps track of whether we're oscillating up or down
            this.up = 1;
            // Same as angle stuff
            this.LAngle = 0;
            this.power = 1;
            this.launchAngleSet = false;
            this.lateralAngleSet = false;
        }
    },
    enable: function() {
        // When the game first loads, we simulate a window resize to set things up.
        this.windowResize();

        let self = this;
        // this.lastUpdate is used to calculate dt
        this.lastUpdate = Date.now();
        this.launchDir = 1;
        // this.angle is used during oscillation to keep track of where it is while going up and down.
        this.angle = 0.174;
        // this.up keeps track of whether we're oscillating up or down
        this.up = 1;
        // Same as angle stuff
        this.LAngle = 0;
        this.power = 1;
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
        // Calculate dt by subtracting the time of the last update to now
        let now = Date.now();
        let dt = (now - this.lastUpdate) / 1000;
        this.lastUpdate = now;
        // Let the ball recalculate its position
        this.ball.update(dt);
        // Set the zoom so it goes from the left edge to 10 meters past the position of the ball.
        if(!this.ball.moving) {
            // TODO: create oscillate function so this code isn't effectively duplicated and to make support for multiple club types easier
            // If we're awaiting input
            if(!this.launchAngleSet) {
                // If launch angle isn't finalized
                // Oscillate between ~10 and ~20 degrees
                // max angle: 0.348 rad, min angle: 0.174 rad, middle: 0.261 rad, range: 0.174 rad
                this.angle += this.up * 0.524 * dt;
                if(Math.abs(this.angle - 0.261) > 0.087) {
                    this.angle = 0.261 + this.up * 0.087;
                    this.up = -this.up;
                }
            } else if(!this.lateralAngleSet) {
                // If lateral angle isn't finalized
                // Oscillate between ~-40 and ~40 degrees
                // max angle: 0.7 rad, min angle: -0.7 rad, middle: 0 rad, range: 1.4 rad
                this.LAngle += this.up * 2 * dt;
                if(Math.abs(this.LAngle) > 0.7) {
                    this.LAngle = this.up * 0.7;
                    this.up = -this.up;
                }
            } else {
                // If power isn't finalized
                // Oscillate between 0.2 and 1 arbitrary power units, which are a multiplier on our launch speed
                // max power: 1, min power: 0.2, middle: 0.6, range: 0.8
                this.power += this.up * 3 * dt;
                if(Math.abs(this.power - 0.6) > 0.4) {
                    this.power = 0.6 + 0.4 * this.up;
                    this.up = -this.up;
                }
            }
        }
        this.render(dt);
    },
}
