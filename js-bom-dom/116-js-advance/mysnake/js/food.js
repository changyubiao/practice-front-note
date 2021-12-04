(
	function() {

		function Food(x, y, width, height, bgColor) {
			// Food 的构造函数 
			// 初始化 食物
			this.x = x || 0;
			this.y = y || 0;
			this.width = width || 20;
			this.height = height || 20;
			this.bgColor = bgColor;

			this.divElement = null;


		}

		// 使用css 类名 hard-code
		Food.prototype.CLASSNAME = 'food';
		// DEFAULT
		Food.prototype.DEFAULTTWIDTH = 20;
		Food.prototype.DEFAULTHEIGHT = 20;


		// 方法 
		// map 是上级的element 
		Food.prototype.init = function init(map) {
			/*
			
			生成一个食物， 在地图上 生成一个合法的食物， 合法 就是指 不能超出map的 大小
			
			清除 上一个食物， 
			同时初始化一个新的食物
			
			*/

			/*
			   1.map  
			   2. create div  配置 
					2-1. 删除上一个 食物 
			   3. 随机产生一个 x 位置， y 位置
			   4. 画 div  
			   */

			var element = document.createElement('div');

			element.className = this.CLASSNAME;

			if (this.width) {
				element.style.width = this.width + 'px';
			}

			if (this.height) {
				element.style.height = this.height + 'px';
			}

			if (this.bgColor) {
				element.style.backgroundColor = this.bgColor;
			}

			var width = this.width || this.DEFAULTTWIDTH;
			var height = this.height || this.DEFAULTHEIGHT;

			// 这里处理一下 
			if (this.x) {
				// 转成 width 的整数倍
				this.x = Math.floor(this.x / width) * width;
				if (this.x < 0) {
					this.x = 0
				} else if (this.x > map.offsetWidth - width) {
					this.x = map.offsetWidth - width;
				}

			} else {
				this.x = Math.floor(Math.random() * (map.offsetWidth / width)) * width;

			}

			if (this.y !== undefined) {
				this.y = Math.floor(this.y / height) * height;
				if (this.y < 0) {
					this.y = 0
				} else if (this.y > map.offsetHeight - height) {
					this.y = map.offsetHeight - height;
				}
			} else {
				this.y = Math.floor(Math.random() * (map.offsetHeight / height)) * height;

			}

			// console.log('Food: x:',this.x,'y:',this.y);

			element.style.left = this.x + 'px';
			element.style.top = this.y + 'px';


			// 2-1. 删除上一个食物 
			remove.apply(this);

			//  4. 画 div  
			map.appendChild(element);
			this.divElement = element;

			console.log("debug:food.js: Food(x=", this.x, ",y=", this.y, ")");
		}


		Food.prototype.randomSet = function(map) {
			var width = this.width || this.DEFAULTTWIDTH;
			var height = this.height || this.DEFAULTHEIGHT;
			this.x = Math.floor(Math.random() * (map.offsetWidth / width)) * width;
			this.y = Math.floor(Math.random() * (map.offsetHeight / height)) * height;

		};

		window.Food = Food;

		function remove() {
			/*
			清除上一个食物
			*/

			var element = this.divElement;

			if (element) {
				// console.log('debug:remove element:',element);
				element.parentNode.removeChild(element);
				this.divElement = null;

			}

		}


	}



)();





/*


Question:

Food 每次给相同的值， 初始化结果为啥不一样呢？ 




*/



// console.log(Food);
