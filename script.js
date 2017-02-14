let game = {
    ready: 0,
    start: function() {
        this.canvas = document.querySelector("#fg");
        this.bg = document.querySelector("#bg");
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.cx = this.canvas.getContext("2d");
        this.cx.font = "20px Courier New";
        this.bgCx = this.bg.getContext("2d");
        this.bgCx.font = "20px Courier New";
        this.leftEdge = -2;
        this.groundHeight = 100;
        this.walls = [[32, 8], [37, 10]];
        Ball.prototype.walls = this.walls;
        this.ball = new Ball(0, 58, 15 * Math.PI / 180);
        this.last = [0, 0];
        let self = this;
        window.onresize = function() {
            self.windowResize();
        };
        window.onkeydown = function() {
            self.onKeyDown();
        };
        window.onclick = function() {
            self.onKeyDown();
        };

        let img = new Image();
        img.onload = function() {
            self.manImage = this;
            self.ready++;
        }
        img.src = "man.svg";
        let loop = setInterval(function() {
            if(self.ready >= 1) {
                clearInterval(loop);
                self.enable();
            }
        }, 0);
    },
    windowResize: function() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.setAttribute("width", this.width);
        this.canvas.setAttribute("height", this.height);
        this.bg.setAttribute("width", this.width);
        this.bg.setAttribute("height", this.height);

        this.scale = Infinity;
        this.cx.font = "20px Courier New";
        this.bgCx.font = "20px Courier New";
        this.bgCx.fillStyle = "green";
        let groundHeight = this.getGroundHeight();
        this.bgCx.fillRect(0, groundHeight, this.width, this.height - groundHeight);
        this.bgCx.beginPath();
        this.bgCx.moveTo(10.5, 10);
        this.bgCx.lineTo(10.5, 40);
        this.bgCx.stroke();
        this.bgCx.fillStyle = "black";
        this.bgCx.fillText("meters", 90, 30);
    },
    onKeyDown: function() {
        if(this.ball.moving) {
            return 0;
        }
        if(!this.launchAngle) {
            this.launchAngle = this.angle * Math.PI / 180;
        } else {
            this.ball.launch(0, 0, 58 * Math.cos(this.launchAngle) * this.power, 58 * Math.sin(this.launchAngle) * this.power);
        }
    },
    enable: function() {
        this.windowResize();

        let self = this;
        this.lastUpdate = Date.now();
        this.angle = 5;
        this.angleUp = 1;
        this.power = 0.2;
        this.powerUp = 1;
        this.loop = setInterval(function() {
            self.update();
        }, 0);
    },
    getGroundHeight() {
        return this.height - this.groundHeight;
    },
    update: function() {
        this.cx.clearRect(0, 0, this.width, this.height);
        let now = Date.now();
        let dt = (now - this.lastUpdate) / 1000;
        this.ball.update(dt);
        let scale = this.width / (this.leftEdge + this.ball.pos[0] + 10);
        if(scale < this.scale) {
            this.scale = scale;
        }
        let realLeftEdge = this.scale * this.leftEdge;
        this.lastUpdate = now;
        this.cx.fillText(Math.round(1000 * 30 / this.scale) / 1000, 20, 30);
        let manHeight = 1.8 * this.scale;
        let manWidth = manHeight / 3;
        let groundHeight = this.getGroundHeight();
        this.cx.drawImage(this.manImage, -realLeftEdge - manWidth - 1, groundHeight - manHeight, manWidth, manHeight);
        this.cx.beginPath();
        for(let i = 0; i < this.walls.length; i++) {
            this.cx.moveTo(Math.round(-realLeftEdge + this.scale * this.walls[i][0]) - 0.5, groundHeight);
            this.cx.lineTo(Math.round(-realLeftEdge + this.scale * this.walls[i][0]) - 0.5, groundHeight - this.scale * this.walls[i][1]);
        }
        if(!this.ball.moving) {
            this.cx.fillText("Press any key or tap screen", 20, 80);
            if(!this.launchAngle) {
                // max angle: 35 deg, min angle: 5 deg, middle: 20 deg, range: 15 deg
                this.angle += this.angleUp * 60 * dt;
                if(Math.abs(this.angle - 20) > 15) {
                    this.angle = 20 + this.angleUp * 15;
                    this.angleUp = -this.angleUp;
                }
                this.cx.moveTo(-realLeftEdge, groundHeight - this.ball.radius);
                let angle = this.angle * Math.PI / 180;
                this.cx.lineTo(-realLeftEdge + 400 * Math.cos(angle), groundHeight - this.ball.radius - 400 * Math.sin(angle));
            } else {
                this.power += this.powerUp * 3 * dt;
                // max power: 1, min power: 0.2, middle: 0.6, range: 0.8
                if(Math.abs(this.power - 0.6) > 0.4) {
                    this.power = 0.6 + 0.4 * this.powerUp;
                    this.powerUp = -this.powerUp;
                }
                this.cx.moveTo(-realLeftEdge, groundHeight - this.ball.radius);
                this.cx.lineTo(-realLeftEdge + 400 * Math.cos(this.launchAngle) * this.power, groundHeight - this.ball.radius - 400 * Math.sin(this.launchAngle) * this.power);
            }
        }
        this.cx.stroke();
        this.cx.drawImage(this.ball.image, -realLeftEdge + this.ball.pos[0]*this.scale - this.ball.radius, groundHeight - this.ball.pos[1]*this.scale - this.ball.diameter);
    }
}
