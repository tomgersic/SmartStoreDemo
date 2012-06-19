<div id="home" data-role="page" data-add-back-btn="true">
  <div data-role="header"><h1>Categories</h1></div>
  <div data-role="content">
    <h2>Select a Category Below:</h2>
    <ul data-role="listview" data-inset="true">
        <li><a href="#category-items?category=animals">Animals</a></li>
        <li><a href="#category-items?category=colors">Colors</a></li>
        <li><a href="#record-list">Record List</a></li>
    </ul>
  </div>

</div>
<div id="category-items" data-role="page" data-add-back-btn="true">
  <div data-role="header"><h1></h1></div>
  <div data-role="content"></div>
</div>​
<div id="record-list" data-role="page" data-add-back-btn="true">
  <div data-role="header"><h1></h1></div>
  <div data-role="content"></div>
</div>​

=====

var recordData = [ {
    "attributes" : {
      "type" : "Property__c",
      "url" : "/services/data/v24.0/sobjects/Property__c/a0DE0000000C4PzMAK"
    },
    "Id" : "a0DE0000000C4PzMAK",
    "Name" : "Model Metrics",
    "Address__c" : "600 w. Chicago",
    "Agreed_Selling_Price__c" : 1.0E9
  } ];

function showRecordList(urlObj,options) {
	console.log('Show Record List');

    // The pages we use to display our content are already in
    // the DOM. The id of the page we are going to write our
    // content into is specified in the hash before the '?'.
    pageSelector = urlObj.hash.replace( /\?.*$/, "" );	

    console.log(pageSelector);

    //get the page from the dom
    var $page = $( pageSelector );
     
    // Get the header for the page.
    $header = $page.children( ":jqmData(role=header)" );
    
    // Get the content area element for the page.
    $content = $page.children( ":jqmData(role=content)" ),

	// The markup we are going to inject into the content
    // area of the page.
    markup = "<p>Records Returned</p><ul data-role='listview' data-inset='true'>";

    //loop records
    for(record in recordData)
	{
		console.log(recordData[record]);
		var recordFields = "";
		for(key in recordData[record]) {
			if(key != 'Name' && key != 'attributes') {
				recordFields += "<b>"+key+":</b> "+recordData[record][key]+"<br/>";
			}
		}
		markup += "<li id='"+recordData[record].Id+"'><h3 class='ui-li-heading'>"+recordData[record].Name+"</h3><p class='ui-li-desc'>"+recordFields+"</p></li>";
	}


	

	markup += "</ul>";
    // Find the h1 element in our header and inject the name of
    // the category into it.
    $header.find( "h1" ).html( 'Records' );

    // Inject the category items markup into the content element.
    $content.html( markup );


    // Pages are lazily enhanced. We call page() on the page
    // element to make sure it is always enhanced before we
    // attempt to enhance the listview markup we just injected.
    // Subsequent calls to page() are ignored since a page/widget
    // can only be enhanced once.
    $page.page();

    // Enhance the listview we just injected.
    $content.find( ":jqmData(role=listview)" ).listview();

    // We don't want the data-url of the page we just modified
    // to be the url that shows up in the browser's location field,
    // so set the dataUrl option to the URL for the category
    // we just loaded.
    options.dataUrl = urlObj.href;

    // Now call changePage() and tell it to switch to
    // the page we just modified.
    $.mobile.changePage( $page, options );    

}


// Listen for any attempts to call changePage().
$(document).bind( "pagebeforechange", function( e, data ) {
    // We only want to handle changePage() calls where the caller is
    // asking us to load a page by URL.
    if ( typeof data.toPage === "string" ) {
        // We are being asked to load a page by URL, but we only
        // want to handle URLs that request the data for a specific
        // category.
        var u = $.mobile.path.parseUrl( data.toPage ),
            recordListRegex = /^#record-list/;

        if( u.hash.search(recordListRegex) !== -1 ) {
            // We're being asked to display the items for a specific category.
            // Call our internal method that builds the content for the category
            // on the fly based on our in-memory category data structure.
            showRecordList(u,data.options);

            // Make sure to tell changePage() we've handled this call so it doesn't
            // have to do anything.
            e.preventDefault();
        }
    }
});
​