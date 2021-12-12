// Snake.js 初始化 
console.log('debug:Snake.js 初始化  ...');
(
	function() {
		/*
		
		Snake 构造函数 
		*/
		function Snake(headX, headY, width, height, length, headColor, bodyColor, direction) {
			/*
			每个方块的 width ,height
			width: 每个 方块的宽度
			*/

			this.head = {
				x: headX,
				y: headY,
				bgColor: headColor,
				divElement: null
			}



			this.body = [];
			this.body.bodyColor = bodyColor;


			this.width = width;
			this.height = height;
			// snake 的长度
			this.length = length;

			this.direction = direction;

			this.gotFood = false;

		}


		// 使用css 类名 hard-code
		Snake.prototype.CLASSNAME = 'snake';
		// DEFAULT
		Snake.prototype.DEFAULTTWIDTH = 20;
		Snake.prototype.DEFAULTHEIGHT = 20;

		// 默认的长度
		Snake.prototype.DEFAULTLENGTH = 3;
		// 默认背景色 head 颜色
		Snake.prototype.DEFAULTHEADBGCOLOR = '#FFFF00';

		//默认 身体颜色
		Snake.prototype.DEFAULTBODYBGCOLOR = '#FF0000';


		// 默认 的方向
		Snake.prototype.DEFAULTDIRECTION = 'right';



		// 定义几个方向常量名称
		Snake.prototype.LEFT = 'left';
		Snake.prototype.RIGHT = 'right';
		Snake.prototype.UP = 'up';
		Snake.prototype.DOWN = 'down';



		Snake.prototype.init = function(map) {
			/*
			初始化工作 
			
			调整模型， 调用repaint 
			
			1. 检查 head 正确
			2. 检查其他的参数
			3. 根据 head , length,direction,蛇的初始位置会不会出去地图的范围,对body初始化工作
			
			// 如果head 越界了， 我们把head 挪出范围内
			//  如果加上身子 越界了， 直接报错 
			
			4. 调用repaint  
			
			王校长语录： 什么时候 可以很贴心的修正错误，什么时候直接报错? 
				1 比较简单的情况下，可以修正错误。 如果比较复杂,还不如直接报错。
			
			*/

			// 2.检查其他的参数
			var width = this.width || this.DEFAULTTWIDTH;
			var height = this.height || this.DEFAULTHEIGHT;
			// length 没有在 CSS 
			this.length = this.length || this.DEFAULTLENGTH;


			// direction parameter check 
			this.direction = this.direction || this.DEFAULTDIRECTION;

			if (this.direction != 'left' &&
				this.direction != 'right' &&
				this.direction != 'up' &&
				this.direction != 'down') {
				// this.direction
				console.error('direction is incorrect!  direction:', this.direction);
				return false;
			}


			// x 的边界值
			var widthBorder = map.offsetWidth - width;
			// y 的边界值
			var heightBorder = map.offsetHeight - height;


			// 定义几个方向常量名称
			const LEFT = 'left';
			const RIGHT = 'right';
			const UP = 'up';
			const DOWN = 'down';





			// check parameter x 的范围
			if (this.head.x === undefined) {
				this.head.x = this.length * width;
			} else {
				// 变成整数倍使数据有效
				this.head.x = Math.floor(this.head.x / width) * width;
				// console.log('head.x', this.head.x);
				if (this.head.x < 0) {
					this.head.x = 0;
				} else if (this.head.x > widthBorder) {
					this.head.x = widthBorder;
				}

			}


			// check parameter y 的范围
			if (this.head.y === undefined) {
				// 假设在第二行
				this.head.y = height;
			} else {
				if (this.head.y < 0) {
					this.head.y = 0;
				} else if (this.head.y > heightBorder) {
					this.head.y = heightBorder;
				} else {
					// 合法范围的数值 
					// 变成整数倍使数据有效
					this.head.y = Math.floor(this.head.y / height) * height;
				}

			}



			// head color
			// 参数的约定 
			// 1. CSS中 使用过class 设定了， 初始化时候没有传入(undefined)， 保持 this.* 是 undefined,
			// 这样在JS repaint 才能知道 要不要覆盖这个参数

			// 2. CSS中 没有设定,初始化有传入值， js repaint 应该按照值 进行渲染  
			// 3. CSS中 没有设定, 初始化没有传入值(undefined) this.*  应该更新为 default值，  JS repaint 应该按照传入值 进行渲染
			// if (this.head.bgColor  === undefined){
			// 	this.head.bgColor = this.DEFAULTHEADBGCOLOR;
			this.head.bgColor = this.head.bgColor || this.DEFAULTHEADBGCOLOR;


			// 根据方向  初始化body 
			switch (this.direction) {
				case RIGHT:
					console.log('enter right switch case ');
					if (this.head.x < (this.length - 1) * width) {
						console.error('direction:right not enough space for body: x:', this.head.x,
							'this.length* width', (this.length - 1) * width)
						return false;
					}

					for (var i = 0; i < this.length - 1; i++) {
						/*
						this.head = {
							x: headX,
							y: headY,
							bgColor: headColor,
							divElement: null 
						}
						*/
						var bodyBlock = {
							x: this.head.x - (i + 1) * width,
							y: this.head.y,
							bgColor: this.body.bodyColor || this.DEFAULTBODYBGCOLOR,
							divElement: null
						}
						this.body.push(bodyBlock);
					}
					break;
				case LEFT:
					console.log('enter left switch case ');
					if (this.head.x > map.offsetWidth - this.length * width) {
						/*
						往 左 走 ， 要保证 x 小于  （ 整个地图的宽度  - 是自身的长度）， 要不然 放不下x , 没有办法 往左甩，会撞到地图
						所以这里进行检查
						*/

						console.error('direction:left not enough space for body: x:', this.head.x,
							'map.offsetWidth * this.length* width', map.offsetWidth * this.length * width);
						return false;
					}

					// 这里 初始化body  
					for (var i = 0; i < this.length - 1; i++) {

						var bodyBlock = {
							x: this.head.x + (i + 1) * width,
							y: this.head.y,
							bgColor: this.body.bodyColor || this.DEFAULTBODYBGCOLOR,
							divElement: null
						}
						this.body.push(bodyBlock);
					}

					break;
				case UP:
					console.log('enter up switch case ');
					if (this.head.y > map.offsetHeight - this.length * height) {
						/*
							
						*/

						console.error('direction:up not enough space for body: y:', this.head.y,
							'map.offsetHeight - this.length * height', mmap.offsetHeight - this.length * height);
						return false;
					}

					// 这里 初始化body  
					for (var i = 0; i < this.length - 1; i++) {

						var bodyBlock = {
							x: this.head.x,
							y: this.head.y + (i + 1) * height,
							bgColor: this.body.bodyColor || this.DEFAULTBODYBGCOLOR,
							divElement: null
						}
						this.body.push(bodyBlock);
					}

					break;

				case DOWN:
					/*
					
					 y >  (length-1) * height
					*/
					console.log('enter down switch case ');
					if (this.head.y < (this.length - 1) * height) {
						console.error('direction:down not enough space for body: y:', this.head.y,
							'(this.length-1) * width', (this.length - 1) * height);
						return false;
					}

					for (var i = 0; i < this.length - 1; i++) {
						var bodyBlock = {
							x: this.head.x,
							y: this.head.y - (i + 1) * height,
							bgColor: this.body.bodyColor || this.DEFAULTBODYBGCOLOR,
							divElement: null
						}
						this.body.push(bodyBlock);
					}
					break;
				default:
					console.error('Unknown direction! direction:', this.direction);
					return false;

			}

			// 4. 调用repaint  
			this.repaint(map);
			return true;


		}


		Snake.prototype.repaint = function(map) {
			/*
			负责根据模型 以及 divelements的情况 调整逻辑
			
			重绘 自己的身体
			
			
			head  body divElement 是null ， 会触发重绘 
			
			*/

			repaintBlock.call(this, map, this.head);

			// 初始化蛇的body，并且挂到 map 上面
			for (let i = 0; i < this.body.length; i++) {
				repaintBlock.call(this, map, this.body[i]);
			}

		}

		function repaintBlock(map, block) {
			/*
			map: 地图
			
			block : body 的一部分，一节身体
			*/
			if (!block.divElement) {
				var div = document.createElement('div');
				div.className = this.CLASSNAME;


				div.style.left = block.x + 'px';
				div.style.top = block.y + 'px';


				if (this.width) {
					div.style.width = this.width + 'px';
				}
				if (this.height) {
					div.style.height = this.height + 'px';
				}

				div.style.backgroundColor = block.bgColor;

				block.divElement = div;

				// 挂上去 ，放到 map 里面 
				// map.appendChild(block.divElement);
				map.appendChild(div);

			}
		};


		// 根据要求 移动蛇，调整模型， 调用 repaint
		Snake.prototype.move = function(map, food) {
			/*
			1.移动蛇
			
				1.1 body.pop();
				1.2 body.unshift(newHead);
				1.3 renew head 
			
			2. 是不是要吃到食物， 处理食物，同时调整蛇
			3. 删尾部结点， remove
			4. repaint 重绘自己
			
			移动 删尾  添加头部 
		
			
			this.head = {
				x: headX,
				y: headY,
				bgColor: headColor,
				divElement: null
			}
			*/


			// todo hour:105min


			// 1. 是不是吃到食物 ，处理食物
			if (this.head.x === food.x && this.head.y === food.y) {
				this.gotFood = true;
				// 重新初始化食物 
				food.randomSet(map);
				food.init(map);
		
			}

			
			if (!this.gotFood) {
				// 删除尾部
				var tailBlock = this.body.pop();
				tailBlock.divElement.remove();
				tailBlock = null;
			}


			// 添加 head 
			var headBlock = {
				x: this.head.x,
				y: this.head.y,
				bgColor: this.head.bgColor,
				divElement: null

			}


			// 3.remove head 
			this.head.divElement.remove();
			// 这样保证可以重绘成功。要不不会重绘这个 block 
			this.head.divElement = null;
			// 改变颜色
			this.head.bgColor = this.body.bodyColor || this.DEFAULTBODYBGCOLOR;
			this.body.unshift(this.head);


			// renew head 
			// this.head = headBlock;
			var width = this.width || this.DEFAULTTWIDTH;
			var height = this.height || this.DEFAULTHEIGHT;

			switch (this.direction) {
				case this.RIGHT:
					// headBlock.x
					headBlock.x += width;
					break;
				case this.LEFT:
					headBlock.x -= width;
					break;
				case this.UP:
					headBlock.y -= height;
					break;
				case this.DOWN:
					headBlock.y += height;
					break;
				default:
					console.error('move:error .... direction:', this.direction);
					return false;
			}

			// new head 
			this.head = headBlock;

			// 重绘自己
			this.repaint(map);
			return true;

		};


		Snake.prototype.remove = function(map, food) {
			/*
		
				移动 删尾  添加头部 
			*/



		};


		
		
		Snake.prototype.isAlive = function(map) {
			/*
			判断 蛇 是否活着 
			
			返回 true 表示活着
			
			返回 false 表示死亡
			*/
		
			if (this.head.x < 0 || this.head.x >= map.offsetWidth ||
				this.head.y < 0 || this.head.y >= map.offsetHeight) {
				// 死亡 
				return false;
			}
		
			for (var i = 0; i < this.body.length; i++) {
				// head == body[i] 
				if (this.head.x == this.body[i].x && this.head.y == this.body[i].y) {
					return false;
				}
			}
			return true;
		}
		
		

		// 绑定到全局空间里面
		window.Snake = Snake;

	}

)();


console.log('window:Snake done...', Snake);
