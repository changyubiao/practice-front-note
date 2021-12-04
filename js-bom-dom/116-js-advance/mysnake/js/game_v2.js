// Snake.js 初始化 
console.log('debug:game.js 初始化  ...');


(function() {

	function Game(map) {
		this.food = new Food();
		this.snake = new Snake();
		this.map = map;


	}

	Game.prototype.INTERVAL = 300;
	Game.prototype.SPEEDUP = 1.5;
	//  this.SPEEPUP

	Game.prototype.init = function() {
		/*
		游戏的控制游戏  核心逻辑
		
		*/

		this.food.init(this.map);

		this.snake.init(this.map, this.food);

		this.bindKey();
		runGame.call(this);

	}


	function runGame() {

		var interval = this.INTERVAL;
		
		console.log('cur interval:', interval);

		var timer = setInterval(function() {
			this.snake.move(this.map, this.food);

			if (this.snake.head.x < 0 || this.snake.head.x >= this.map.offsetWidth ||
				this.snake.head.y < 0 || this.snake.head.y >= this.map.offsetHeight) {
				console.warn('snake 撞墙了。。。')
				clearInterval(timer);
				alert('game over! refresh again');
			}


			if (this.snake.gotFood) {
				// 获取食物后 加快速度
				clearInterval(timer);
				// 加速
				interval = Math.ceil(interval / this.SPEEDUP);
				console.log('cur interval:', interval);
				this.snake.gotFood = false;
				timer = setInterval(arguments.callee.bind(this), interval);
			}


		}.bind(this), this.INTERVAL);

	}

	Game.prototype.bindKey = function() {


		// 添加键盘事件
		document.addEventListener('keydown', function(e) {
			console.log('key pressed', e.keyCode);
			/*
			up  38 
			down 40 
			
			left 37 
			right 39 
			
			*/

			switch (e.keyCode) {
				case 37:
					if (this.snake.direction != 'right') {
						this.snake.direction = 'left';
					}

					break;
				case 38:
					if (this.snake.direction != 'down') {
						this.snake.direction = 'up';
					}
					break;
				case 39:
					if (this.snake.direction != 'left') {

						this.snake.direction = 'right';
					}
					break;
				case 40:
					if (this.snake.direction != 'up') {
						this.snake.direction = 'down';
					}
					break;
				default:
					break;
			}

		}.bind(this));


	}


	window.Game = Game;
})();


console.log('debug:game.js done  ...');


// hour: 132:30
