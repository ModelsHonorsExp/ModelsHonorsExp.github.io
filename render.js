game.render = function(dt) {
    // Clear foreground for redraw
    this.leftCx.clearRect(0, 0, this.leftWidth, this.height);
    this.rightCx.clearRect(0, 0, this.rightWidth, this.height);
    let leftEdge = this.ball.pos.x - 5.5 + 4.5*this.launchDir - 100 / this.scale;
    if(leftEdge < this.leftEdge && (this.ball.moving || this.leftEdge === Infinity)) {
        let width = this.leftWidth / this.scale + this.leftEdge - leftEdge;
        if(this.leftEdge !== Infinity) {
            this.scale = this.leftWidth / width;
        }
        this.leftEdge = leftEdge;
    }
    if(!this.lockScale || this.scale === Infinity) {
        var scale = this.leftWidth / (this.ball.pos.x - this.leftEdge + 5.5 + 4.5*this.launchDir) / 1.1;
        if(scale < this.scale && (this.ball.moving || this.scale === Infinity)) {
            // If the scale is shrinking, don't change it.
            this.scale = scale;
        }
    } else {
        var scale = this.leftWidth / (this.ball.pos.x - leftEdge + 5.5 + 4.5*this.launchDir) / 1.1;
    }
    // Calculate left edge in pixels - for drawing purposes.
    let realLeftEdge = this.scale * this.leftEdge;
    // Put the new scale on the screen in yards per 30 pixels.
    this.leftCx.fillText(Math.round(1000 * 30 / this.scale * 1.09361) / 1000, 20, 30);
    // Calculate the size of the stick man
    let manHeight = 1.8 * this.scale;
    let manWidth = manHeight / 3;
    let groundHeight = this.getGroundHeight();
    // Draw stick man with his "feet" a little behind the (0, 0) point.
    this.leftCx.drawImage(this.manImage, -realLeftEdge - manWidth - 1, groundHeight - manHeight, manWidth, manHeight);
    for(let i = 0; i < this.walls.length; i++) {
        // Draw the walls
        this.leftCx.fillRect(-realLeftEdge + this.scale * this.walls[i][0], groundHeight - this.scale * this.walls[i][2],
                             this.scale * (this.walls[i][1] - this.walls[i][0]), this.scale * this.walls[i][2]);
        this.rightCx.fillRect(0, this.height*0.8 - this.walls[i][0]*this.rightScale, this.rightWidth, (this.walls[i][0] - this.walls[i][1])*this.rightScale);
    }
    if(!this.ball.moving) {
        if(this.leftEdge !== leftEdge || this.scale !== scale) {
            if(Math.abs(this.leftEdge - leftEdge) < 0.01 && Math.abs(this.scale / scale - 1) < 0.01) {
                this.leftEdge = leftEdge;
                this.scale = scale;
                this.lockScale = false;
            }
            this.leftEdge = (this.leftEdge + leftEdge * 2 * dt) / (1 + 2 * dt);
            this.scale = (this.scale + scale * 2 * dt) / (1 + 2 * dt);
        }
        // If we're awaiting input
        // Tell the user we're awaiting input
        this.leftCx.fillText("Press any key or tap screen", 20, 80);
        // Get ready to draw lines
        this.leftCx.beginPath();
        let left = -realLeftEdge + this.ball.pos.x * this.scale;
        let bot = groundHeight - this.ball.radius;
        this.leftCx.moveTo(left, bot);
        this.leftCx.lineTo(left + 400 * Math.cos(this.angle) * this.power * this.launchDir, bot - 400 * Math.sin(this.angle) * this.power);
        // Write the line to the screen
        this.leftCx.stroke();
        if(this.launchAngleSet) {
            left = this.rightWidth / 2 + this.ball.pos.z * this.rightScale;
            bot = this.height * 0.8 - this.ball.pos.x * this.rightScale;
            this.rightCx.beginPath();
            this.rightCx.moveTo(left, bot);
            this.rightCx.lineTo(left + Math.sin(this.LAngle) * 200 * this.power, bot - Math.cos(this.LAngle) * 200 * this.power * this.launchDir);
            this.rightCx.stroke();
        }
    }
    // Draw the ball
    // Commented line below is for discussion purposes - I'm on the fence about which of these to use
    // this.leftCx.drawImage(this.ballImage, -realLeftEdge + this.ball.pos.x*this.scale - this.ball.radius, groundHeight - (this.ball.pos.y + this.ball.realRadius)*this.scale - this.ball.radius, this.ball.diameter, this.ball.diameter);
    this.leftCx.drawImage(this.ballImage, -realLeftEdge + this.ball.pos.x*this.scale - this.ball.radius, groundHeight - this.ball.pos.y*this.scale - this.ball.diameter, this.ball.diameter, this.ball.diameter);

    // Draw line between corners of right canvas to demonstrate
    let diameter = this.ball.diameter/(1 - this.ball.pos.y/40);
    this.rightCx.drawImage(this.ballImage, this.rightWidth / 2 - this.ball.radius + this.ball.pos.z*this.rightScale, this.height*0.8 - this.ball.pos.x*this.rightScale - this.ball.radius, diameter, diameter);
}
