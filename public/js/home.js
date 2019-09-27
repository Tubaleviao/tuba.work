$(document).ready(() => {
	
	$('#u').focus();

	$('#btn-login').click(()=>{
		$('#signup').hide(100);
		$('#login').toggle(100);
		$('#u').focus();
	});
	
	$('#btn-signup').click(()=>{
		$('#login').hide(100);
		$('#signup').toggle(100);
		$('#us').focus();
	});
	
});