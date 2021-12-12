describe('用于测试Snake构造函数', function(){
	
	it('初始化Snake,head, length', function(){
		var snake = new Snake();
	
		var map = document.querySelector('#map');
		snake.init(map);
		
		expect(snake.head.x).toBe(60);
		expect(snake.head.y).toBe(20);
		expect(snake.length).toBe(3);
		
		expect(snake.head.backgroundColor).toBe(Snake.prototype.DEFAULTHEADBACKGROUNDCOLOR);
		// head + body length == 3
		expect(snake.body.length).toBe(2);
		
		expect(snake.body[0].x).toBe(40);
		expect(snake.body[1].x).toBe(20);
		// expect(snake.divElement.className).toBe(Snake.prototype.CLASSNAME);
	});
	
	
});


