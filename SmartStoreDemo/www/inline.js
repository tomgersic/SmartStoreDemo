/**
 * UI Action Event Handlers
 **/
function regLinkClickHandlers() {
    var $j = jQuery.noConflict();
    
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
                                                           writeToSoup(soupName,response.items);
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

/**
 * Error Received
 **/
function logError(error) {
    SFHybridApp.logToConsole("Error: " + JSON.stringify(error));
}