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
    this.leftCx.fillStyle = "black";
    this.leftCx.fillText(Math.round(1000 * 30 / this.scale * 1.09361) / 1000, 20, 30);
    // Declare local groundHeight variable
    let groundHeight = this.getGroundHeight();
    if(!this.ball.moving) {
        // If we're awaiting input
        // Tell the user we're awaiting input
        this.leftCx.fillText("Press any key or tap screen", 20, 80);
        this.leftCx.beginPath();
        let left = -realLeftEdge + this.ball.pos.x * this.scale;
        let bot = groundHeight - this.ball.radius;
        let angle = this.angleMultiplier * stats[this.clubNum][ANGLE];
        let renderPower = (this.power - 0.7) * 3.5;
        this.leftCx.moveTo(left, bot);
        this.leftCx.lineTo(left + 400 * Math.cos(angle) * Math.cos(this.LAngle) * renderPower, bot - 400 * Math.sin(angle) * renderPower);
        // Write the line to the screen
        this.leftCx.stroke();
        left = this.rightWidth / 2 + this.ball.pos.z * this.rightScale;
        //bot = this.height * 0.8 - this.ball.pos.x * this.rightScale;
        bot = this.ballinitpos - this.ball.pos.x * this.rightScale;
        this.rightCx.beginPath();
        this.rightCx.moveTo(left, bot);
        this.rightCx.lineTo(left + Math.sin(this.LAngle) * Math.cos(angle) * 200 * renderPower, bot - Math.cos(this.LAngle) * Math.cos(angle) * 200 * renderPower);
        this.rightCx.stroke();
    }
    // Draw things
    this.drawTrees();
    this.drawFlag(this.flagX, this.flagZ);
    this.drawMan();
    // Draw the ball
    this.leftCx.drawImage(this.ballImage, -realLeftEdge + this.ball.pos.x*this.scale - this.ball.radius, groundHeight - this.ball.pos.y*this.scale - this.ball.diameter, this.ball.diameter, this.ball.diameter);
    let diameter = this.ball.diameter/(1 - this.ball.pos.y/100);
    this.rightCx.drawImage(this.ballImage, this.rightWidth / 2 - this.ball.radius + this.ball.pos.z*this.rightScale, this.ballinitpos - this.ball.pos.x*this.rightScale - this.ball.radius, diameter, diameter);

    if(!this.ball.moving && (this.leftEdge !== leftEdge || this.scale !== scale)) {
        if(Math.abs(this.leftEdge - leftEdge) < 0.01 && Math.abs(this.scale / scale - 1) < 0.01) {
            this.leftEdge = leftEdge;
            this.scale = scale;
            this.lockScale = false;
        }
        this.leftEdge = (this.leftEdge + leftEdge * 2 * dt) / (1 + 2 * dt);
        this.scale = (this.scale + scale * 2 * dt) / (1 + 2 * dt);
    }
}
