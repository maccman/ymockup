var SuperModel = new SuperClass();

SuperModel.extend({
  records:    {},
  attributes: [],
  isModel:    true,
  
  // records is an object, since we want
  // to be able to use non-integer ids
  recordsValues: function(){
    var result = []
    for (var key in this.records)
      result.push(this.records[key])
    return result;
  },
  
  setup: function(name){
    var result = new SuperClass(SuperModel);
    // Can't use .name, so we use .className
    result.className = name;
    return result;
  },
  
  rawFind: function(id){
    var record = this.records[id];
    if( !record ) throw "Unknown Record";
    return record;
  },

  findByAttribute: function(name, value){
    for(var key in this.records){
      if(this.records[key][name] == value){
        return this.records[key].dup();
      }
    }
  },

  find: function(id){
    var record = this.rawFind(id);
    return(record.dup());
  },

  all: function(){
    return this.dupArray(this.recordsValues());
  },

  first: function(){
    var record = this.recordsValues()[0];
    return(record && record.dup());
  },

  last: function(){
    var values = this.recordsValues()
    var record = values[values.length - 1];
    return(record && record.dup());
  },
  
  select: function(callback){
    var result = [];
    for(var key in this.records){
      if(callback(this.records[key]))
        result.push(this.records[key]);
    }
    return this.dupArray(result);
  },
  
  each: function(callback){
    for(var key in this.records) {
      callback(this.records[key]);
    }
  },

  count: function(){
    return this.recordsValues().length;
  },

  deleteAll: function(){
    for(var key in this.records){
      delete this.records[key];
    }
  },

  destroyAll: function(){
    for(var key in this.records){
      this.records[key].destroy();
    }
  },

  update: function(id, atts){
    this.find(id).updateAttributes(atts);
  },
  
  create: function(atts){
    var record = new this(atts);
    record.save();
    return record;
  },

  destroy: function(id){
    this.find(id).destroy();
  },
  
  replace: function(records){
    this.destroyAll();
    var self = this;
    jQuery.each(records, function(i, item){
      self.create(item);
    })
  },

  dupArray: function(array){
    return jQuery.each(array, function(i, item){
      return(item && item.dup());
    });
  }
});  
  
SuperModel.include({
  init: function(atts){
    this.newRecord = true;
    this.load(atts);
  },
  
  isNew: function(){
    return this.newRecord;
  },
  
  save: function(){
    this.isNew() ? this.create() : this.update();
  },
  
  destroy: function(){
    this.rawDestroy();
  },
  
  load: function(attributes){
    for(var name in attributes){
      this[name] = attributes[name];
    }
  },
  
  updateAttribute: function(name, value){
    this[name] = value;
    return this.save();
  },
  
  updateAttributes: function(attributes){
    this.load(attributes);
    return this.save();
  },
    
  dup: function(){
    return jQuery.extend({}, this); 
  },
  
  attributes: function(){
    var result = {};
    for(var i in this._class.attributes) {
      var attr = this._class.attributes[i];
      result[attr] = this[attr];
    }
    result.id = this.id;
    return result;
  },
  
  // Private
  
  generateID: function(){
    var last   = this._class.last();
    var lastId = last ? last.id : 0;    
    return(lastId += 1);
  },
  
  rawDestroy: function(){
    delete this._class.records[this.id];
  },
  
  rawCreate: function(){
    if( !this.id ) return;
    this._class.records[this.id] = this.dup();
  },
  
  create: function(){
    if( !this.id ) this.id = this.generateID();
    this.newRecord = false;
    this.rawCreate();
    return this.id;
  },
  
  rawUpdate: function(){
    var item = this._class.rawFind(this.id);
    item.load(this.attributes());
  },
  
  update: function(){
    this.rawUpdate();
    return true;
  },
});

// Callbacks

(function(){
  var capitalize = function(str) {
    return str.charAt(0).toUpperCase() + str.substring(1).toLowerCase();
  }
  
  var callbacks = ["create", "save", "update", "destroy"];
    
  SuperModel.defineCallback = function(name){
    var types = ["before", "after"];
    for(var i in types){
      var callback_name = types[i] + name
      this[callback_name] = [];
      this[types[i] + capitalize(name)] = function(cb){
        this[callback_name].push(cb);
      }
    }
  };

  for(var i in callbacks){
    var callback = callbacks[i];
    
    SuperModel.defineCallback(callback);
    
    (function(callback){
      SuperModel.fn[callback + "WithCallbacks"] = function(){
        var beforeCallbacks = this._class["before" + callback];
        for(var i in beforeCallbacks) { beforeCallbacks[i](this) }

        this[callback + "WithoutCallbacks"].apply(this, arguments);
        
        var afterCallbacks = this._class["after" + callback];
        for(var i in afterCallbacks) { afterCallbacks[i](this) }
      };
    }(callback))
    
    SuperModel.fn.aliasMethodChain(callback, "Callbacks");
  }
}());

// Setters and Getters

SuperModel.setters = function(obj){
  for(var key in obj)
    this.__defineSetter__(key, obj[key]);
};
SuperModel.fn.setters = SuperModel.setters;

SuperModel.getters = function(obj){
  for(var key in obj)
    this.__defineGetter__(key, obj[key]);
};
SuperModel.fn.getters = SuperModel.getters;

// Serialization

SuperModel.serializeRecords = function(){
  var result = {};
  for(var key in this.records)
    result[key] = this.records[key].attributes();
  return result;
};