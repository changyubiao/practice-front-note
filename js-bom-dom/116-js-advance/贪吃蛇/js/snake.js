(function(){
	function Snake(headX, headY, width, height, length, headBackgroundColor, bodyBackgroundColor, direction){
		this.head = {
			x: headX,
			y: headY,
			backgroundColor: headBackgroundColor,
			divElement: null
		}
		this.body = [];
		this.body.bodyBackgroundColor = bodyBackgroundColor;
		this.length = length;
		this.width = width;
		this.height = height;
		this.direction = direction;
		this.gotFood = false;
	}
	
	Snake.prototype.CLASSNAME = 'snake';
	Snake.prototype.DEFAULTWIDTH = 20;
	Snake.prototype.DEFAULTHEIGHT = 20;
	Snake.prototype.DEFAULTLENGTH = 3;
	Snake.prototype.DEFAULTHEADBACKGROUNDCOLOR = '#f00';
	Snake.prototype.DEFAULTBODYBACKGROUNDCOLOR = '#ff0';
	Snake.prototype.DEFAULTDIRECTION = 'right';
	
	//初始，调整模型，调用repaint
	Snake.prototype.init = function(map) {
		// 1. 检查其他几个参数的正确性
		var width = this.width || this.DEFAULTWIDTH;
		var height = this.height || this.DEFAULTHEIGHT;
		this.length = this.length || this.DEFAULTLENGTH;
		this.direction = this.direction || this.DEFAULTDIRECTION;
		if(this.direction != 'left'
			&& this.direction != 'right'
			&& this.direction != 'up'
			&& this.direction != 'down'){
			console.error('direction is incorrect!:', this.direction);
			return false;
		}

		// 2. 检测head的正确
		if(this.head.x === undefined){
			this.head.x = this.length * width;
		}else{
			this.head.x = Math.floor(this.head.x/width) * width;
			if(this.head.x < 0){
				this.head.x = 0;
			}else if(this.head.x > map.offsetWidth - width){
				this.head.x = map.offsetWidth - width;
			}
		}
		
		if(this.head.y === undefined){
			this.head.y = height;
		}else{
			this.head.y = Math.floor(this.head.y/height) * height;
			if(this.head.y < 0){
				this.head.y = 0;
			}else if(this.head.y > map.offsetHeight - height){
				this.head.y = map.offsetHeight - height;
			}
		}
		// 参数的约定：
		//   1. CSS中用过class设定了，初始化时没有传入（undefined），保持this.*是 undefined，这样在JS repaint才能知道不要覆盖这个样式
		//   2. CSS中没有设定，初始化时有传入值， JS repaint应该按照传入值渲染
		//   3. CSS中没有设定，初始化时没有传入（undefined），this.*应该被更新为default值，JS repaint应该按照传入值渲染
		
		this.head.backgroundColor = this.head.backgroundColor || this.DEFAULTHEADBACKGROUNDCOLOR;
		
		// 3. 根据head，length，direction，我们要判断，蛇的初始位置会不会越界，对body进行初始化
		//    如果head越界了，我们把head挪到范围内；
		//    如果加上身子越界了，直接报错。
		// 王校长语录：什么时候可以很贴心很Nice帮助修正错误，什么时候直接报错
		//            比较简单的情况下可以帮忙修正错误，如果比较复杂直接报错。
		switch(this.direction){
			case 'right':
				if(this.head.x < (this.length - 1) * width){
					console.error('direction right, not enough space for body:', this.head.x, (this.length - 1) * width);
					return false;
				}
				for(var i = 0; i < this.length - 1; i++){
					var bodyBlock = {
						x: this.head.x - (i + 1) * width,
						y: this.head.y,
						backgroundColor: this.body.bodyBackgroundColor || this.DEFAULTBODYBACKGROUNDCOLOR,
						divElement: null
					}
					
					this.body.push(bodyBlock);
				}
				break;
			case 'left':
				if(this.head.x > map.offsetWidth - this.length * width){
					console.error('direction left, not enough space for body:', this.head.x, map.offsetWidth - this.length * width);
					return false;
				}
				
				for(var i = 0; i < this.length - 1; i++){
					var bodyBlock = {
						x: this.head.x + (i + 1) * width,
						y: this.head.y,
						backgroundColor: this.body.bodyBackgroundColor || this.DEFAULTBODYBACKGROUNDCOLOR,
						divElement: null
					}
					this.body.push(bodyBlock);
				}
				break;
			case 'down':
				if(this.head.y < (this.length - 1) * height){
					console.error('direction down, not enough space for body:', this.head.y, (this.length - 1) * height);
					return false;
				}
				for(var i = 0; i < this.length - 1; i++){
					var bodyBlock = {
						x: this.head.x,
						y: this.head.y - (i + 1) * height,
						backgroundColor: this.body.bodyBackgroundColor || this.DEFAULTBODYBACKGROUNDCOLOR,
						divElement: null
					}
					this.body.push(bodyBlock);
				}
				
				break;
			case 'up':
				if(this.head.y > map.offsetHeight - this.length * height){
					console.error('direction up, not enough space for body:', this.head.y, map.offsetHeight - this.length * height);
					return false;
				}
				
				for(var i = 0; i < this.length - 1; i++){
					var bodyBlock = {
						x: this.head.x,
						y: this.head.y + (i + 1) * height,
						backgroundColor: this.body.bodyBackgroundColor || this.DEFAULTBODYBACKGROUNDCOLOR,
						divElement: null
					}
					this.body.push(bodyBlock);
				}
				break;
			default:
				console.error('direction is incorrect!:', this.direction);
				return false;
		}
		
		// 4. 调用repaint
		repaint.call(this, map);
		
		return true;
	};
	
	//根据要求，移动蛇，调整模型，调用repaint
	Snake.prototype.move = function(map, food) {
		// 1. 是不是吃到食物，处理食物，同时调整蛇
		if(this.head.x === food.x && this.head.y === food.y){
			this.gotFood = true;
			
			food.randomSet(map);
			food.init(map);
		}
		
		// 2. 移动蛇
		//  1.1 body.pop()
		if(!this.gotFood){
			var tailBlock = this.body.pop();
			// 3. remove
			tailBlock.divElement.remove();
		}
		//  1.2 body.unshift(head)
		var headBlock = {
			x: this.head.x,
			y: this.head.y,
			backgroundColor: this.head.backgroundColor,
			divElement: null
		};
		
		// 3. remove
		this.head.divElement.remove();
		this.head.divElement = null;
		this.head.backgroundColor = this.body.bodyBackgroundColor || this.DEFAULTBODYBACKGROUNDCOLOR;
		this.body.unshift(this.head);
		//  1.3 renew head
		
		var width = this.width || this.DEFAULTWIDTH;
		var height = this.height || this.DEFAULTHEIGHT;
		
		switch(this.direction){
			case 'right':
				headBlock.x += width;
				break;
			case 'left':
				headBlock.x -= width;
				break;
			case 'down':
				headBlock.y += height;
				break;
			case 'up':
				headBlock.y -= height;
				break;
			default:
				console.error('direction is incorrect!:', this.direction);
				return false;
		}
		
		this.head = headBlock;
		
		
		// 4. repaint
		repaint.call(this, map);
		
		return true;
	};
	
	//负责根据模型以及divElments的情况，做DOM操作
	// head, body, divElement 是null，我们就会重画
	function repaint(map) {
		repaintBodyBlock.call(this, map, this.head);
		
		for(var i = 0; i < this.body.length; i++){
			repaintBodyBlock.call(this, map, this.body[i]);
		}
	};
	
	function repaintBodyBlock(map, bodyBlock){
		if(!bodyBlock.divElement){
			var div = document.createElement('div');
			div.className = this.CLASSNAME;
			div.style.left = bodyBlock.x + 'px';
			div.style.top = bodyBlock.y + 'px';
			if(this.width){
				div.style.width = this.width + 'px';
				div.style.height = this.height + 'px';
			}
			div.style.backgroundColor = bodyBlock.backgroundColor;
			bodyBlock.divElement = div;
			map.appendChild(div);
		}
	}
	
	window.Snake = Snake;
})();

