jQuery.fn.outerHTML = function() {
  return $('<div>').append( this.eq(0).clone() ).html();
};

jQuery.fn.dataName = function(){
  return $(this).attr("data-name");
};

var Type = SuperModel.setup("Type");
Type.attributes = ["name", "html"];

Type.extend({
  forName: function(name){
    return this.findByAttribute("name", name);
  }
});

var Element = SuperModel.setup("Element");
Element.attributes = ["typeID", "html", "setup", "ref"];

Element.extend({
  append: function(){
    this.each(function(el){ el.append(); });
  },
  
  topZIndex: function(){
    var result = 0;
    this.each(function(el){
      if(el.zindex >= result)
        result = el.zindex;
    });
    return result;
  }
});

Element.extend(SuperModelMarshal);

Element.include({
  type: function(){
    return Type.find(this.typeID);
  },
  
  append: function(){
    var html = this.html;
    if ( !html ) html = this.type().html;
    this.ref = $(html);
    
    if ( !this.setup ) {
      this.setup = true;
      
      this.ref.addClass("ymockupType");
      
      this.ref.css({
        position: "absolute",
        left: "20%",
        top: "20%"
      });
            
      this.ref.css("z-index", this._class.topZIndex() + 1);  
    }
    
    // Cancel null to make input draggable
    this.ref.draggable({cancel:null, scroll:true, snap:"*", snapTolerance:5});
    this.ref.bind("dragstop", $.proxy(function(){ this.updateOffset(); }, this));
    // No resize event :(
    this.ref.bind("mouseup", $.proxy(function(){ this.updateSize(); }, this));
    this.ref.bind("focus", $.proxy(function(){ this._class.selected = this; }, this));
    this.ref.bind("click", $.proxy(function(){ this._class.selected = this; }, this));

    this.save();
    $("body").append(this.ref);
  },
  
  remove: function(){
    if (this.ref)
      this.ref.remove();
  },
  
  updateOffset: function(){
    var offset = this.ref.offset();
    this.top  = offset.top;
    this.left = offset.left;
    this.save();
  },
  
  updateSize: function(){
    this.width  = this.ref.width();
    this.height = this.ref.height();
    this.save();
  },
  
  relativeMove: function(x, y) {
    this.left += (x || 0);
    this.top  += (y || 0);
    this.ref.css({
      left: this.left,
      top: this.top
    });
    this.save();
  }
});

// Element#ref is a html element, which can't be serialized.
Element.serializeRecords = function(){
  var result = {};
  for(var key in this.records) {
    result[key] = this.records[key].attributes();
    delete result[key].ref;
  }
  return result;
};

Element.selectedUpdate = jQuery.noop;

Element.getters({
  selected: function(){
    return this._selected;
  }
});

Element.setters({
  selected: function(value){
    this._selected = value;
    this.selectedUpdate(value);
  }
});

Element.fn.getters({
  html: function(){
    if (this.ref) return(this.ref.outerHTML())
    return this._html;
  },
  
  name: function(){
    return this.type().name + " #" + this.id;
  },
  
  zindex: function(){
    var zi = this.ref && this.ref.css("z-index");
    return(parseInt(zi) || 0);
  }
});

Element.fn.setters({
  typeName: function(name){
    this.typeID = Type.forName(name).id;
  },
  
  html: function(html){
    this._html = html;
  },
  
  zindex: function(value){
    this.ref.css("z-index", value);
  }
});

Element.afterCreate(function(el){
  el.append();
});

Element.afterDestroy(function(el){
  el.remove();
});

jQuery(function($){
  var ymockup  = $("#ymockup")
  ymockup.draggable();
  
  var ymockupCreate = ymockup.find("[data-name='create']");
  
  ymockupCreate.find("form").live("submit", function(){
    Element.create({typeName: ymockup.find("select").val()})
    return false;
  });
  
  Type.chain(ymockupCreate, {
    anchor:"select", 
    builder: function(){
      var data = this.item();
      this.text(data.name);
    }
  });
  
  ymockup.find("[data-name='clear'] button").click(function(){
    Element.destroyAll();
    Element.selected = null;
    return false;
  });
  
  var ymockupSelected = ymockup.find("[data-name='selected']");
  
  ymockupSelected.find("button").click(function(){
    Element.selected.destroy();
    Element.selected = null;
    return false;
  });
  
  ymockupSelected.find("input").change(function(){
    Element.selected.zindex = $(this).val();
  });
  
  Element.selectedUpdate = function(value){
    ymockupSelected[value ? "show" : "hide"]();
    if( value ) {
      ymockupSelected.find("span").text(value.name);
      ymockupSelected.find("input").val(value.zindex);
    }
  };
  Element.selected = null;
  
  $("body").keydown(function(e){
    if ( !Element.selected ) return;
    if ( !e.ctrlKey ) return;
    var keyCode = e.keyCode || e.which,
        arrow = {left: 37, up: 38, right: 39, down: 40 };

     switch (keyCode) {
       case arrow.left:
         Element.selected.relativeMove(-1, 0);
         return false;
       break;
       case arrow.up:
         Element.selected.relativeMove(0, -1);
         return false;
       break;
       case arrow.right:
         Element.selected.relativeMove(1, 0);
         return false;
       break;
       case arrow.down:
         Element.selected.relativeMove(0, 1);
         return false;
       break;
     }
  });
  
  $.get("types.html", function(data){
    $("#ymockupTypes").html(data);
    
    $("#ymockupTypes >*").each(function(i, element){
      element = $(element);
      Type.create({
        name: element.dataName(), 
        html: element.outerHTML(),
        ref: element
      });
    });
    
    Element.append();
  });
});