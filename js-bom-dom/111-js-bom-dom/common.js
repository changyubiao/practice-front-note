function addClassName(element, className) {
	// 1. 判断是否已经存在 
	var classes = element.className.split(' ');

	//  remove ""
	// 移除数组中空的元素 
	for (var i = 0; i < classes.length; i++) {
		if (classes[i] === "") {
			// 删除空的元素 
			classes.splice(i, 1);
		}
	}
	// console.log("remove null arr = ", classes);


	for (var i = 0; i < classes.length; i++) {
		if (classes[i] === className) {
			break
		}
	}

	// 没有找到要添加进去
	if (i === classes.length) {
		// 当前没有class 的情况
		if (classes.length == 0) {
			element.className = className;
		} else {
			// 没找到，添加进去
			element.className += ' ' + className;
		}
	} else {
		// 找到 ,不用加 
	}
}


function removeClassName(element, className) {
	var classes = element.className.split(' ');
	//  remove ""
	// 移除数组中空的元素 
	for (var i = 0; i < classes.length; i++) {
		if (classes[i] === "") {
			// 删除空的元素 
			classes.splice(i, 1);
		}
	}


	for (var i = 0; i < classes.length; i++) {
		if (classes[i] === className) {
			break
		}
	}


	// 找到
	if (i !== classes.length) {
		// 移除元素 
		classes.splice(i, 1);
		element.className = classes.join(' ');

	}

}
