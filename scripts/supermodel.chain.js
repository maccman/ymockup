var SuperModelChain = new SuperClass();

SuperModelChain.include({
  init: function(element, model, options){
    this.options   = options || {};
    this.singleton = this.options.singleton || false;
    
    this.element = jQuery(element);
    this.model   = model;
    this.select  = function(){ return true };
    
    this.element.data("model", model);
    this.element.chain(options);
    
    this.model.afterCreate(jQuery.proxy(this.create, this));
    this.model.afterUpdate(jQuery.proxy(this.update, this));
    this.model.afterDestroy(jQuery.proxy(this.destroy, this));
  },
  
  replace: function(value){
    if (this.singleton) {
      this.element.item("replace", value);
    } else {
      this.element.items("replace", value);
    }
  },
  
  create: function(item){
    if ( !item.id ) return;
    if (this.singleton) {
      var data = this.element.item();
      // Different item has been created
      if ( !data || data.id != item.id ) return;
      this.element.item(item);
    } else {
      if ( !this.select(item) ) return;
      this.element.items("add", item);
    }
  },
  
  update: function(item){
    if (this.singleton) {
      var data = this.element.item();
      if ( !data || data.id != item.id ) return;
      this.element.item(item);
    } else {
      if ( !this.select(item) ) return;
      var element = this.findItem(item.id)
      if ( element ) element.item(item);
    }
  },
  
  destroy: function(item){
    if (this.singleton) {
      this.element.item("replace", {});
    } else {
      if ( !this.select(item) ) return;
      var element = this.findItem(item.id);
      if ( element ) element.item("remove");
    }
  },
  
  findItem: function(id){
    var result = jQuery.grep(
      this.element.items(true), 
      function(element){
        return(jQuery(element).item().id == id);
      }
    );
    return jQuery(result);
  }
});

jQuery.fn.superModelChain = function(model, options) {
  return(new SuperModelChain(this, model, options));
};

jQuery.fn.itemModel = function(){
  var model = $(this).item("root").data("model");
  if ( !model ) throw "Unknown model";
  return model.find($(this).item().id);
};

if (typeof SuperModel != "undefined") {
  SuperModel.extend({
    chain: function(element, options){
      return(new SuperModelChain(element, this, options));
    }
  })
}