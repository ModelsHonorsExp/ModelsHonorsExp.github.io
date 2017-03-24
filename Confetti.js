class Confetti {
    constructor(color) {
        this.pos = [this.posx, 0];
        let angle = Math.random() * Math.PI * 2;
        this.xSpeed = Math.cos(angle) * 550 * Math.random();
        this.ySpeed = Math.sin(angle) * 450 * Math.random();
        let img = new Image();
        let self = this;
        img.onload = function() {
            self.image = tint(this, color);
            self.enable();
        }
        img.src = "confetti/" + Math.floor(Math.random() * 9) + ".png";
    }
    enable() {
        game.confettis.push(this);
    }
    getFrame() {
        return this.image;
    }
    update(dt) {
        this.ySpeed -= (this.ySpeed + 1000) * dt / 4;
        this.xSpeed -= this.xSpeed * dt / 2;
        this.pos[0] += this.xSpeed * dt;
        this.pos[1] -= this.ySpeed * dt;
        if(this.pos[1] > this.bottomBound) {
            game.confettis.splice(game.confettis.indexOf(this), 1);
        }
        return [this.pos[0] - this.image.width / 2, this.pos[1]];
    }
}
