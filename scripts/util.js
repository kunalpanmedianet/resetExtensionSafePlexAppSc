const Utils = (function () {
	function dispatchEvent(eventName, data) {
		return document.dispatchEvent(new CustomEvent(eventName, data));
	}

	return {
		dispatchEvent
	};
})();
