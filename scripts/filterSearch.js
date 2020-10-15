const loadFilterSearchEvent = (function () {
	function toggler() {
		const toggleOption = 'filter-toggle-option';
		htmlUtil('[' + toggleOption + ']').on('change', function () {
			const ID = htmlUtil(this).attr(toggleOption);
			const isChecked = htmlUtil(this).prop('checked');

			if (isChecked) {
				htmlUtil('#' + ID).slideDown();
			} else {
				htmlUtil('#' + ID).slideUp();
			}
		});
	}

	function searchBarToggle() {
		htmlUtil('.closeInput').on('click', function () {
			htmlUtil('.filterSearchInputWrap').fadeOut();
		});

		htmlUtil('.searchButton').on('click', function () {
			htmlUtil('.filterSearchInputWrap').fadeIn();
		});
	}

	return {
		toggler,
		searchBarToggle
	};
})();

htmlUtil(document).ready(function () {
	loadFilterSearchEvent.toggler();
	loadFilterSearchEvent.searchBarToggle();
});
