/**
 * UI Action Event Handlers
 **/
function regLinkClickHandlers() {
    var $j = jQuery.noConflict();
    
    $j('#link_show_records').click(function(){
        console.log('show records clicked');
        showRecordList("#record-list");
    });

    $j('#link_query_sfdc').click(function() {
                                 SFHybridApp.logToConsole("Query SFDC Button Clicked");
                                 var soupName = $j("#text_smartstorename").val();
                                 var indexDefinition = $j("#textarea_indexdef").val();
                                 var queryString = $j("#text_query").val();
                                 
                                 SFHybridApp.logToConsole("Creating SmartStore Soup Named: "+soupName);
                                 registerSoup(soupName,indexDefinition);
                                 
                                 
                                 SFHybridApp.logToConsole("Querying REST API: "+queryString);
                                 
                                 //query SFDC with ForceTK
                                 window.forcetkClient.ajax(queryString,function(response){
                                                           writeToSoup(soupName,response.records);
                                                           showRecordList("#record-list",response.records);
                                                           },logError);
                                 
                                 
                                 });
    
    $j('#link_query_smartstore').click(function() {
                                       SFHybridApp.logToConsole("Query Smartstore Button Clicked");
                                       var soupName = $j("#text_smartstorename").val();
                                       querySoup(soupName);
                                       });
    
    $j('#link_fetch_sfdc_accounts').click(function() {
                                          SFHybridApp.logToConsole("link_fetch_sfdc_accounts clicked");
                                          forcetkClient.query("SELECT Name FROM Account", onSuccessSfdcAccounts, onErrorSfdc); 
                                          });
    
    $j('#link_reset').click(function() {
                            SFHybridApp.logToConsole("link_reset clicked");
                            clearOfflineSoups();
                            });

    $j('#link_clearlog').click(function() {
                            SFHybridApp.logToConsole("link_clearlog clicked");
                            clearLog();
                            });
    
    $j('#link_logout').click(function() {
                             SFHybridApp.logToConsole("link_logout clicked");
                             SalesforceOAuthPlugin.logout();
                             });
}



//Keep a list of registered SmartStore Soup names. Might come in handy on a rainy day...
var registeredSoups = new Array();

/**
 * Write Response records to a Soup
 **/
function writeToSoup(soupName,records) {
    SFHybridApp.logToConsole("Writing "+records.length+" records to Soup "+soupName);
    
    if(hasSmartstore())
    {
        $j.each(records, function(index,value) {
                SFHybridApp.logToConsole("record "+index+": "+JSON.stringify(value));
                });
        
        navigator.smartstore.upsertSoupEntries(soupName,records, function(){
                                               SFHybridApp.logToConsole("Soup Upsert Success");        
                                               }, logError);
    }
}

/**
 * Register a SmartStore Soup
 **/
function registerSoup(soupName,indexDefinition) {
    SFHybridApp.logToConsole("registerSoup()");      
    if (hasSmartstore()) {
        registeredSoups.push(soupName);
        SFHybridApp.logToConsole("Registering soup "+soupName+" with indexes "+indexDefinition);
        
        //yes, I know, "indices". Meh.
        var indexes = $j.parseJSON(indexDefinition);
        
        navigator.smartstore.registerSoup(soupName,
                                          indexes,                                  
                                          function(){
                                          SFHybridApp.logToConsole(soupName+" Soup Registered")
                                          }, 
                                          logError);
    }
}

/**
 * Clear Any Offline Soups
 **/
function clearOfflineSoups(callback) {
    SFHybridApp.logToConsole("clearOfflineSoups");
    if (hasSmartstore()) {
        var cbCount = 0;
        var success = function() {
            SFHybridApp.logToConsole('cleared soup');
            if(++cbCount == 2 && typeof callback == 'function') callback();
        }
        
        $j.each(registeredSoups, function(index,record) {
                SFHybridApp.logToConsole("Removing Soup: "+record);
                navigator.smartstore.removeSoup(record, function(){
                                                SFHybridApp.logToConsole("Soup removed: "+record);
                                                }, logError);
                });
    }
}

/**
 * Query Soup, post contents to log
 **/
function querySoup(soupName) {
    SFHybridApp.logToConsole("Querying Soup "+soupName);
    if (hasSmartstore()) {
        var querySpec = navigator.smartstore.buildAllQuerySpec("id", null, 20);
        
        navigator.smartstore.querySoup(soupName,querySpec,
                                       function(cursor) { onSuccessQuerySoup(cursor); },
                                       logError);
    }
}

function onSuccessQuerySoup(cursor) {
    console.log("onSuccessQuerySoup()");
    var entries = [];
    
    function addEntriesFromCursor() {
        var curPageEntries = cursor.currentPageOrderedEntries;
        $j.each(curPageEntries, function(i,entry) {
                entries.push(entry);
                });
    }
    
    addEntriesFromCursor();
    
    while(cursor.currentPageIndex < cursor.totalPages - 1) {
        navigator.smartstore.moveCursorToNextPage(cursor, addEntriesFromCursor);
    }
    
    navigator.smartstore.closeCursor(cursor);
    SFHybridApp.logToConsole("***ENTRIES***");
    SFHybridApp.logToConsole(JSON.stringify(entries));
    SFHybridApp.logToConsole(entries.length);
}

/**
 * Check if SmartStore Plugin Exists
 **/
function hasSmartstore() {
    SFHybridApp.logToConsole("hasSmartstore()");
    if (PhoneGap.hasResource("smartstore") && navigator.smartstore) {
        SFHybridApp.logToConsole("SmartStore plugin found and loaded");
        return true;
    }
    SFHybridApp.logToConsole("SmartStore plugin not found");
    return false;
}


/**
 * Clear Log
 **/
function clearLog() {
    jQuery("#console").html("");
}

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


function showRecordList(urlObj,recordData) {
    console.log('Show Record List');

    // The pages we use to display our content are already in
    // the DOM. The id of the page we are going to write our
    // content into is specified in the hash before the '?'.
    pageSelector = urlObj;  

    console.log(pageSelector);

    //get the page from the dom
    var $page = $j( pageSelector );

    
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
    //options.dataUrl = urlObj.href;

    // Now call changePage() and tell it to switch to
    // the page we just modified.
    $j.mobile.changePage( $page );    

}


/**
 * Error Received
 **/
function logError(error) {
    SFHybridApp.logToConsole("Error: " + JSON.stringify(error));
}