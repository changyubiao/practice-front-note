// test suites 测试集合
// test cases 测试用例
// check/expect 测试检查点/步骤

describe('用于测试Food构造函数', function() {
	it('初始化Food，不带参数，可以init, class名称被设定', function() {
		var food = new Food();

		var map = document.querySelector('#map');
		food.init(map);
		console.log('初始化Food，不带参数，可以init', food);

		// expect(true).toBe(true);
		expect(food.divElement.className).toBe(Food.prototype.CLASSNAME);
	});

	it('初始化Food，带参数，可以init', function() {
		var food = new Food(20, 20, 20, 20, '#f00');
		food.init(document.querySelector('#map'));
		console.log('初始化Food，带参数，可以init', food);
		expect(food.x).toBe(20);
		expect(food.y).toBe(20);
		expect(food.width).toBe(20);
		expect(food.height).toBe(20);
		expect(food.bgColor).toBe('#f00');
	});

	it('初始化Food，x调整，y调整，可以init', function() {
		var food = new Food(25, 45);
		food.init(document.querySelector('#map'));
		expect(food.x).toBe(20);
		expect(food.y).toBe(40);

	});

	it('初始化Food，x<0，y<0，可以init', function() {
		var food = new Food(-25, -45);
		food.init(document.querySelector('#map'));
		expect(food.x).toBe(0);
		expect(food.y).toBe(0);
	});

	it('初始化Food，x很大，y很大，可以init', function() {
		var food = new Food(12000, 10000);
		food.init(document.querySelector('#map'));
		expect(food.x).toBe(800 - 20);
		expect(food.y).toBe(600 - 20);
	});
});


describe('用于测试Snake构造函数', function() {
	it('初始化Snake，不带参数，可以init', function() {
		var snake = new Snake();
		expect(snake.init(document.querySelector('#map'))).toBe(true);
		console.log(snake);
		expect(snake.head.x).toBe(60);
		expect(snake.head.y).toBe(20);
		expect(snake.head.backgroundColor).toBe(Snake.prototype.DEFAULTHEADBACKGROUNDCOLOR);
		expect(snake.body.length).toBe(2);
		expect(snake.body[0].x).toBe(40);
		expect(snake.body[1].x).toBe(20);
	});
	// Snake(headX, headY, width, height, length, headColor, bodyColor, direction)
	it('初始化Snake，带参数，向左，可以init', function() {
		var snake = new Snake(125, 75, 30, 30, 2, '#000', '#ccc', 'left');
		expect(snake.init(document.querySelector('#map'))).toBe(true);
		expect(snake.head.x).toBe(120);
		expect(snake.head.y).toBe(60);
		expect(snake.head.bgColor).toBe('#000');
		expect(snake.body.length).toBe(1);
		expect(snake.body[0].x).toBe(150);
		expect(snake.body[0].y).toBe(60);
	});

	it('初始化Snake，带参数，向上，可以init', function() {
		var snake = new Snake(125, 75, 30, 30,3);
		snake.direction = 'up';
		expect(snake.init(document.querySelector('#map'))).toBe(true);
		
		// 测试一下长度
		expect(snake.body.length).toBe(2);
		expect(snake.head.x).toBe(120);
		expect(snake.head.y).toBe(60);
		expect(snake.body[0].x).toBe(120);
		expect(snake.body[0].y).toBe(90);
		expect(snake.body[1].x).toBe(120);
		expect(snake.body[1].y).toBe(120);
	});

	it('初始化Snake，带参数，向右，出界，可以init', function() {
		var snake = new Snake(60, 20, 20, 20, 5);
		expect(snake.init(document.querySelector('#map'))).toBe(false);
	});

	it('初始化Snake，带参数，向左，出界，可以init', function() {
		var snake = new Snake(740, 20, 20, 20, 4);
		snake.direction = 'left';
		expect(snake.init(document.querySelector('#map'))).toBe(false);
	});

	it('初始化Snake，带参数，向下，出界，可以init', function() {
		var snake = new Snake(20, 60, 20, 20, 5);
		expect(snake.init(document.querySelector('#map'))).toBe(false);
	});

	it('初始化Snake，带参数，向上，出界，可以init', function() {
		var snake = new Snake(20, 540, 20, 20, 4);
		expect(snake.init(document.querySelector('#map'))).toBe(false);
	});
});

// 作业：1. 测试用例补齐
//       2. 多个食物



// 第017 天  hour: 54 min
