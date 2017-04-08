// Declaring variables and setting some defaults
var canvas, ctx, width, height;
var fgpos = 0, frames = 0, score = 0;
var bestScore = localStorage.getItem("bestScore") || 0;
var currentState;
var states = {splash: 0, game: 1, score: 2};

// Declaring objects
var okButton;
var bird = {

	x: 60,
	y: 0,

	frame: 0,
	velocity: 0,
	animation: [0, 0],
	rotation: 0,
	radius: 12,

	gravity: 0.18,
	_jump: 3.5,

	jump: function() {
		this.velocity = -this._jump;
	},

	update: function() {
		var n = currentState === states.splash ? 10 : 5;
		this.frame += frames % n === 0 ? 1 : 0;
		this.frame %= this.animation.length;

		if (currentState === states.splash) {
      //Intro state when starting
			this.y = height - 320;
			this.rotation = 0;

		} else {

			this.velocity += this.gravity;
			this.y += this.velocity;

  			// change to the score state when bird touches the ground
  			if (this.y >= height - s_fg.height-10) {
  				this.y = height - s_fg.height-10;
  				if (currentState === states.game) {
  					currentState = states.score;
  				}
  				// sets velocity to jump speed for correct rotation
  				this.velocity = this._jump;
			}

			// rotate down when no user action
			if (this.velocity >= this._jump) {
				this.frame = 1;
				this.rotation = Math.min(Math.PI/2, this.rotation + 0.3);
			} else {
  				this.rotation = -0.3;
			}
		}
	},

	draw: function(ctx) {
		ctx.save();
		ctx.translate(this.x, this.y);
		ctx.rotate(this.rotation);

		var n = this.animation[this.frame];
		s_bird[n].draw(ctx, -s_bird[n].width/2, -s_bird[n].height/2);

		ctx.restore();
	}
};

var pipes = {

	_pipes: [],

	reset: function() {
		this._pipes = [];
	},

	update: function() {
		// add new pipe each 100 frames
		if (frames % 100 === 0) {
			// calculate y position
			var _y = height - (s_pipeSouth.height+s_fg.height+120+200*Math.random());
			// create and push pipe to array
			this._pipes.push({
				x: 500,
				y: _y,
				width: s_pipeSouth.width,
				height: s_pipeSouth.height
			});
		}
		for (var i = 0, len = this._pipes.length; i < len; i++) {
			var p = this._pipes[i];

			if (i === 0) {

				score += p.x === bird.x ? 1 : 0;

				// check when collisions happen
				var cx  = Math.min(Math.max(bird.x, p.x), p.x+p.width);
				var cy1 = Math.min(Math.max(bird.y, p.y), p.y+p.height);
				var cy2 = Math.min(Math.max(bird.y, p.y+p.height+80), p.y+2*p.height+80);
				// closest difference
				var dx  = bird.x - cx;
				var dy1 = bird.y - cy1;
				var dy2 = bird.y - cy2;
				// vector length
				var d1 = dx*dx + dy1*dy1;
				var d2 = dx*dx + dy2*dy2;
				var r = bird.radius*bird.radius;
				// determine intersection
				if (r > d1 || r > d2) {
					currentState = states.score;
				}
			}
			// move pipe and remove if outside of canvas
			p.x -= 2;
			if (p.x < -p.width) {
				this._pipes.splice(i, 1);
				i--;
				len--;
			}
		}
	},

	draw: function(ctx) {
		for (var i = 0, len = this._pipes.length; i < len; i++) {
			var p = this._pipes[i];
			s_pipeSouth.draw(ctx, p.x, p.y);
			s_pipeNorth.draw(ctx, p.x, p.y+80+p.height);
		}
	}
};

//Mouse on click event handler and state machine
function onpress(usrEvent) {

	switch (currentState) {

		// change state and update bird velocity
		case states.splash:
			currentState = states.game;
			bird.jump();
			break;

		// update bird velocity
		case states.game:
			bird.jump();
			break;

		case states.score:
			// get event position
			var mx = usrEvent.offsetX, my = usrEvent.offsetY;

			if (mx === null || my === null) {
				mx = usrEvent.touches[0].clientX;
				my = usrEvent.touches[0].clientY;
			}

			if (okButton.x < mx && mx < okButton.x + okButton.width &&
				okButton.y < my && my < okButton.y + okButton.height
			) {
				pipes.reset();
				currentState = states.splash;
				score = 0;
			}
			break;

	}
}

function main() {
	canvas = document.createElement("canvas");

	width = 400;
	height = 600;
  canvas.style.border = "1px solid #FFF";

	var usrEvent = "mousedown";

	document.addEventListener(usrEvent, onpress);

	canvas.width = width;
	canvas.height = height;

	ctx = canvas.getContext("2d");

	currentState = states.splash;
	document.body.appendChild(canvas);

	// initate graphics and okButton
	var img = new Image();
  img.src = "assets/sheet.png";
	img.onload = function() {
		initSprites(this);
		ctx.fillStyle = s_bg.color;

		okButton = {
			x: (width - s_buttons.Ok.width)/2,
			y: height - 200,
			width: s_buttons.Ok.width,
			height: s_buttons.Ok.height
		};

		run();
	};

}

function run() {
	var loop = function() {
		update();
		render();
		window.requestAnimationFrame(loop, canvas);
	};
	window.requestAnimationFrame(loop, canvas);
}

function update() {
	frames++;

	if (currentState !== states.score) {
		fgpos = (fgpos - 2) % 14;
	} else {
		// set bestScore score to maximum score
		bestScore = Math.max(bestScore, score);
		localStorage.setItem("bestScore", bestScore);
	}
	if (currentState === states.game) {
		pipes.update();
	}

	bird.update();
}

function render() {
	ctx.fillRect(0, 0, width, height);

	s_bg.draw(ctx, 0, height - s_bg.height);
	s_bg.draw(ctx, s_bg.width, height - s_bg.height);

	pipes.draw(ctx);
	bird.draw(ctx);

	s_fg.draw(ctx, fgpos, height - s_fg.height);
	s_fg.draw(ctx, fgpos + s_fg.width, height - s_fg.height);

	var width2 = width/2; // center of canvas

	if (currentState === states.splash) {
		s_splash.draw(ctx, width2 - s_splash.width/2, height - 400);
	}

	if (currentState === states.score) {
		// final game scores
		s_text.GameOver.draw(ctx, width2 - s_text.GameOver.width/2, height - 400);
		s_score.draw(ctx, width2 - s_score.width/2, height-340);
		s_buttons.Ok.draw(ctx, okButton.x, okButton.y);
		s_numberS.draw(ctx, width2 - 47, height - 304, score, null, 10);
		s_numberS.draw(ctx, width2 - 47, height - 262, bestScore, null, 10);

	} else {
  		s_numberB.draw(ctx, null, 20, score, width2);
	}
}

main();
