const Utils = (function () {
	function dispatchEvent(eventName, data = null) {
		return document.dispatchEvent(new CustomEvent(eventName, data));
	}

	function getStorageItem(key) {
		if (!!key) {
			try {
				return JSON.parse(localStorage.getItem(key));
			} catch (e) {
				return localStorage.getItem(key);
			}
		}
	}

	function setStorageItem(key, value) {
		return localStorage.setItem(key, value);
	}

	return {
		dispatchEvent,
		getStorageItem,
		setStorageItem
	};
})();
