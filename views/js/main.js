/*window.onload = function() {
	
	$("#init").click(function () {
		var array = $(".jsondiffpatch-right-value");
		var index = 1;
	);

	$("#down").click(function () {
		$('html, body').scrollTo(array[1], 1000, {offset: 20});
		index++;
	});

	$("#up").click(function () {
		var array = $(".jsondiffpatch-right-value");
		$('html, body').scrollTo(array[index], 1000, {offset: 20});
		index--;
	});
};*/

$(document).ready(function() {
	
	$("#init").click(function () {
		array = $(".jsondiffpatch-right-value");
		index = 0;
		console.log("data met");
	});

	$("#down").click(function () {
		$('html, body').scrollTo(array[index], 100, {offset: -20});
		index++;
		console.log(index);
	});

	$("#up").click(function () {
		var array = $(".jsondiffpatch-right-value");
		$('html, body').scrollTo(array[index], 100, {offset: -20});
		index--;
		console.log(index);
	});
		
    $(".directory").click(function () {
        $(".form-control").val($(this).text());
		console.log($(this));
    });
});