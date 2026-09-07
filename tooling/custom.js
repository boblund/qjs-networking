// ./tooling/custom.js
/*document.addEventListener( 'DOMContentLoaded', () => {
	const h3 = [ ...document.querySelectorAll( 'nav h3' ) ]
		.find( h3 => h3.textContent.trim() === 'Classes' );
	if ( h3 ){
		h3.hidden = true;
		h3.nextElementSibling.hidden = true;
	}
} );*/

document.addEventListener( 'DOMContentLoaded', () => {
	document.querySelectorAll( 'nav h3' ).forEach( h3 => {
		const list = h3.nextElementSibling;
		if ( !list || list.tagName !== 'UL' ) return;

		const key = 'nav-collapsed-' + h3.textContent.trim();
		const isCollapsed = sessionStorage.getItem( key ) !== 'open';

		list.style.display = isCollapsed ? 'none' : '';
		h3.classList.toggle( 'collapsed', isCollapsed );

		h3.style.cursor = 'pointer';
		h3.addEventListener( 'click', () => {
			const isHidden = list.style.display === 'none';
			list.style.display = isHidden ? '' : 'none';
			h3.classList.toggle( 'collapsed', !isHidden );
			sessionStorage.setItem( key, isHidden ? 'open' : 'closed' );
		} );
	} );
} );
