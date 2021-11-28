function animation(element, leftEnd, duration, interval) {
	var leftStart = element.offsetLeft;

	var stepTmp = (leftEnd - leftStart) / (duration / interval);
	var step = Math.floor(stepTmp);
	if (step === 0) {
		step = stepTmp > 0 ? 1 : -1;
	}
	element.timer && clearInterval(element.timer);

	element.timer = setInterval(function() {
		// console.log(element.timer, step, element.offsetLeft - leftEnd);
		if (Math.abs(leftEnd - element.offsetLeft) <= Math.abs(step)) {
			element.style.left = leftEnd + 'px';
			clearInterval(element.timer);
		} else {
			element.style.left = (element.offsetLeft + step) + 'px';
		}
	}, interval);
}
