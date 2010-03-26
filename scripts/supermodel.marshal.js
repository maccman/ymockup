var SuperModelMarshal = {
  storageKey: null,
  
  extended: function(base){
    base.storageKey = "sm-" + base.className;
    jQuery(window).unload(function(){
      var records = JSON.stringify(base.serializeRecords());
      localStorage.setItem(base.storageKey, records);
    });
    jQuery(function(){
      var rawRecords  = localStorage.getItem(base.storageKey);
      if ( !rawRecords ) return;
      rawRecords  = JSON.parse(rawRecords);
      var records = {}
      for (var key in rawRecords) {
        records[key] = new base(rawRecords[key]);
        records[key].newRecord = false;
      }
      base.records = records;
    });
  }
}