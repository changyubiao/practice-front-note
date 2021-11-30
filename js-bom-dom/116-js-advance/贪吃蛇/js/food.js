(function(){
	function Food(x, y, width, height, backgroundColor){
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.backgroundColor = backgroundColor;
		this.divElement = null;
	}
	
	// 使用的CSS类名，HARD-CODE
	Food.prototype.CLASSNAME = 'food';
	Food.prototype.DEFAULTWIDTH = 20;
	Food.prototype.DEFAULTHEIGHT = 20;
	
	// 清除上一个食物，同时初始化一个新的食物
	//   map: 上级的element
	Food.prototype.init = function(map){
		// 1. 有map
		// 2. create a div，配置样式
		var element = document.createElement('div');
		// 3. 随机产生一个x位置和位置
		element.className = this.CLASSNAME;
		if(this.width){
			element.style.width = this.width + 'px';
		}
		
		if(this.height){
			element.style.height = this.height + 'px';
		}
		
		if(this.backgroundColor){
			element.style.backgroundColor = this.backgroundColor;
		}
		
		var width = this.width || this.DEFAULTWIDTH;
		var height = this.height || this.DEFAULTHEIGHT;
		
		if(this.x !== undefined){
			this.x = Math.floor(this.x/width) * width;
			if(this.x < 0){
				this.x = 0;
			}else if(this.x > map.offsetWidth - width){
				this.x = map.offsetWidth - width;
			}
		}else{
			this.x = Math.floor(Math.random() * (map.offsetWidth/width)) * width;
		}
		
		if(this.y !== undefined){
			this.y = Math.floor(this.y/height) * height;
			if(this.y < 0){
				this.y = 0;
			}else if(this.y > map.offsetHeight - height){
				this.y = map.offsetHeight - height;
			}
		}else{
			this.y = Math.floor(Math.random() * (map.offsetHeight/height)) * height;
		}

		element.style.left = this.x + 'px';
		element.style.top = this.y + 'px';
		
		//   2.1 删除上一个食物。
		remove.apply(this);
		
		// 4. 把div画出来
		map.appendChild(element);
		this.divElement = element;
	}
	
	Food.prototype.randomSet = function(map){
		var width = this.width || this.DEFAULTWIDTH;
		var height = this.height || this.DEFAULTHEIGHT;
		this.x = Math.floor(Math.random() * (map.offsetWidth/width)) * width;
		this.y = Math.floor(Math.random() * (map.offsetHeight/height)) * height;
	}
	
	// 清除上一个食物
	function remove(){
		var element = this.divElement;
		if(element){
			element.parentNode.removeChild(element);
			this.divElement = null;
		}
	}
	
	// 不用return,把 Food返回给全局
	window.Food = Food;
})();