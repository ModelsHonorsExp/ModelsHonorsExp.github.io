const ANGLE = 1;
const SPEED = 0;
const SPIN = 2;
const stats = [
    [74.7, 0.1902, 44.8], // Driver
    [70.7, 0.1606, 60.9], // 3-wood
    [68.0, 0.1641, 72.5], // 5-wood
    [65.3, 0.1780, 74.0], // Hybrid
    [63.5, 0.1815, 77.2], // 3 Iron
    [61.2, 0.1920, 80.6], // 4 Iron
    [59.0, 0.2112, 89.4], // 5 Iron
    [56.8, 0.2461, 103.9], // 6 Iron
    [53.6, 0.2845, 118.3], // 7 Iron
    [51.4, 0.3159, 133.3], // 8 Iron
    [48.7, 0.3560, 144.1], // 9 Iron
    [45.6, 0.4224, 155.1] // PW
]

let game = {
    ready: 0,
    start: function() {
        // There are three canvases - the foreground (this.leftCanvas and this.rightCanvas) and background (this.bg)
        // The foreground gets updated every frame, this.bg stays as long as the window isn't resized
        // They're layered, and the foreground has a transparent background
        this.leftCanvas = document.querySelector("#left");
        this.rightCanvas = document.querySelector("#right");
        this.bg = document.querySelector("#bg");
        // cx is short for context, this is what you use to draw to a canvas
        this.leftCx = this.leftCanvas.getContext("2d");
        this.rightCx = this.rightCanvas.getContext("2d");
        this.bgCx = this.bg.getContext("2d");
        // this.leftEdge is the coordinate in meters of the left edge of the canvas
        this.leftEdge = Infinity;
        // this.groundHeight is the height of the ground above the bottom of the canvas in pixels (the zero point of height in meters).
        this.groundHeight = 100;
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
        window.onkeyup = function(event) {
            self.onKeyUp(event.keyCode);
        };
        let onclick = function(event) {
            self.onKeyDown(-1);
        };
        this.leftCanvas.onclick = onclick;
        this.rightCanvas.onclick = onclick;
        // Images in JS load asynchonously, so we give a callback that increments game.ready
        // Even indices are file names, odd are the names of the associated images in the game
        let images = ["man.svg", "manImage", "manlookingleft.svg", "manImage2", "ball.svg", "ballImage", "tree.svg", "treeImage", "flag.svg", "leftFlagImage", "rightFlag.svg", "rightFlagImage"];
        for(let i = 0; i < images.length; i+=2) {
            this[images[i+1]] = new Image();
            this[images[i+1]].onload = function() {
                self.ready++;
            }
            this[images[i+1]].src = images[i];
        }
        // This loop waits for the images to load, then starts the game. See game.enable()
        let loop = setInterval(function() {
            if(self.ready <= images.length / 2) {
                clearInterval(loop);
                self.enable();
            }
        }, 0);
        this.clubNames = ["Driver", "3-wood", "5-wood", "3 Iron", "4 Iron", "5 Iron",
                          "6 Iron", "7 Iron", "8 Iron", "9 Iron", "PW"];
        let dropdownBox = document.querySelector(".dropdown-content");

        // Generate buttons
        for(let i = 0; i < this.clubNames.length; i++) {
            let button = document.createElement("button");
            button.innerHTML = this.clubNames[i];
            button.onclick = function() {
                self.setClub(i);
            }
            dropdownBox.appendChild(button);
        }

        this.dropdownButton = document.querySelector(".dropbtn");
        this.setClub(0);
    },
    windowResize: function() {
        // Dimensions in pixels
        this.width = window.innerWidth;
        this.leftWidth = this.width * 3 / 5;
        this.rightWidth = this.width - this.leftWidth;
        this.height = window.innerHeight - 106;
        // Set canvases to fill page
        this.bg.setAttribute("width", this.width);
        this.bg.setAttribute("height", this.height);
        this.leftCanvas.setAttribute("width", this.leftWidth);
        this.leftCanvas.setAttribute("height", this.height);
        this.rightCanvas.setAttribute("width", this.rightWidth);
        this.rightCanvas.setAttribute("height", this.height);
        // Resizing canvases f%$#s up all the fill options, so we have to set those again
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
        // Draw line that divides the screen
        this.bgCx.lineWidth = 4;
        this.bgCx.beginPath();
        this.bgCx.moveTo(this.leftWidth, 0);
        this.bgCx.lineTo(this.leftWidth, this.height);
        this.bgCx.stroke();
        // Putting this on the background means we only have to redraw the number every frame, plus keeps it in a consistent location
        this.bgCx.fillStyle = "black";
        this.bgCx.fillText("yards", 90, 30);
        // Set initial position of the ball in the right canvas - 5 meters from bottom of window
        this.ballinitpos = this.height * 0.975;
    },
    onKeyDown: function(keyCode) {
        if(this.ball.moving) {
            // If the ball is already moving, ignore imput
            return 0;
        }

        if(keyCode === 37) {
            this.leftKeyDown = true;
            return 0;
        } if(keyCode === 39) {
            this.rightKeyDown = true;
            return 0;
        }

        // Otherwise, advance to the next input phase or launch. See the end of game.update()
        if(!this.launchAngleSet) {
            this.launchAngleSet = true;
            this.power = 0.85;
            this.up = 1;
        } else {
            // See Ball.launch()
            this.lockScale = false;
            let angle = this.angleMultiplier * stats[this.clubNum][ANGLE];
            let latvel = stats[this.clubNum][SPEED] * Math.cos(angle) * this.power;
            let vertvel = stats[this.clubNum][SPEED] * Math.sin(angle) * this.power;
            console.log("Stroke " + this.ball.stroke + ":\nStarting position in m = (" + this.ball.pos.x + ", " + this.ball.pos.y + ", " + this.ball.pos.z + ")\nLateral velocity = " + latvel
                + " m/s\nLateral angle = " + this.LAngle + " rad\nVertical velocity = " + vertvel + " m/s\nSpin = 0 Hz");
            this.ball.launch(latvel, this.LAngle, vertvel, stats[this.clubNum][SPIN]);
            this.angleMultiplier = 0.8;
            // this.up keeps track of whether we're oscillating up or down
            this.up = 1;
            // Same as angle stuff
            this.power = 1;
            this.launchAngleSet = false;
        }
    },
    onKeyUp: function(keyCode) {
        if(keyCode === 37) {
            this.leftKeyDown = false;
            return 0;
        } if(keyCode === 39) {
            this.rightKeyDown = false;
            return 0;
        }
    },
    enable: function() {
        // When the game first loads, we simulate a window resize to set things up.
        this.windowResize();
        // this.lastUpdate is used to calculate dt
        this.lastUpdate = Date.now();
        // this.angleMultiplier is used during oscillation to keep track of where it is while going up and down.
        this.angleMultiplier = 0.8;
        this.launchDir = 1;
        // this.up keeps track of whether we're oscillating up or down
        this.up = 1;
        // Same as angle stuff
        this.LAngle = 0;
        this.power = 1;
        // this.scale is set in the update loop - setting it to Infinity ensures that it is set properly the first time through the update loop.
        // It describes the zoom level in pixels per meter
        this.scale = Infinity;
        // Like this.scale but for the right canvas, which is now equivalent to 165 meters
        this.rightScale = this.height / 400;
        // Find random position for the flag up to 155 meters away from the stick man
        // Adding 5 to the x coordinate ensures that the flag is at least 5 meters from the stick man
        // this.flagX and this.flagZ are set in meters
        this.flagX = Math.floor(Math.random() * 150) + 5;
        this.flagZ = Math.floor(Math.random() * -this.rightWidth + this.rightWidth / 2) / this.rightScale;

        this.tree_xSorted = [];
        this.tree_zSorted = [];
        for(let i = 0; i < 3; i++) {
            let treeX = Math.floor(Math.random() * 150) + 5;
            let treeZ = Math.floor((Math.random() * -this.rightWidth + this.rightWidth / 2) / this.rightScale);
            // [front, back, top, left, right]
            this.tree_xSorted[i] = [treeX, treeX+7, 10, treeZ, treeZ+7];
            console.log("Tree:\nx = " + treeX + " through " + this.tree_xSorted[i][1] +"\nz = " + treeZ + " through " + this.tree_xSorted[i][4]);
            this.tree_zSorted[i] = this.tree_xSorted[i];
        }
        this.tree_xSorted.sort(function(a, b) {
            return a[0] - b[0];
        });
        this.tree_zSorted.sort(function(a, b) {
            return a[3] - b[3];
        });
        // Declare self variable to use in callback function below
        let self = this;
        // Start running updates
        this.loop = setInterval(function() {
            self.update();
        }, 0);
    },
    getGroundHeight() {
        return this.height - this.groundHeight;
    },
    setLaunchDir: function() {
        this.launchDir = Math.sign(Math.cos(this.LAngle));
        this.lockScale = true;
    },
    update: function() {
        // game.update runs each frame
        // Calculate dt by subtracting the time of the last update to now
        let now = Date.now();
        let dt = (now - this.lastUpdate) / 1000;
        this.lastUpdate = now;
        // Let the ball recalculate its position
        this.ball.update(dt);
        if(!this.ball.moving) {
            // TODO: create oscillate function so this code isn't effectively duplicated and to make support for multiple club types easier
            if(this.leftKeyDown) {
                this.LAngle -= 2*dt;
                this.setLaunchDir();
            } if(this.rightKeyDown) {
                this.LAngle += 2*dt;
                this.setLaunchDir();
            }

            if(!this.launchAngleSet) {
                //console.log(this.angleMultiplier);
                this.angleMultiplier += this.up * 2 * dt;
                if(Math.abs(this.angleMultiplier - 1) > 0.3) {
                    this.angleMultiplier = 1 + this.up * 0.3;
                    this.up = -this.up;
                }
            } else {
                // If power isn't finalized
                // Oscillate between 0.85 and 1.05 arbitrary power units, which are a multiplier on our launch speed
                // max power: 1.05, min power: 0.85, middle: 0.95, range: 0.2
                this.power += this.up * 0.7 * dt;
                if(Math.abs(this.power - 0.95) > 0.1) {
                    this.power = 0.95 + 0.1 * this.up;
                    this.up = -this.up;
                }
            }
        }
        this.render(dt);
    },
    setClub: function(clubNum) {
        this.clubNum = clubNum;
        this.dropdownButton.innerHTML = this.clubNames[clubNum];
    }
}
